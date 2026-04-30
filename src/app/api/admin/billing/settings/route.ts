import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const setting = await prisma.billingSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    })
    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error get billing setting:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (typeof body.centralQrUrl === 'string' || body.centralQrUrl === null)
      data.centralQrUrl = body.centralQrUrl
    if (Array.isArray(body.bankAccounts))
      data.bankAccounts = JSON.stringify(body.bankAccounts)
    if (typeof body.paymentNote === 'string' || body.paymentNote === null)
      data.paymentNote = body.paymentNote

    const updated = await prisma.billingSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error update billing setting:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
