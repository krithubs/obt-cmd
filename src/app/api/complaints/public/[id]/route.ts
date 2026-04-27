import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Public API for a single complaint - safe fields only (no personal data).
 * Lookup accepts either the internal id or the public ticketNo.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const key = decodeURIComponent(params.id)

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id: key }, { ticketNo: key }],
      },
      select: {
        id: true,
        ticketNo: true,
        type: true,
        description: true,
        location: true,
        status: true,
        notes: true,
        images: true,
        resolutionImages: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    }

    return NextResponse.json(
      {
        ...complaint,
        images: JSON.parse(complaint.images || '[]'),
        resolutionImages: JSON.parse(complaint.resolutionImages || '[]'),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error fetching public complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง' },
      { status: 500 }
    )
  }
}
