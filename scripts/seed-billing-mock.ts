import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

type BillType = 'WATER' | 'ELECTRICITY' | 'TAX' | 'WASTE'

const FIRST_NAMES = [
  'สมชาย', 'สมหญิง', 'มานพ', 'วิชัย', 'นภา', 'ชาตรี', 'พรรณี', 'ธวัช',
  'อุไรวรรณ', 'ประยุทธ', 'จันทร์เพ็ญ', 'สำรวย', 'ปราณี', 'ทวีศักดิ์', 'ละออง',
  'บุญมา', 'ดวงใจ', 'รัตนา', 'ภาณุ', 'อรรถพล', 'นิตยา', 'สุดา', 'จรัส', 'ทองดี',
  'ไพศาล', 'มาลี', 'อำนวย', 'พิมพ์ใจ', 'สมปอง', 'แก้วตา', 'อนันต์', 'พิชัย',
  'ศรีนวล', 'ดอกไม้', 'ณรงค์', 'นรินทร์', 'อรุณ', 'สมบัติ', 'มยุรี', 'ชูศักดิ์',
  'วรรณา', 'พงษ์ศักดิ์', 'อรพรรณ', 'จำเนียร', 'พีระ', 'รุ่งทิวา', 'ทวี', 'สมศักดิ์',
  'อัมพร', 'บัวลอย', 'พจนีย์', 'ธนากร', 'ฉวี', 'ประสิทธิ์', 'ทองคำ',
]
const LAST_NAMES = [
  'ใจดี', 'ใจงาม', 'รักสะอาด', 'ขยันเรียน', 'สุขสันต์', 'เจริญดี', 'วงศ์ใหญ่',
  'มีทรัพย์', 'ดวงดี', 'พึ่งตน', 'ศรีสุข', 'ใจกล้า', 'วิริยะ', 'ทรัพย์เพิ่ม',
  'ฟ้าใส', 'ภูมิดี', 'ทองงาม', 'พรพิพัฒน์', 'ดีพรหม', 'แก้วใส', 'รุ่งโรจน์',
  'ทรงศรี', 'พุทธวงศ์', 'อุดมสุข', 'สิทธิชัย', 'มงคลชัย', 'พงศ์พัฒน์',
  'รักไทย', 'อัครภูมิ', 'จิตอารี', 'ภักดี', 'ศิริชัย', 'ชาญชัย', 'นันทวัฒน์',
]

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 50 households spread across 7 หมู่
const HOUSEHOLDS = (() => {
  const list: {
    houseNo: string
    village: string
    owner: string
    phone: string
    id: string
    address: string
  }[] = []
  let phoneSeq = 5000
  let idSeq = 100000
  for (let v = 1; v <= 7; v++) {
    const count = rand(5, 9) // 5–9 บ้านต่อหมู่
    for (let n = 1; n <= count; n++) {
      const minor = Math.random() < 0.5 ? '' : `/${rand(1, 12)}`
      list.push({
        houseNo: `${v * 10 + n}${minor}`,
        village: String(v),
        owner: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: `08${String(++phoneSeq).padStart(8, '0')}`,
        id: `1101700${String(++idSeq).slice(-7)}`,
        address: `หมู่ ${v} ต.สีลม อ.บางรัก`,
      })
    }
  }
  return list
})()

function makeBill(
  householdId: string,
  type: BillType,
  period: string,
  amount: number,
  status: 'UNPAID' | 'PAID',
  dueDate: Date | null,
  description: string,
  seq: number
) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = { WATER: 'W', ELECTRICITY: 'E', TAX: 'T', WASTE: 'X' }[type]
  return {
    id: `bill-${householdId}-${type}-${period}-${seq}`,
    billNo: `B${prefix}${y}${m}${String(seq).padStart(5, '0')}`,
    householdId,
    billType: type,
    period,
    description,
    amount,
    dueDate,
    status,
    paidAt:
      status === 'PAID' ? new Date(now.getTime() - rand(1, 30) * 86400000) : null,
    notes: null,
    updatedAt: new Date(),
  }
}

