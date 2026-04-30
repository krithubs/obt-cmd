import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url)
    const forcePublic = url.searchParams.get('public') === '1'
    const type = await prisma.permitType.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    })
    if (!type) return NextResponse.json({ error: 'ไม่พบประเภทคำร้อง' }, { status: 404 })
    const isAdmin = !forcePublic && !(requireAuth(request) instanceof NextResponse)
    if (!type.isActive && !isAdmin) {
      return NextResponse.json({ error: 'ไม่พบประเภทคำร้อง' }, { status: 404 })
    }
    return NextResponse.json(type)
  } catch (error) {
    console.error('Error fetching permit type:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.name === 'string') data.name = body.name.trim()
    if (typeof body.category === 'string') data.category = body.category
    if (typeof body.description === 'string') data.description = body.description
    if (typeof body.formFileUrl === 'string' || body.formFileUrl === null)
      data.formFileUrl = body.formFileUrl
    if (Array.isArray(body.requiredDocs))
      data.requiredDocs = JSON.stringify(body.requiredDocs)
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.requiresPayment === 'boolean')
      data.requiresPayment = body.requiresPayment
    if (typeof body.paymentQrUrl === 'string' || body.paymentQrUrl === null)
      data.paymentQrUrl = body.paymentQrUrl
    if (typeof body.defaultFee === 'number' || body.defaultFee === null)
      data.defaultFee = body.defaultFee
    if (typeof body.paymentNote === 'string' || body.paymentNote === null)
      data.paymentNote = body.paymentNote

    const updated = await prisma.permitType.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating permit type:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const existing = await prisma.permitType.findUnique({ where: { id: params.id } })
    if (!existing)
      return NextResponse.json({ error: 'ไม่พบประเภทคำร้อง' }, { status: 404 })

    const count = await prisma.permitRequest.count({ where: { permitTypeId: params.id } })
    if (count > 0) {
      return NextResponse.json(
        {
          error: `ลบไม่ได้ มีคำร้อง ${count} รายการที่ใช้ประเภทนี้อยู่ — แนะนำให้ปิดการใช้งานแทน`,
          requestCount: count,
        },
        { status: 409 }
      )
    }

    await prisma.$transaction([
      prisma.permitType.delete({ where: { id: params.id } }),
      prisma.permitTypeTombstone.upsert({
        where: { slug: existing.slug },
        create: { slug: existing.slug, deletedAt: new Date() },
        update: { deletedAt: new Date() },
      }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting permit type:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
