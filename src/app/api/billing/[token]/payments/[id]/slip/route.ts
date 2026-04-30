import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`billing-slip:${ip}`, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!rate.allowed)
      return NextResponse.json({ error: 'ส่งสลิปบ่อยเกินไป' }, { status: 429 })

    const body = await request.json()
    const slipUrl = body.slipUrl ? String(body.slipUrl) : null
    const method = body.method ? String(body.method) : 'QR'
    if (!slipUrl)
      return NextResponse.json({ error: 'กรุณาแนบสลิป' }, { status: 400 })

    const household = await prisma.household.findUnique({
      where: { lookupToken: params.token },
      select: { id: true },
    })
    if (!household)
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })

    const payment = await prisma.billPayment.findFirst({
      where: { id: params.id, householdId: household.id },
    })
    if (!payment)
      return NextResponse.json({ error: 'ไม่พบรายการชำระ' }, { status: 404 })
    if (payment.status !== 'PENDING' && payment.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'รายการนี้ไม่สามารถส่งสลิปได้' },
        { status: 400 }
      )
    }

    const updated = await prisma.billPayment.update({
      where: { id: payment.id },
      data: {
        paymentSlipUrl: slipUrl,
        method,
        status: 'VERIFYING',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ status: updated.status })
  } catch (error) {
    console.error('Error upload slip:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
