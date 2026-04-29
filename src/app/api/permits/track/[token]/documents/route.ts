import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { parseDocuments } from '@/lib/permit'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`permit-extra:${ip}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      return NextResponse.json({ error: 'ส่งคำขอบ่อยเกินไป' }, { status: 429 })
    }

    const body = await request.json()
    const newDocs = Array.isArray(body.documents) ? body.documents : []
    const note = body.note ? String(body.note).trim() : null
    if (newDocs.length === 0)
      return NextResponse.json({ error: 'กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์' }, { status: 400 })

    const existing = await prisma.permitRequest.findUnique({
      where: { trackingToken: params.token },
    })
    if (!existing) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    if (existing.status !== 'NEED_MORE_INFO') {
      return NextResponse.json(
        { error: 'ขณะนี้ไม่สามารถแนบเอกสารเพิ่มได้' },
        { status: 400 }
      )
    }

    const merged = [...parseDocuments(existing.documents), ...newDocs]

    const [updated] = await prisma.$transaction([
      prisma.permitRequest.update({
        where: { id: existing.id },
        data: {
          documents: JSON.stringify(merged),
          status: 'UNDER_REVIEW',
          updatedAt: new Date(),
        },
      }),
      prisma.permitStatusHistory.create({
        data: {
          id: `permit-hist-${Date.now()}`,
          requestId: existing.id,
          fromStatus: 'NEED_MORE_INFO',
          toStatus: 'UNDER_REVIEW',
          note: note || 'ผู้ใช้ส่งเอกสารเพิ่มเติม',
          attachments: JSON.stringify(newDocs),
          changedBy: 'applicant',
        },
      }),
    ])

    return NextResponse.json({ status: updated.status }, { status: 200 })
  } catch (error) {
    console.error('Error uploading extra docs:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
