import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    const list = await prisma.billPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        household: { select: { houseNo: true, ownerName: true } },
        items: { include: { bill: true } },
      },
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error list payments:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
