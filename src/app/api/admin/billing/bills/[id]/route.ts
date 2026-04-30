import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (body.amount !== undefined) data.amount = Number(body.amount)
    if (typeof body.description === 'string' || body.description === null)
      data.description = body.description
    if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes
    if (body.dueDate !== undefined)
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (typeof body.status === 'string') {
      data.status = body.status
      if (body.status === 'PAID') data.paidAt = new Date()
    }

    const updated = await prisma.residentBill.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error update bill:', error)
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
    const linkedItems = await prisma.billPaymentItem.count({
      where: { billId: params.id },
    })
    if (linkedItems > 0) {
      return NextResponse.json(
        {
          error: `ลบไม่ได้ บิลนี้ผูกกับการชำระ ${linkedItems} รายการ — แนะนำให้ตั้งสถานะเป็น "ยกเลิก" แทน`,
        },
        { status: 409 }
      )
    }
    await prisma.residentBill.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error delete bill:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