async function main() {
  console.log('Cleaning previous mock data...')
  await prisma.billPaymentItem.deleteMany({})
  await prisma.billPayment.deleteMany({})
  await prisma.residentBill.deleteMany({})
  await prisma.household.deleteMany({})

  const total = HOUSEHOLDS.length
  // ~60% ของบ้านมีบิล, ที่เหลือเป็นบ้านในทะเบียนแต่ยังไม่มีบิล
  const billedCount = Math.round(total * 0.6)
  console.log(
    `Inserting ${total} households (${billedCount} with bills, ${total - billedCount} without)...`
  )
  let billSeq = 1
  let billsCreated = 0

  for (let i = 0; i < total; i++) {
    const h = HOUSEHOLDS[i]
    const householdId = `mock-household-${i + 1}`
    await prisma.household.create({
      data: {
        id: householdId,
        houseNo: h.houseNo,
        villageNo: h.village,
        address: h.address,
        ownerName: h.owner,
        ownerIdCard: h.id,
        phone: h.phone,
        notes: null,
        lookupToken: randomUUID(),
        isActive: true,
        updatedAt: new Date(),
      },
    })

    if (i >= billedCount) {
      console.log(`  ${h.houseNo} (${h.owner}) — no bills (registered only)`)
      continue
    }

    const bills: Parameters<typeof prisma.residentBill.create>[0]['data'][] = []
    const monthsBack = rand(2, 4)
    const now = new Date()

    for (let back = monthsBack - 1; back >= 0; back--) {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const due = new Date(d.getFullYear(), d.getMonth(), 25)
      const isCurrent = back === 0

      // ค่าน้ำ — บางบ้านอาจไม่ใช้น้ำประปา
      if (Math.random() < 0.85) {
        const waterUnits = rand(8, 35)
        const waterAmt = waterUnits * 8 + 30
        bills.push(
          makeBill(
            householdId,
            'WATER',
            period,
            waterAmt,
            isCurrent ? 'UNPAID' : 'PAID',
            due,
            `น้ำใช้ ${waterUnits} หน่วย`,
            billSeq++
          )
        )
      }

      // ค่าไฟ
      if (Math.random() < 0.95) {
        const elecUnits = rand(50, 280)
        const elecAmt = Math.round(elecUnits * 4.2 + 50)
        bills.push(
          makeBill(
            householdId,
            'ELECTRICITY',
            period,
            elecAmt,
            isCurrent ? 'UNPAID' : 'PAID',
            due,
            `ไฟใช้ ${elecUnits} kWh`,
            billSeq++
          )
        )
      }

      // ค่าขยะ — บ้านส่วนใหญ่
      if (Math.random() < 0.9) {
        bills.push(
          makeBill(
            householdId,
            'WASTE',
            period,
            40,
            isCurrent ? 'UNPAID' : 'PAID',
            due,
            'ค่าธรรมเนียมเก็บขยะ',
            billSeq++
          )
        )
      }
    }

    // ภาษีรายปี (~30% ของบ้าน)
    if (Math.random() < 0.3) {
      const yearAd = new Date().getFullYear()
      const taxAmt = rand(150, 1200)
      bills.push(
        makeBill(
          householdId,
          'TAX',
          String(yearAd),
          taxAmt,
          'UNPAID',
          new Date(yearAd, 3, 30),
          'ภาษีที่ดินและสิ่งปลูกสร้าง',
          billSeq++
        )
      )
    }

    for (const b of bills) {
      await prisma.residentBill.create({ data: b })
    }
    billsCreated += bills.length
    console.log(
      `  ${h.houseNo} (${h.owner}) — ${bills.length} bills (${bills.filter((x) => x.status === 'UNPAID').length} unpaid)`
    )
  }

  console.log('\n========== Summary ==========')
  console.log(`Households: ${total}`)
  console.log(`  with bills: ${billedCount}`)
  console.log(`  without bills: ${total - billedCount}`)
  const billCount = await prisma.residentBill.count()
  const unpaidCount = await prisma.residentBill.count({ where: { status: 'UNPAID' } })
  console.log(`Bills: ${billCount} total, ${unpaidCount} unpaid, ${billCount - unpaidCount} paid`)
  console.log('\nตัวอย่างที่ใช้ทดสอบได้:')
  for (let i = 0; i < 5; i++) {
    const h = HOUSEHOLDS[i]
    console.log(`  บ้านเลขที่ ${h.houseNo} → ชื่อเจ้าบ้าน: "${h.owner}"`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
