import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { validateComplaintInput } from '@/lib/validation'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

// GET /api/complaints — Admin only (returns all fields including personal data)
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(complaints)
  } catch (error) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง' },
      { status: 500 }
    )
  }
}

// Generate unique ticket number with retry
async function generateTicketNo(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    const ticketNo = `CT${year}${month}${day}${random}`
    
    const existing = await prisma.complaint.findUnique({ where: { ticketNo } })
    if (!existing) return ticketNo
  }
  // Fallback: use timestamp for guaranteed uniqueness
  return `CT${Date.now()}`
}

// POST /api/complaints — Public (with rate limiting + validation)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 complaints per IP per hour
    const ip = getClientIp(request)
    const rateCheck = checkRateLimit(ip, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'ส่งคำร้องมากเกินไป กรุณารอสักครู่แล้วลองใหม่', remaining: rateCheck.remaining },
        { status: 429 }
      )
    }

    const rawData = await request.json()
    
    // Validate and sanitize input
    const validation = validateComplaintInput(rawData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', '), errors: validation.errors },
        { status: 400 }
      )
    }

    const { sanitized } = validation
    const ticketNo = await generateTicketNo()

    const newComplaint = await prisma.complaint.create({
      data: {
        id: `complaint-${Date.now()}`,
        ticketNo,
        name: sanitized.name,
        phone: sanitized.phone,
        type: sanitized.type,
        description: sanitized.description,
        location: `${sanitized.village} ${sanitized.location || ''}`.trim(),
        latitude: typeof rawData.latitude === 'number' ? rawData.latitude : null,
        longitude: typeof rawData.longitude === 'number' ? rawData.longitude : null,
        images: JSON.stringify(sanitized.images),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create audit log
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    const userId = adminUser?.id || 'system'
    
    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'CREATE',
        resource: 'COMPLAINT',
        resourceId: newComplaint.id,
        details: JSON.stringify({ ticketNo, name: sanitized.name, type: sanitized.type }),
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json(newComplaint, { status: 201 })
  } catch (error) {
    console.error('Error creating complaint:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างคำร้อง' },
      { status: 500 }
    )
  }
}
