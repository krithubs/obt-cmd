import { NextRequest, NextResponse } from 'next/server'

// Test auth endpoint
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }
    
    return NextResponse.json({ success: true, message: 'Authenticated' })
  } catch (error) {
    return NextResponse.json({ error: 'Auth error' }, { status: 500 })
  }
}
