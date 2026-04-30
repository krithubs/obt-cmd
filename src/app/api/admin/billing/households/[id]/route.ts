import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const item = await prisma.household.findUnique({
      where: { id: params.id },
      include: {
        bills: { orderBy: { createdAt: 'desc' } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { items: { include: { bill: true } } },
        },
      },
    })
    if (!item) return NextResponse.json({ error: 'ไม่พบ' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error get household:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.houseNo === 'string') data.houseNo = body.houseNo.trim()
    if (typeof body.villageNo === 'string' || body.villageNo === null)
      data.villageNo = body.villageNo
    if (typeof body.address === 'string' || body.address === null)
      data.address = body.address
    if (typeof body.ownerName === 'string') data.ownerName = body.ownerName.trim()
    if (typeof body.ownerIdCard === 'string' || body.ownerIdCard === null)
      data.ownerIdCard = body.ownerIdCard
        ? String(body.ownerIdCard).replace(/[^0-9]/g, '')
        : null
    if (typeof body.phone === 'string' || body.phone === null) data.phone = body.phone
    if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive

    const updated = await prisma.household.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error update household:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const billCount = await prisma.residentBill.count({ where: { householdId: params.id } })
    if (billCount > 0) {
      return NextResponse.json(
        { error: `ลบไม่ได้ มีบิล ${billCount} รายการผูกอยู่ — แนะนำให้ปิดการใช้งานแทน` },
        { status: 409 }
      )
    }
    await prisma.household.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error delete household:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
