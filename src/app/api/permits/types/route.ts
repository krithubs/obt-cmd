import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { slugify } from '@/lib/permit'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const forcePublic = url.searchParams.get('public') === '1'
  const isAdmin = !forcePublic && !(requireAuth(request) instanceof NextResponse)
  try {
    const types = await prisma.permitType.findMany({
      where: isAdmin ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching permit types:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อประเภทคำร้อง' }, { status: 400 })
    }
    const baseSlug = body.slug ? slugify(String(body.slug)) : slugify(name)
    let slug = baseSlug || `permit-${Date.now()}`
    let n = 1
    while (await prisma.permitType.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    await prisma.permitTypeTombstone.deleteMany({ where: { slug } }).catch(() => null)
    const created = await prisma.permitType.create({
      data: {
        id: `permit-type-${Date.now()}`,
        name,
        slug,
        category: body.category ? String(body.category) : 'general',
        description: body.description ? String(body.description) : null,
        formFileUrl: body.formFileUrl ? String(body.formFileUrl) : null,
        requiredDocs: JSON.stringify(Array.isArray(body.requiredDocs) ? body.requiredDocs : []),
        isActive: body.isActive !== false,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating permit type:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
