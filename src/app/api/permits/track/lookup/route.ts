import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`permit-lookup:${ip}`, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!rate.allowed)
      return NextResponse.json({ error: 'ค้นหามากเกินไป' }, { status: 429 })

    const body = await request.json()
    const requestNo = String(body.requestNo || '').trim()
    const phone = String(body.phone || '').trim()
    if (!requestNo || !phone)
      return NextResponse.json(
        { error: 'กรุณากรอกเลขที่คำร้องและเบอร์โทร' },
        { status: 400 }
      )

    const item = await prisma.permitRequest.findFirst({
      where: { requestNo, phone },
      select: { trackingToken: true },
    })
    if (!item)
      return NextResponse.json({ error: 'ไม่พบคำร้องที่ตรงกัน' }, { status: 404 })
    return NextResponse.json({ trackingToken: item.trackingToken })
  } catch (error) {
    console.error('Error looking up permit:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
