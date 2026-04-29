import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { PERMIT_STATUSES, PermitStatus } from '@/lib/permit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const item = await prisma.permitRequest.findUnique({
      where: { id: params.id },
      include: {
        permitType: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!item) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching permit request:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult
  try {
    const body = await request.json()
    const toStatus = String(body.status || '').trim() as PermitStatus
    const note = body.note ? String(body.note).trim() : null

    if (!PERMIT_STATUSES.includes(toStatus)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 })
    }

    const existing = await prisma.permitRequest.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 })

    const [updated] = await prisma.$transaction([
      prisma.permitRequest.update({
        where: { id: params.id },
        data: {
          status: toStatus,
          assignedTo: existing.assignedTo || user.id,
          updatedAt: new Date(),
        },
      }),
      prisma.permitStatusHistory.create({
        data: {
          id: `permit-hist-${Date.now()}`,
          requestId: params.id,
          fromStatus: existing.status,
          toStatus,
          note,
          changedBy: user.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `audit-${Date.now()}`,
          action: 'UPDATE_STATUS',
          resource: 'PERMIT_REQUEST',
          resourceId: params.id,
          details: JSON.stringify({ from: existing.status, to: toStatus, note }),
          userId: user.id,
        },
      }),
    ])

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating permit request:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
