import { randomUUID } from 'crypto'
import { Droplet, Zap, ClipboardList, Trash2, type LucideIcon } from 'lucide-react'

export const BILL_TYPES = ['WATER', 'ELECTRICITY', 'TAX', 'WASTE'] as const
export type BillType = (typeof BILL_TYPES)[number]

export const BILL_TYPE_LABEL: Record<BillType, string> = {
  WATER: 'ค่าน้ำประปา',
  ELECTRICITY: 'ค่าไฟฟ้า',
  TAX: 'ภาษี',
  WASTE: 'ค่าขยะมูลฝอย',
}

export const BILL_TYPE_COLOR: Record<BillType, string> = {
  WATER: 'bg-sky-100 text-sky-700 border-sky-200',
  ELECTRICITY: 'bg-amber-100 text-amber-700 border-amber-200',
  TAX: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  WASTE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export const BILL_TYPE_ICON: Record<BillType, LucideIcon> = {
  WATER: Droplet,
  ELECTRICITY: Zap,
  TAX: ClipboardList,
  WASTE: Trash2,
}

export const BILL_STATUSES = ['UNPAID', 'PAID', 'WAIVED', 'CANCELLED'] as const
export type BillStatus = (typeof BILL_STATUSES)[number]

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  UNPAID: 'ค้างชำระ',
  PAID: 'ชำระแล้ว',
  WAIVED: 'ยกเว้น',
  CANCELLED: 'ยกเลิก',
}

export const PAYMENT_STATUSES = [
  'PENDING',
  'VERIFYING',
  'VERIFIED',
  'REJECTED',
  'CANCELLED',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'รอชำระ',
  VERIFYING: 'รอตรวจสอบสลิป',
  VERIFIED: 'ชำระสำเร็จ',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
}

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
  VERIFYING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  VERIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
}

export type BankAccount = {
  bankName: string
  accountNo: string
  accountName: string
  branch?: string
}

export function parseBankAccounts(json: string | null | undefined): BankAccount[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (b) =>
        b &&
        typeof b.bankName === 'string' &&
        typeof b.accountNo === 'string' &&
        typeof b.accountName === 'string'
    )
  } catch {
    return []
  }
}

export function generateLookupToken() {
  return randomUUID()
}

export async function generateBillNo(
  prisma: { residentBill: { findUnique: (args: { where: { billNo: string } }) => Promise<unknown> } },
  type: BillType,
  maxRetries = 5
): Promise<string> {
  const prefix = { WATER: 'W', ELECTRICITY: 'E', TAX: 'T', WASTE: 'X' }[type]
  for (let i = 0; i < maxRetries; i++) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const r = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
    const billNo = `B${prefix}${y}${m}${r}`
    const exists = await prisma.residentBill.findUnique({ where: { billNo } })
    if (!exists) return billNo
  }
  return `B${prefix}${Date.now()}`
}

export async function generatePaymentNo(
  prisma: { billPayment: { findUnique: (args: { where: { paymentNo: string } }) => Promise<unknown> } },
  maxRetries = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const r = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
    const paymentNo = `PY${y}${m}${d}${r}`
    const exists = await prisma.billPayment.findUnique({ where: { paymentNo } })
    if (!exists) return paymentNo
  }
  return `PY${Date.now()}`
}

export function formatBaht(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === '') return '—'
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function normalizeIdCard(s: string): string {
  return s.replace(/[^0-9]/g, '').slice(0, 13)
}

export function isValidIdCard(s: string): boolean {
  return /^[0-9]{13}$/.test(s)
}
