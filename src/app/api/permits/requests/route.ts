import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { generateRequestNo, generateTrackingToken, parseRequiredDocs } from '@/lib/permit'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (q) {
      where.OR = [
        { requestNo: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ]
    }
    const list = await prisma.permitRequest.findMany({
      where,
      include: { permitType: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error listing permit requests:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`permit:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'ส่งคำร้องมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const permitTypeId = String(body.permitTypeId || '').trim()
    const fullName = String(body.fullName || '').trim()
    const phone = String(body.phone || '').trim()
    const address = body.address ? String(body.address).trim() : null
    const details = body.details ? String(body.details).trim() : ''
    const documents = Array.isArray(body.documents) ? body.documents : []

    if (!permitTypeId) return NextResponse.json({ error: 'กรุณาเลือกประเภทคำร้อง' }, { status: 400 })
    if (!fullName) return NextResponse.json({ error: 'กรุณากรอกชื่อ-นามสกุล' }, { status: 400 })
    if (!/^[0-9+\-\s]{8,15}$/.test(phone))
      return NextResponse.json({ error: 'เบอร์โทรไม่ถูกต้อง' }, { status: 400 })

    const permitType = await prisma.permitType.findUnique({ where: { id: permitTypeId } })
    if (!permitType || !permitType.isActive)
      return NextResponse.json({ error: 'ไม่พบประเภทคำร้อง' }, { status: 404 })

    const required = parseRequiredDocs(permitType.requiredDocs).filter((d) => d.required)
    const submittedKeys = new Set(documents.map((d: { key?: string }) => d?.key).filter(Boolean))
    const missing = required.filter((r) => !submittedKeys.has(r.key))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `กรุณาแนบเอกสาร: ${missing.map((m) => m.label).join(', ')}` },
        { status: 400 }
      )
    }

    const requestNo = await generateRequestNo(prisma)
    const trackingToken = generateTrackingToken()

    const created = await prisma.permitRequest.create({
      data: {
        id: `permit-${Date.now()}`,
        requestNo,
        trackingToken,
        permitTypeId,
        fullName,
        phone,
        email: null,
        address,
        details,
        documents: JSON.stringify(documents),
        status: 'SUBMITTED',
        updatedAt: new Date(),
        history: {
          create: {
            id: `permit-hist-${Date.now()}`,
            toStatus: 'SUBMITTED',
            note: 'ผู้ใช้ยื่นคำร้อง',
            changedBy: 'applicant',
          },
        },
      },
    })

    return NextResponse.json(
      { id: created.id, requestNo, trackingToken, status: created.status },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating permit request:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยื่นคำร้อง' }, { status: 500 })
  }
}
