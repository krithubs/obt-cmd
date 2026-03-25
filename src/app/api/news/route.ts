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
      images: JSON.parse(item.images || '[]')
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
    const newsData = await request.json()
    
    // Validate required fields
    if (!newsData.title || !newsData.content || !newsData.category || !newsData.authorId) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Length limits
    if (newsData.title.length > FIELD_LIMITS.NEWS_TITLE) {
      return NextResponse.json(
        { error: `หัวข้อต้องไม่เกิน ${FIELD_LIMITS.NEWS_TITLE} ตัวอักษร` },
        { status: 400 }
      )
    }
    if (newsData.content.length > FIELD_LIMITS.NEWS_CONTENT) {
      return NextResponse.json(
        { error: `เนื้อหาต้องไม่เกิน ${FIELD_LIMITS.NEWS_CONTENT} ตัวอักษร` },
        { status: 400 }
      )
    }

    const newNews = await prisma.news.create({
      data: {
        id: `news-${Date.now()}`,
        title: newsData.title,
        content: newsData.content,
        category: newsData.category,
        images: JSON.stringify(newsData.images || []),
        isActive: newsData.isActive ?? true,
        authorId: newsData.authorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'CREATE',
        resource: 'NEWS',
        resourceId: newNews.id,
        details: JSON.stringify({ title: newsData.title, category: newsData.category }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: newsData.authorId,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json(newNews, { status: 201 })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างประชาสัมพันธ์' },
      { status: 500 }
    )
  }
}
