import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`permit-slip:${ip}`, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000,
    })
    if (!rate.allowed)
      return NextResponse.json({ error: 'อัปโหลดบ่อยเกินไป' }, { status: 429 })

    const body = await request.json()
    const slipUrl = body.slipUrl ? String(body.slipUrl) : null
    const note = body.note ? String(body.note).trim() : null
    if (!slipUrl)
      return NextResponse.json({ error: 'กรุณาแนบสลิป' }, { status: 400 })

    const existing = await prisma.permitRequest.findUnique({
      where: { trackingToken: params.token },
    })
    if (!existing)
      return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    if (existing.status !== 'AWAITING_PAYMENT') {
      return NextResponse.json(
        { error: 'ขณะนี้ไม่สามารถอัปโหลดสลิปได้' },
        { status: 400 }
      )
    }

    const [updated] = await prisma.$transaction([
      prisma.permitRequest.update({
        where: { id: existing.id },
        data: {
          paymentSlipUrl: slipUrl,
          status: 'PAYMENT_VERIFYING',
          updatedAt: new Date(),
        },
      }),
      prisma.permitStatusHistory.create({
        data: {
          id: `permit-hist-${Date.now()}`,
          requestId: existing.id,
          fromStatus: 'AWAITING_PAYMENT',
          toStatus: 'PAYMENT_VERIFYING',
          note: note || 'ผู้ใช้แนบสลิปการชำระเงิน',
          attachments: JSON.stringify([{ url: slipUrl }]),
          changedBy: 'applicant',
        },
      }),
    ])

    return NextResponse.json({ status: updated.status }, { status: 200 })
  } catch (error) {
    console.error('Error uploading slip:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
