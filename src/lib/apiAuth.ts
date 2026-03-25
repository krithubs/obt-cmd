/**
 * API route authentication middleware
 * Verifies JWT token from cookies for protected endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AuthUser } from './auth'

export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(request: NextRequest): { user: AuthUser } | NextResponse {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json(
      { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' },
      { status: 401 }
    )
  }
  return { user }
}
