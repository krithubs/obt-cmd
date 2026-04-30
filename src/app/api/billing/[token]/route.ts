import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const household = await prisma.household.findUnique({
      where: { lookupToken: params.token },
      include: {
        bills: {
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            items: { include: { bill: true } },
          },
        },
      },
    })
    if (!household || !household.isActive)
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })

    return NextResponse.json({
      household: {
        houseNo: household.houseNo,
        villageNo: household.villageNo,
        address: household.address,
        ownerName: household.ownerName,
        phone: household.phone,
        lookupToken: household.lookupToken,
      },
      bills: household.bills,
      payments: household.payments,
    })
  } catch (error) {
    console.error('Error fetching household billing:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
