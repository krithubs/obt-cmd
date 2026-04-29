import { randomUUID } from 'crypto'

export const PERMIT_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEED_MORE_INFO',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
] as const

export type PermitStatus = (typeof PERMIT_STATUSES)[number]

export const STATUS_LABEL: Record<PermitStatus, string> = {
  SUBMITTED: 'ยื่นคำร้องแล้ว',
  UNDER_REVIEW: 'อยู่ระหว่างตรวจสอบ',
  NEED_MORE_INFO: 'ต้องการเอกสารเพิ่ม',
  APPROVED: 'อนุมัติ',
  REJECTED: 'ไม่อนุมัติ',
  COMPLETED: 'ดำเนินการเสร็จสิ้น',
}

export const STATUS_COLOR: Record<PermitStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700 border-slate-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  NEED_MORE_INFO: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  COMPLETED: 'bg-violet-100 text-violet-700 border-violet-200',
}

export type RequiredDoc = {
  key: string
  label: string
  required: boolean
}

export type PermitDocument = {
  key: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export function parseRequiredDocs(json: string | null | undefined): RequiredDoc[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((d) => d && typeof d.key === 'string' && typeof d.label === 'string')
      .map((d) => ({ key: d.key, label: d.label, required: !!d.required }))
  } catch {
    return []
  }
}

export function parseDocuments(json: string | null | undefined): PermitDocument[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export async function generateRequestNo(
  prisma: { permitRequest: { findUnique: (args: { where: { requestNo: string } }) => Promise<unknown> } },
  maxRetries = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const r = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
    const requestNo = `PR${y}${m}${d}${r}`
    const exists = await prisma.permitRequest.findUnique({ where: { requestNo } })
    if (!exists) return requestNo
  }
  return `PR${Date.now()}`
}

export function generateTrackingToken() {
  return randomUUID()
}

export const PERMIT_CATEGORIES = [
  { key: 'construction', label: 'ก่อสร้างและสาธารณูปโภค', icon: '🏗️' },
  { key: 'business', label: 'ประกอบกิจการและใบอนุญาต', icon: '🏪' },
  { key: 'commercial', label: 'จดทะเบียนพาณิชย์', icon: '📋' },
  { key: 'tax', label: 'ภาษีและการเงิน', icon: '💰' },
  { key: 'welfare', label: 'สวัสดิการสังคม', icon: '🤝' },
  { key: 'general', label: 'บริการทั่วไป', icon: '📑' },
] as const

export type PermitCategoryKey = (typeof PERMIT_CATEGORIES)[number]['key']

export function categoryLabel(key: string): string {
  return PERMIT_CATEGORIES.find((c) => c.key === key)?.label || 'อื่น ๆ'
}

export function categoryIcon(key: string): string {
  return PERMIT_CATEGORIES.find((c) => c.key === key)?.icon || '📄'
}

export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
}
