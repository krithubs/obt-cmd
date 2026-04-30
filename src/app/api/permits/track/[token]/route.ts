import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const item = await prisma.permitRequest.findUnique({
      where: { trackingToken: params.token },
      include: {
        permitType: {
          select: {
            name: true,
            slug: true,
            requiredDocs: true,
            requiresPayment: true,
            paymentQrUrl: true,
            paymentNote: true,
          },
        },
        history: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!item) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    return NextResponse.json({
      requestNo: item.requestNo,
      trackingToken: item.trackingToken,
      fullName: item.fullName,
      phone: item.phone,
      email: item.email,
      details: item.details,
      documents: item.documents,
      status: item.status,
      feeAmount: item.feeAmount,
      paymentSlipUrl: item.paymentSlipUrl,
      paidAt: item.paidAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      permitType: item.permitType,
      history: item.history.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        note: h.note,
        attachments: h.attachments,
        changedBy: h.changedBy === 'applicant' ? 'applicant' : 'staff',
        createdAt: h.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error tracking permit:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
