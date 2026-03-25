import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API for complaints - returns limited fields only (no personal data)
 * Used by the portal page to display recent complaints
 */
export async function GET() {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNo: true,
        type: true,
        description: true,
        location: true,
        status: true,
        createdAt: true,
        // Intentionally exclude: name, phone, email, notes, assignedTo, images
      }
    })
    return NextResponse.json(complaints)
  } catch (error) {
    console.error('Error fetching public complaints:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง' },
      { status: 500 }
    )
  }
}
