import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const household = await prisma.household.findUnique({
      where: { lookupToken: params.token },
      select: { id: true },
    })
    if (!household)
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })

    const payment = await prisma.billPayment.findFirst({
      where: { id: params.id, householdId: household.id },
      include: {
        items: { include: { bill: true } },
      },
    })
    if (!payment)
      return NextResponse.json({ error: 'ไม่พบรายการชำระ' }, { status: 404 })

    const setting = await prisma.billingSetting.findUnique({
      where: { id: 'default' },
    })

    return NextResponse.json({ payment, setting })
  } catch (error) {
    console.error('Error get payment:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
