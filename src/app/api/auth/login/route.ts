import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณาระบุอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'บัญชีผู้ใช้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: {
          id: `audit-${Date.now()}-fail`,
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          details: JSON.stringify({ email, reason: 'Invalid password' }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          userId: user.id
        }
      }).catch(err => console.error('Failed to create audit log:', err))

      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Log successful login
    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}-login`,
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        details: JSON.stringify({ email, name: user.name }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: user.id
      }
    }).catch(err => console.error('Failed to create audit log:', err))

    const { password: _, ...userWithoutPassword } = user

    // Generate real JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'STAFF'
    })

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: userWithoutPassword,
      token
    })

    // Set HTTP-only cookie with JWT
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    )
  }
}
