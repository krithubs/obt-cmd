import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { generatePaymentNo } from '@/lib/billing'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`billing-checkout:${ip}`, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000,
    })
    if (!rate.allowed)
      return NextResponse.json({ error: 'ร้องขอบ่อยเกินไป' }, { status: 429 })

    const body = await request.json()
    const billIds = Array.isArray(body.billIds) ? (body.billIds as string[]) : []
    if (billIds.length === 0)
      return NextResponse.json({ error: 'กรุณาเลือกอย่างน้อย 1 บิล' }, { status: 400 })

    const household = await prisma.household.findUnique({
      where: { lookupToken: params.token },
    })
    if (!household || !household.isActive)
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })

    const bills = await prisma.residentBill.findMany({
      where: {
        id: { in: billIds },
        householdId: household.id,
        status: 'UNPAID',
      },
    })
    if (bills.length !== billIds.length)
      return NextResponse.json(
        { error: 'มีบิลบางรายการไม่ถูกต้องหรือถูกชำระไปแล้ว' },
        { status: 400 }
      )

    const total = bills.reduce((s, b) => s + Number(b.amount), 0)
    const paymentNo = await generatePaymentNo(prisma)

    const payment = await prisma.billPayment.create({
      data: {
        id: `bill-pay-${Date.now()}`,
        paymentNo,
        householdId: household.id,
        totalAmount: total,
        status: 'PENDING',
        items: {
          create: bills.map((b) => ({
            id: `bill-pay-item-${b.id}-${Date.now()}`,
            billId: b.id,
            amount: b.amount,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(
      { paymentId: payment.id, paymentNo: payment.paymentNo, totalAmount: total },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error checkout:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
