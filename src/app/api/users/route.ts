import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const userData = await request.json()
    
    // Validate required fields
    if (!userData.email?.trim() || !userData.name?.trim() || !userData.role) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อ อีเมล และบทบาท' },
        { status: 400 }
      )
    }

    // Length limits
    if (userData.name.trim().length > FIELD_LIMITS.USER_NAME) {
      return NextResponse.json(
        { error: `ชื่อต้องไม่เกิน ${FIELD_LIMITS.USER_NAME} ตัวอักษร` },
        { status: 400 }
      )
    }
    if (userData.email.trim().length > FIELD_LIMITS.USER_EMAIL) {
      return NextResponse.json(
        { error: `อีเมลต้องไม่เกิน ${FIELD_LIMITS.USER_EMAIL} ตัวอักษร` },
        { status: 400 }
      )
    }

    // Require password with length limits
    if (!userData.password || userData.password.length < FIELD_LIMITS.USER_PASSWORD_MIN) {
      return NextResponse.json(
        { error: `กรุณาระบุรหัสผ่าน (อย่างน้อย ${FIELD_LIMITS.USER_PASSWORD_MIN} ตัวอักษร)` },
        { status: 400 }
      )
    }
    if (userData.password.length > FIELD_LIMITS.USER_PASSWORD_MAX) {
      return NextResponse.json(
        { error: `รหัสผ่านต้องไม่เกิน ${FIELD_LIMITS.USER_PASSWORD_MAX} ตัวอักษร` },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['ADMIN', 'STAFF'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'บทบาทต้องเป็น ADMIN หรือ STAFF' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.trim() }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้มีผู้ใช้อยู่แล้ว' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        email: userData.email.trim(),
        name: userData.name.trim(),
        password: hashedPassword,
        role: userData.role,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date(),
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
        action: 'CREATE',
        resource: 'USER',
        resourceId: newUser.id,
        details: JSON.stringify({ email: newUser.email, name: newUser.name, role: newUser.role }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: auth.user.id,
        createdAt: new Date()
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' },
      { status: 500 }
    )
  }
}
