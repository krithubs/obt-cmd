import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { generateLookupToken } from '@/lib/billing'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim()
    const list = await prisma.household.findMany({
      where: q
        ? {
            OR: [
              { houseNo: { contains: q, mode: 'insensitive' } },
              { ownerName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { ownerIdCard: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        _count: { select: { bills: true, payments: true } },
      },
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error list households:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const houseNo = String(body.houseNo || '').trim()
    const ownerName = String(body.ownerName || '').trim()
    if (!houseNo || !ownerName)
      return NextResponse.json(
        { error: 'กรุณากรอกบ้านเลขที่และชื่อเจ้าบ้าน' },
        { status: 400 }
      )

    const exists = await prisma.household.findUnique({ where: { houseNo } })
    if (exists)
      return NextResponse.json(
        { error: `บ้านเลขที่ ${houseNo} มีอยู่ในระบบแล้ว` },
        { status: 409 }
      )

    const created = await prisma.household.create({
      data: {
        id: `household-${Date.now()}`,
        houseNo,
        villageNo: body.villageNo ? String(body.villageNo) : null,
        address: body.address ? String(body.address) : null,
        ownerName,
        ownerIdCard: body.ownerIdCard ? String(body.ownerIdCard).replace(/[^0-9]/g, '') : null,
        phone: body.phone ? String(body.phone) : null,
        notes: body.notes ? String(body.notes) : null,
        lookupToken: generateLookupToken(),
        isActive: body.isActive !== false,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error create household:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
