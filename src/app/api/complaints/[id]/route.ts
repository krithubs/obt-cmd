import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { validateComplaintUpdate } from '@/lib/validation'
import { getClientIp } from '@/lib/rateLimit'

// GET /api/complaints/[id] — Admin only
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id }
    })
    if (!complaint) {
      return NextResponse.json(
        { error: 'ไม่พบคำร้อง' },
        { status: 404 }
      )
    }
    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error fetching complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง' },
      { status: 500 }
    )
  }
}

// PUT /api/complaints/[id] — Admin only, with status enum validation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const rawData = await request.json()
    
    // Validate update fields
    const validation = validateComplaintUpdate(rawData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', '), errors: validation.errors },
        { status: 400 }
      )
    }

    // Get current state before update
    const beforeUpdate = await prisma.complaint.findUnique({
      where: { id: params.id },
      select: { ticketNo: true, status: true, assignedTo: true, notes: true }
    })

    if (!beforeUpdate) {
      return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    }
    
    const { sanitized } = validation
    const updatedComplaint = await prisma.complaint.update({
      where: { id: params.id },
      data: {
        ...(sanitized.status && { status: sanitized.status }),
        ...(sanitized.notes !== undefined && { notes: sanitized.notes }),
        ...(sanitized.assignedTo !== undefined && { assignedTo: sanitized.assignedTo }),
        ...(sanitized.resolutionImages !== undefined && { resolutionImages: JSON.stringify(sanitized.resolutionImages) }),
        ...(sanitized.forwardedTo !== undefined && { forwardedTo: sanitized.forwardedTo }),
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'UPDATE',
        resource: 'COMPLAINT',
        resourceId: params.id,
        details: JSON.stringify({ 
          before: beforeUpdate,
          after: { status: updatedComplaint.status, assignedTo: updatedComplaint.assignedTo, notes: updatedComplaint.notes }
        }),
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: auth.user.id,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json(updatedComplaint)
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตคำร้อง' },
      { status: 500 }
    )
  }
}

// DELETE /api/complaints/[id] — Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      select: { ticketNo: true, name: true, type: true }
    })

    if (!complaint) {
      return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    }

    await prisma.complaint.delete({ where: { id: params.id } })

    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'DELETE',
        resource: 'COMPLAINT',
        resourceId: params.id,
        details: JSON.stringify({ ticketNo: complaint.ticketNo, name: complaint.name, type: complaint.type }),
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: auth.user.id,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json({ message: 'ลบคำร้องสำเร็จ' })
  } catch (error) {
    console.error('Error deleting complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบคำร้อง' },
      { status: 500 }
    )
  }
}
