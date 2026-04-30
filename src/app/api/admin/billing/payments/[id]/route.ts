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
    const item = await prisma.billPayment.findUnique({
      where: { id: params.id },
      include: {
        household: true,
        items: { include: { bill: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'ไม่พบ' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error get payment:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult
  try {
    const body = await request.json()
    const action = String(body.action || '').trim()
    const note = body.note ? String(body.note) : null

    const payment = await prisma.billPayment.findUnique({
      where: { id: params.id },
      include: { items: true },
    })
    if (!payment) return NextResponse.json({ error: 'ไม่พบ' }, { status: 404 })

    if (action === 'verify') {
      if (payment.status !== 'VERIFYING') {
        return NextResponse.json(
          { error: 'รายการไม่ได้อยู่ในสถานะรอตรวจสอบ' },
          { status: 400 }
        )
      }
      const billIds = payment.items.map((i) => i.billId)
      const now = new Date()
      const [updated] = await prisma.$transaction([
        prisma.billPayment.update({
          where: { id: payment.id },
          data: {
            status: 'VERIFIED',
            paidAt: now,
            verifiedBy: user.id,
            verifiedAt: now,
            updatedAt: now,
          },
        }),
        prisma.residentBill.updateMany({
          where: { id: { in: billIds } },
          data: { status: 'PAID', paidAt: now, updatedAt: now },
        }),
      ])
      return NextResponse.json(updated)
    }

    if (action === 'reject') {
      const updated = await prisma.billPayment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          rejectionNote: note,
          updatedAt: new Date(),
        },
      })
      return NextResponse.json(updated)
    }

    if (action === 'cancel') {
      const updated = await prisma.billPayment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED', updatedAt: new Date() },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 })
  } catch (error) {
    console.error('Error update payment:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
