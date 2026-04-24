import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - อัปเดตสถานะคำร้องและเพิ่มรายละเอียดการแก้ไข
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simple token validation (you can enhance this later)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      status, 
      notes, 
      assignedTo,
      resolutionDetails,
      resolutionImages 
    } = body

    // ตรวจสอบว่ามีคำร้องนี้อยู่จริง
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id }
    })

    if (!complaint) {
      return NextResponse.json({ error: 'ไม่พบคำร้องนี้' }, { status: 404 })
    }

    // สร้างข้อมูลสำหรับการอัปเดต
    const updateData: any = {
      status,
      notes,
      updatedAt: new Date()
    }

    // ถ้ามีการมอบหมายงาน
    if (assignedTo) {
      updateData.assignedTo = assignedTo
    }

    // ถ้าสถานะเป็น RESOLVED ให้เพิ่มข้อมูลการแก้ไข
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = 'admin' // Simple fallback
      updateData.resolutionDetails = resolutionDetails
      updateData.resolutionImages = resolutionImages || '[]'
    }

    // อัปเดตคำร้อง
    const updatedComplaint = await prisma.complaint.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะคำร้องเรียบร้อย',
      complaint: updatedComplaint
    })

  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตคำร้อง' },
      { status: 500 }
    )
  }
}

// GET - ดูรายละเอียดคำร้อง (สำหรับทีมงาน)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simple token validation
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id }
    })

    if (!complaint) {
      return NextResponse.json({ error: 'ไม่พบคำร้องนี้' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      complaint
    })

  } catch (error) {
    console.error('Error fetching complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดูข้อมูลคำร้อง' },
      { status: 500 }
    )
  }
}
