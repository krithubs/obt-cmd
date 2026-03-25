/**
 * Shared validation & sanitization utilities
 */

import { FIELD_LIMITS } from './fieldLimits'

// ===== SANITIZATION =====

/** Strip HTML tags to prevent XSS */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

/** Sanitize and trim a string field */
export function sanitize(input: unknown): string {
  if (typeof input !== 'string') return ''
  return stripHtml(input).trim()
}

// ===== VALIDATION =====

/** Valid complaint statuses */
export const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED'] as const
export type ComplaintStatus = typeof VALID_STATUSES[number]

/** Valid complaint types */
export const VALID_TYPES = ['ถนน', 'ไฟฟ้า', 'น้ำประปา', 'สิ่งแวดล้อม', 'ความสะอาด', 'อื่นๆ'] as const
export type ComplaintType = typeof VALID_TYPES[number]

/** Valid villages */
export const VALID_VILLAGES = ['หมู่ 1', 'หมู่ 2', 'หมู่ 3', 'หมู่ 4', 'หมู่ 5', 'หมู่ 6', 'หมู่ 7', 'หมู่ 8', 'หมู่ 9'] as const
export type VillageType = typeof VALID_VILLAGES[number]

/** Field length limits (re-exported from shared constants) */
const LIMITS = {
  name: FIELD_LIMITS.COMPLAINT_NAME,
  phone: FIELD_LIMITS.COMPLAINT_PHONE,
  email: FIELD_LIMITS.COMPLAINT_EMAIL,
  type: 50,
  description: FIELD_LIMITS.COMPLAINT_DESCRIPTION,
  location: FIELD_LIMITS.COMPLAINT_LOCATION,
  notes: FIELD_LIMITS.COMPLAINT_INTERNAL_NOTE,
  assignedTo: 100,
} as const

/** Validate Thai phone number format */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true // phone is optional
  // Thai phone: 0x-xxxx-xxxx or 0xxxxxxxxx (9-10 digits starting with 0)
  const cleaned = phone.replace(/[-\s]/g, '')
  return /^0\d{8,9}$/.test(cleaned)
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  if (!email) return true // email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Validate status is in allowed enum */
export function isValidStatus(status: string): status is ComplaintStatus {
  return VALID_STATUSES.includes(status as ComplaintStatus)
}

/** Validate complaint type */
export function isValidType(type: string): boolean {
  return VALID_TYPES.includes(type as ComplaintType)
}

/** Validate village */
export function isValidVillage(village: string): boolean {
  return VALID_VILLAGES.includes(village as VillageType)
}

/** Truncate string to max length */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input
  return input.slice(0, maxLength)
}

// ===== COMPLAINT VALIDATION =====

export interface ComplaintValidationResult {
  valid: boolean
  errors: string[]
  sanitized: {
    name: string
    phone: string
    email: string
    type: string
    village: string
    description: string
    location: string
    images: string[]
  }
}

export function validateComplaintInput(data: Record<string, unknown>): ComplaintValidationResult {
  const errors: string[] = []

  const name = sanitize(data.name)
  const phone = sanitize(data.phone)
  const email = sanitize(data.email)
  const type = sanitize(data.type)
  const village = sanitize(data.village)
  const description = sanitize(data.description)
  const location = sanitize(data.location)

  // Required fields
  if (!name) errors.push('กรุณาระบุชื่อ-นามสกุล')
  if (!type) errors.push('กรุณาระบุประเภทปัญหา')
  if (!village) errors.push('กรุณาระบุหมู่บ้าน')
  if (!description) errors.push('กรุณาระบุรายละเอียด')

  // Length limits
  if (name.length > LIMITS.name) errors.push(`ชื่อต้องไม่เกิน ${LIMITS.name} ตัวอักษร`)
  if (phone.length > LIMITS.phone) errors.push(`เบอร์โทรต้องไม่เกิน ${LIMITS.phone} ตัวอักษร`)
  if (email.length > LIMITS.email) errors.push(`อีเมลต้องไม่เกิน ${LIMITS.email} ตัวอักษร`)
  if (description.length > LIMITS.description) errors.push(`รายละเอียดต้องไม่เกิน ${LIMITS.description} ตัวอักษร`)
  if (location.length > LIMITS.location) errors.push(`สถานที่ต้องไม่เกิน ${LIMITS.location} ตัวอักษร`)

  // Format validation
  if (phone && !isValidPhone(phone)) errors.push('รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)')
  if (email && !isValidEmail(email)) errors.push('รูปแบบอีเมลไม่ถูกต้อง')
  if (type && !isValidType(type)) errors.push(`ประเภทปัญหาต้องเป็น: ${VALID_TYPES.join(', ')}`)
  if (village && !isValidVillage(village)) errors.push(`หมู่บ้านต้องเป็น: ${VALID_VILLAGES.join(', ')}`)

  // Validate images array
  let images: string[] = []
  if (Array.isArray(data.images)) {
    images = data.images
      .filter((img): img is string => typeof img === 'string')
      .slice(0, 5) // max 5 images
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      name: truncate(name, LIMITS.name),
      phone: truncate(phone, LIMITS.phone),
      email: truncate(email, LIMITS.email),
      type: truncate(type, LIMITS.type),
      village: truncate(village, 20),
      description: truncate(description, LIMITS.description),
      location: truncate(location, LIMITS.location),
      images,
    }
  }
}

export interface UpdateValidationResult {
  valid: boolean
  errors: string[]
  sanitized: {
    status?: ComplaintStatus
    notes?: string
    assignedTo?: string
  }
}

export function validateComplaintUpdate(data: Record<string, unknown>): UpdateValidationResult {
  const errors: string[] = []
  const sanitized: UpdateValidationResult['sanitized'] = {}

  if (data.status !== undefined) {
    const status = sanitize(data.status)
    if (!isValidStatus(status)) {
      errors.push(`สถานะต้องเป็น: ${VALID_STATUSES.join(', ')}`)
    } else {
      sanitized.status = status
    }
  }

  if (data.notes !== undefined) {
    const notes = sanitize(data.notes)
    if (notes.length > LIMITS.notes) {
      errors.push(`บันทึกต้องไม่เกิน ${LIMITS.notes} ตัวอักษร`)
    } else {
      sanitized.notes = notes
    }
  }

  if (data.assignedTo !== undefined) {
    const assignedTo = sanitize(data.assignedTo)
    if (assignedTo.length > LIMITS.assignedTo) {
      errors.push(`ผู้รับผิดชอบต้องไม่เกิน ${LIMITS.assignedTo} ตัวอักษร`)
    } else {
      sanitized.assignedTo = assignedTo
    }
  }

  return { valid: errors.length === 0, errors, sanitized }
}
