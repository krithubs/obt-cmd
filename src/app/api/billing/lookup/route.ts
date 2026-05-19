import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(`billing-lookup:${ip}`, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!rate.allowed)
      return NextResponse.json({ error: 'ค้นหามากเกินไป' }, { status: 429 })

    const body = await request.json()
    const houseNo = String(body.houseNo || '').trim()
    const fullName = String(body.fullName || '').trim()

    if (!houseNo)
      return NextResponse.json({ error: 'กรุณาระบุบ้านเลขที่' }, { status: 400 })
    if (fullName.length < 2)
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อ-นามสกุลเจ้าบ้าน' },
        { status: 400 }
      )

    const household = await prisma.household.findUnique({
      where: { houseNo },
    })
    if (!household || !household.isActive)
      return NextResponse.json(
        { error: 'ไม่พบบ้านเลขที่นี้ในระบบ — กรุณาติดต่อเจ้าหน้าที่ผู้ใหญ่ลี' },
        { status: 404 }
      )

    const trimmedInput = fullName.replace(/\s+/g, '').toLowerCase()
    const ownerNorm = household.ownerName.replace(/\s+/g, '').toLowerCase()
    if (!ownerNorm.includes(trimmedInput) && !trimmedInput.includes(ownerNorm))
      return NextResponse.json(
        { error: 'ชื่อ-นามสกุลไม่ตรงกับเจ้าบ้านที่ลงทะเบียนไว้' },
        { status: 403 }
      )

    return NextResponse.json({
      lookupToken: household.lookupToken,
      ownerName: household.ownerName,
      houseNo: household.houseNo,
    })
  } catch (error) {
    console.error('Error billing lookup:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
