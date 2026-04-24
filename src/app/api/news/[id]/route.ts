import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const newsItem = await prisma.news.findUnique({
      where: { id: params.id }
    })
    if (!newsItem) {
      return NextResponse.json(
        { error: 'ไม่พบประชาสัมพันธ์' },
        { status: 404 }
      )
    }
    return NextResponse.json({
      ...newsItem,
      images: JSON.parse(newsItem.images || '[]'),
      taggedUsers: JSON.parse(newsItem.taggedUsers || '[]')
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประชาสัมพันธ์' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const newsData = await request.json()

    // Length limits
    if (newsData.title && newsData.title.length > FIELD_LIMITS.NEWS_TITLE) {
      return NextResponse.json(
        { error: `หัวข้อต้องไม่เกิน ${FIELD_LIMITS.NEWS_TITLE} ตัวอักษร` },
        { status: 400 }
      )
    }
    if (newsData.content && newsData.content.length > FIELD_LIMITS.NEWS_CONTENT) {
      return NextResponse.json(
        { error: `เนื้อหาต้องไม่เกิน ${FIELD_LIMITS.NEWS_CONTENT} ตัวอักษร` },
        { status: 400 }
      )
    }
    
    // Get current state before update
    const beforeUpdate = await prisma.news.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        content: true,
        category: true,
        isActive: true
      }
    })
    
    const updatedNews = await prisma.news.update({
      where: { id: params.id },
      data: {
        ...(newsData.title && { title: newsData.title }),
        ...(newsData.content !== undefined && { content: newsData.content }),
        ...(newsData.category && { category: newsData.category }),
        ...(newsData.images && { images: JSON.stringify(newsData.images) }),
        ...(newsData.privacySetting && { privacySetting: newsData.privacySetting }),
        ...(newsData.taggedUsers && { taggedUsers: JSON.stringify(newsData.taggedUsers) }),
        ...(newsData.locationName !== undefined && { locationName: newsData.locationName }),
        ...(newsData.feelingActivity !== undefined && { feelingActivity: newsData.feelingActivity }),
        ...(newsData.isActive !== undefined && { isActive: newsData.isActive }),
        updatedAt: new Date()
      }
    })

    // Create audit log with before/after
    const userId = auth.user?.id
    const afterUpdate = {
      title: updatedNews.title,
      content: updatedNews.content,
      category: updatedNews.category,
      isActive: updatedNews.isActive
    }
    
    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'UPDATE',
        resource: 'NEWS',
        resourceId: params.id,
        details: JSON.stringify({ 
          before: beforeUpdate,
          after: afterUpdate
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json({
      ...updatedNews,
      images: JSON.parse(updatedNews.images || '[]'),
      taggedUsers: JSON.parse(updatedNews.taggedUsers || '[]')
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    })
  } catch (error) {
    console.error('Error updating news:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตประชาสัมพันธ์' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    // Get news info before deleting
    const news = await prisma.news.findUnique({
      where: { id: params.id },
      select: { title: true, category: true, authorId: true }
    })

    await prisma.news.delete({
      where: { id: params.id }
    })

    // Create audit log
    if (news) {
      const deleterId = auth.user?.id || news.authorId
      
      await prisma.auditLog.create({
        data: {
          id: `audit-${Date.now()}`,
          action: 'DELETE',
          resource: 'NEWS',
          resourceId: params.id,
          details: JSON.stringify({ title: news.title, category: news.category }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          userId: deleterId,
          createdAt: new Date()
        }
      }).catch(err => console.error('Failed to create audit log:', err))
    }

    return NextResponse.json({ message: 'ลบประชาสัมพันธ์สำเร็จ' })
  } catch (error) {
    console.error('Error deleting news:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบประชาสัมพันธ์' },
      { status: 500 }
    )
  }
}
