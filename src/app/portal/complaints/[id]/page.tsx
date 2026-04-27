'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Circle,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
} from 'lucide-react'

interface Complaint {
  id: string
  ticketNo: string
  type: string
  description: string
  location?: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
  notes?: string | null
  images: string[]
  resolutionImages: string[]
  createdAt: string
  updatedAt: string
}

const STEPS = [
  { key: 'submitted', title: 'แจ้งเรื่องเข้ามาในระบบ', actor: 'ระบบ' },
  { key: 'accepted', title: 'เจ้าหน้าที่รับเรื่อง', actor: 'เจ้าหน้าที่' },
  { key: 'closed', title: 'ปิดเคส', actor: 'เจ้าหน้าที่' },
] as const

type StepState = 'done' | 'current' | 'pending'

function getCurrentStepIndex(status: Complaint['status']): number {
  switch (status) {
    case 'PENDING':
      return 1 // step 1 done, waiting for staff to accept
    case 'IN_PROGRESS':
      return 2 // accepted, waiting to be closed
    case 'RESOLVED':
      return STEPS.length // all done
    case 'REJECTED':
      return 1
    default:
      return 1
  }
}

function formatThaiShort(dateStr: string): string {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = d.getDate()
  const month = months[d.getMonth()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${hh}:${mm}`
}

function relativeFromNow(dateStr: string): string {
  const d = new Date(dateStr).getTime()
  if (isNaN(d)) return ''
  const diffMs = Date.now() - d
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} วันที่แล้ว`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} เดือนที่แล้ว`
  return `${Math.floor(months / 12)} ปีที่แล้ว`
}

const STATUS_LABEL: Record<Complaint['status'], string> = {
  PENDING: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังดำเนินการ',
  RESOLVED: 'แก้ไขเรียบร้อย',
  REJECTED: 'ปฏิเสธคำร้อง',
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/complaints/public/${encodeURIComponent(params.id)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'ไม่สามารถดึงข้อมูลได้')
        if (!cancelled) setComplaint(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'เกิดข้อผิดพลาด')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-800 font-medium mb-4">{error || 'ไม่พบคำร้อง'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    )
  }

  const isRejected = complaint.status === 'REJECTED'
  const currentIdx = getCurrentStepIndex(complaint.status)
  const totalSteps = STEPS.length

  const stateOf = (idx: number): StepState => {
    if (isRejected) return idx === 0 ? 'done' : 'pending'
    return idx < currentIdx ? 'done' : 'pending'
  }

  // Per-step timestamps (best-effort given the schema)
  const stepDate = (idx: number): string | null => {
    if (idx === 0) return complaint.createdAt
    if (idx < currentIdx) return complaint.updatedAt
    return null
  }

  // In-between status label between two steps (after step `idx`)
  const betweenLabel = (idx: number): string => {
    if (isRejected) return ''
    if (idx === 0 && complaint.status === 'PENDING') return 'รอเจ้าหน้าที่ตรวจสอบ'
    if (idx === 1 && complaint.status === 'IN_PROGRESS') return 'อยู่ระหว่างดำเนินการ'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link
          href="/portal/tracking"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับไปยังรายการคำร้อง
        </Link>

        {/* Hero card */}
        <div
          className={`rounded-2xl p-5 text-white shadow-md ${
            isRejected ? 'bg-red-600' : 'bg-blue-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="text-xs/relaxed opacity-90">
              {STATUS_LABEL[complaint.status]}
              {!isRejected && ` · ขั้นที่ ${currentIdx}/${totalSteps}`}
            </div>
            <span className="font-mono text-xs bg-white/15 rounded-full px-2.5 py-1">
              {complaint.ticketNo}
            </span>
          </div>
          <h1 className="text-xl font-bold leading-snug mb-3">
            {complaint.type}
            {complaint.description ? ` - ${complaint.description}` : ''}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-95 mb-4">
            {complaint.location && (
              <span className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {complaint.location}
              </span>
            )}
            <span className="inline-flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {relativeFromNow(complaint.createdAt)}
            </span>
          </div>

          {/* Progress segments */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const filled = !isRejected && i < currentIdx
              const current = !isRejected && i === currentIdx
              return (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    filled
                      ? 'bg-white'
                      : current
                      ? 'bg-white/70'
                      : 'bg-white/25'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-5">
            ไทม์ไลน์การดำเนินงาน
          </h2>

          <ol className="relative">
            {STEPS.map((step, idx) => {
              const state = stateOf(idx)
              const date = stepDate(idx)
              const isLast = idx === STEPS.length - 1
              const between = !isLast ? betweenLabel(idx) : ''

              const dotClasses =
                state === 'done'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-300'

              const lineClasses =
                state === 'done' ? 'bg-green-500' : 'bg-gray-200'

              return (
                <li key={step.key} className="pl-10 pb-6 relative">
                  {/* Connecting line */}
                  {!isLast && (
                    <span
                      className={`absolute left-3 top-7 w-0.5 h-full -translate-x-1/2 ${lineClasses}`}
                      aria-hidden="true"
                    />
                  )}
                  {/* Dot */}
                  <span
                    className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${dotClasses}`}
                  >
                    {state === 'done' ? <Check className="w-3.5 h-3.5" /> : null}
                  </span>

                  <div
                    className={`font-semibold ${
                      state === 'pending' ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`text-sm mt-0.5 ${
                      state === 'pending' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {date ? formatThaiShort(date) : '—'}
                  </div>
                  <div
                    className={`text-sm ${
                      state === 'pending' ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {state === 'pending' ? '—' : step.actor || '—'}
                  </div>

                  {between && (
                    <div className="mt-3 ml-[-2.5rem] pl-10 relative">
                      <span
                        className="absolute left-3 top-1/2 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                        aria-hidden="true"
                      />
                      <div className="inline-flex items-center bg-blue-50 text-blue-700 text-sm font-medium rounded-full px-3 py-1.5 border border-blue-100">
                        <Circle className="w-2 h-2 mr-2 fill-current" />
                        {between}
                      </div>
                      {complaint.notes && (
                        <div className="mt-2 inline-block bg-blue-50 text-blue-800 text-sm rounded-lg px-3 py-2 border border-blue-100">
                          &ldquo;{complaint.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {isRejected && (
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">คำร้องถูกปฏิเสธ</div>
                {complaint.notes && (
                  <p className="text-sm text-red-700 mt-1">{complaint.notes}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Images */}
        {complaint.images.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              รูปภาพประกอบ
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {complaint.images.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <img
                    src={src}
                    alt={`รูปภาพ ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {complaint.resolutionImages.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              รูปภาพหลักฐานการแก้ไข
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {complaint.resolutionImages.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <img
                    src={src}
                    alt={`หลักฐาน ${i + 1}`}
                    className="w-full h-full object-cover border-2 border-green-200 hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
