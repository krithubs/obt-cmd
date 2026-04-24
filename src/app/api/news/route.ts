import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FIELD_LIMITS } from '@/lib/fieldLimits'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const newsData = await prisma.news.findMany({
      where: {
        isActive: true,
        ...(category && category !== 'ALL' && { category })
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Parse images JSON string to array
    const news = newsData.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]'),
      taggedUsers: JSON.parse(item.taggedUsers || '[]')
    }))
    
    return NextResponse.json({ news })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประชาสัมพันธ์' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const data = await request.json()

    // Validate: content or images must exist (can post images-only)
    const hasContent = data.content && data.content.replace(/<[^>]*>/g, '').trim().length > 0
    const hasMedia = Array.isArray(data.images) && data.images.length > 0
    if (!hasContent && !hasMedia) {
      return NextResponse.json(
        { error: 'ต้องมีเนื้อหาหรือรูปภาพอย่างน้อย 1 อย่าง' },
        { status: 400 }
      )
    }

    // Title required
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุหัวข้อ' }, { status: 400 })
    }
    if (data.title.length > FIELD_LIMITS.NEWS_TITLE) {
      return NextResponse.json({ error: `หัวข้อต้องไม่เกิน ${FIELD_LIMITS.NEWS_TITLE} ตัวอักษร` }, { status: 400 })
    }
    if (data.content && data.content.length > FIELD_LIMITS.NEWS_CONTENT) {
      return NextResponse.json({ error: `เนื้อหาต้องไม่เกิน ${FIELD_LIMITS.NEWS_CONTENT} ตัวอักษร` }, { status: 400 })
    }

    // Validate privacy setting
    const validPrivacy = ['public', 'community_only', 'private']
    const privacySetting = validPrivacy.includes(data.privacySetting) ? data.privacySetting : 'public'

    // Validate tagged users (must be array of strings)
    let taggedUsers: string[] = []
    if (Array.isArray(data.taggedUsers)) {
      taggedUsers = data.taggedUsers.filter((id: unknown): id is string => typeof id === 'string').slice(0, 20)
    }

    // Sanitize optional fields
    const locationName = typeof data.locationName === 'string' ? data.locationName.substring(0, 200) : ''
    const feelingActivity = typeof data.feelingActivity === 'string' ? data.feelingActivity.substring(0, 100) : ''

    // Validate images array
    const images = Array.isArray(data.images)
      ? data.images.filter((url: unknown): url is string => typeof url === 'string').slice(0, 5)
      : []

    const authorId = auth.user?.id || data.authorId

    // Create post with transaction-like flow
    const newPost = await prisma.news.create({
      data: {
        id: `news-${Date.now()}`,
        title: data.title.trim(),
        content: data.content || '',
        category: data.category || 'ANNOUNCEMENT',
        images: JSON.stringify(images),
        privacySetting,
        taggedUsers: JSON.stringify(taggedUsers),
        locationName,
        feelingActivity,
        isActive: data.isActive ?? true,
        authorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'CREATE',
        resource: 'NEWS',
        resourceId: newPost.id,
        details: JSON.stringify({ title: newPost.title, category: newPost.category, privacySetting }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: authorId,
        createdAt: new Date()
      }
    }).catch(err => console.error('Audit log failed:', err))

    return NextResponse.json({
      ...newPost,
      images: JSON.parse(newPost.images),
      taggedUsers: JSON.parse(newPost.taggedUsers)
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างโพสต์' },
      { status: 500 }
    )
  }
}
