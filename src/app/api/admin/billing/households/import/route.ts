import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'
import { generateLookupToken } from '@/lib/billing'

type RowInput = {
  houseNo?: unknown
  villageNo?: unknown
  address?: unknown
  ownerName?: unknown
  ownerIdCard?: unknown
  phone?: unknown
  notes?: unknown
}

type Result = {
  inserted: number
  skipped: number
  errors: { row: number; houseNo: string; reason: string }[]
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const rows = Array.isArray(body.rows) ? (body.rows as RowInput[]) : []
    const onDuplicate = body.onDuplicate === 'update' ? 'update' : 'skip'

    if (rows.length === 0)
      return NextResponse.json({ error: 'ไม่มีข้อมูลให้นำเข้า' }, { status: 400 })
    if (rows.length > 2000)
      return NextResponse.json(
        { error: 'นำเข้าได้สูงสุด 2000 แถวต่อครั้ง' },
        { status: 400 }
      )

    const result: Result = { inserted: 0, skipped: 0, errors: [] }
    const seenInBatch = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const houseNo = String(r.houseNo ?? '').trim()
      const ownerName = String(r.ownerName ?? '').trim()
      if (!houseNo) {
        result.errors.push({ row: i + 1, houseNo: '', reason: 'ขาดบ้านเลขที่' })
        continue
      }
      if (!ownerName) {
        result.errors.push({ row: i + 1, houseNo, reason: 'ขาดชื่อเจ้าบ้าน' })
        continue
      }
      if (seenInBatch.has(houseNo)) {
        result.errors.push({
          row: i + 1,
          houseNo,
          reason: 'บ้านเลขที่ซ้ำในไฟล์',
        })
        continue
      }
      seenInBatch.add(houseNo)

      const data = {
        houseNo,
        villageNo: r.villageNo ? String(r.villageNo).trim() : null,
        address: r.address ? String(r.address).trim() : null,
        ownerName,
        ownerIdCard: r.ownerIdCard
          ? String(r.ownerIdCard).replace(/[^0-9]/g, '') || null
          : null,
        phone: r.phone ? String(r.phone).trim() : null,
        notes: r.notes ? String(r.notes).trim() : null,
        isActive: true,
        updatedAt: new Date(),
      }

      try {
        const existing = await prisma.household.findUnique({ where: { houseNo } })
        if (existing) {
          if (onDuplicate === 'update') {
            await prisma.household.update({
              where: { houseNo },
              data,
            })
            result.inserted++
          } else {
            result.skipped++
          }
        } else {
          await prisma.household.create({
            data: {
              ...data,
              id: `household-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              lookupToken: generateLookupToken(),
            },
          })
          result.inserted++
        }
      } catch (e) {
        result.errors.push({
          row: i + 1,
          houseNo,
          reason: e instanceof Error ? e.message : 'unknown error',
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error import households:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
