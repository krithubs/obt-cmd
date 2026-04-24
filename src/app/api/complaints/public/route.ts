import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Public API for complaints - returns limited fields only (no personal data)
 * Used by the portal page to display recent complaints
 */
export async function GET() {
  try {
    const complaintsData = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNo: true,
        type: true,
        description: true,
        location: true,
        status: true,
        createdAt: true,
        images: true,
        resolutionImages: true,
        // Intentionally exclude: name, phone, email, notes, assignedTo
      }
    })

    // Parse JSON string fields to arrays
    const complaints = complaintsData.map(c => ({
      ...c,
      images: JSON.parse(c.images || '[]'),
      resolutionImages: JSON.parse(c.resolutionImages || '[]')
    }))

    return NextResponse.json(complaints, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    })
  } catch (error) {
    console.error('Error fetching public complaints:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง' },
      { status: 500 }
    )
  }
}
