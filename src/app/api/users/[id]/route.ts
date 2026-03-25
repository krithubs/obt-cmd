import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
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
    const userData = await request.json()
    
    // Validate email format if provided
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Check if email already exists (excluding current user)
    if (userData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: userData.email,
          NOT: { id: params.id }
        }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'อีเมลนี้มีผู้ใช้อยู่แล้ว' },
          { status: 400 }
        )
      }
    }

    // Get current state before update
    const beforeUpdate = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(userData.name && { name: userData.name.trim() }),
        ...(userData.email && { email: userData.email.trim() }),
        ...(userData.role && ['ADMIN', 'STAFF'].includes(userData.role) && { role: userData.role }),
        ...(userData.isActive !== undefined && { isActive: userData.isActive }),
        ...(userData.password && userData.password.length >= 6 && { password: await bcrypt.hash(userData.password, 12) }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: params.id,
        details: JSON.stringify({ 
          before: beforeUpdate,
          after: { email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, isActive: updatedUser.isActive }
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: auth.user.id,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้' },
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
    // Get user info before deleting
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { email: true, name: true, role: true }
    })

    await prisma.user.delete({
      where: { id: params.id }
    })

    if (user) {
      await prisma.auditLog.create({
        data: {
          id: `audit-${Date.now()}`,
          action: 'DELETE',
          resource: 'USER',
          resourceId: params.id,
          details: JSON.stringify({ email: user.email, name: user.name, role: user.role }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          userId: auth.user.id,
          createdAt: new Date()
        }
      }).catch(err => console.error('Failed to create audit log:', err))
    }

    return NextResponse.json({ message: 'ลบผู้ใช้สำเร็จ' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' },
      { status: 500 }
    )
  }
}
