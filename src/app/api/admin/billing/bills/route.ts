import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { BILL_TYPES, BillType, generateBillNo } from '@/lib/billing'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const url = new URL(request.url)
    const householdId = url.searchParams.get('householdId')
    const status = url.searchParams.get('status')
    const billType = url.searchParams.get('billType')
    const where: Record<string, unknown> = {}
    if (householdId) where.householdId = householdId
    if (status) where.status = status
    if (billType) where.billType = billType
    const list = await prisma.residentBill.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        household: { select: { houseNo: true, ownerName: true } },
      },
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error list bills:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult
  try {
    const body = await request.json()
    const householdId = String(body.householdId || '').trim()
    const billType = String(body.billType || '').trim() as BillType
    const period = String(body.period || '').trim()
    const amount = Number(body.amount)

    if (!householdId)
      return NextResponse.json({ error: 'กรุณาระบุครัวเรือน' }, { status: 400 })
    if (!BILL_TYPES.includes(billType))
      return NextResponse.json({ error: 'ประเภทบิลไม่ถูกต้อง' }, { status: 400 })
    if (!period)
      return NextResponse.json({ error: 'กรุณาระบุงวด' }, { status: 400 })
    if (Number.isNaN(amount) || amount <= 0)
      return NextResponse.json({ error: 'ยอดเงินไม่ถูกต้อง' }, { status: 400 })

    const household = await prisma.household.findUnique({ where: { id: householdId } })
    if (!household)
      return NextResponse.json({ error: 'ไม่พบครัวเรือน' }, { status: 404 })

    const billNo = await generateBillNo(prisma, billType)

    const created = await prisma.residentBill.create({
      data: {
        id: `bill-${Date.now()}`,
        billNo,
        householdId,
        billType,
        period,
        description: body.description ? String(body.description) : null,
        amount,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'UNPAID',
        createdBy: user.id,
        notes: body.notes ? String(body.notes) : null,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error create bill:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
