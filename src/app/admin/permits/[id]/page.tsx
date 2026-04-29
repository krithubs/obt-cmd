'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, FileText, Loader2, Clock, ChevronDown, Check } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import {
  PERMIT_STATUSES,
  STATUS_LABEL,
  STATUS_COLOR,
  PermitStatus,
} from '@/lib/permit'

type HistoryItem = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  attachments: string
  changedBy: string | null
  createdAt: string
}

type Detail = {
  id: string
  requestNo: string
  trackingToken: string
  fullName: string
  phone: string
  email: string | null
  address: string | null
  details: string
  documents: string
  status: PermitStatus
  createdAt: string
  updatedAt: string
  permitType: { id: string; name: string; slug: string }
  history: HistoryItem[]
}

function StatusPicker({
  value,
  onChange,
}: {
  value: PermitStatus
  onChange: (s: PermitStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border-2 bg-white hover:shadow-sm transition group ${
          open ? 'border-blue-400 shadow-sm' : 'border-gray-200'
        }`}
      >
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${STATUS_COLOR[value]}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 ${
              {
                SUBMITTED: 'bg-slate-500',
                UNDER_REVIEW: 'bg-blue-500',
                NEED_MORE_INFO: 'bg-amber-500',
                APPROVED: 'bg-emerald-500',
                REJECTED: 'bg-rose-500',
                COMPLETED: 'bg-violet-500',
              }[value]
            }`}
          />
          {STATUS_LABEL[value]}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2"
          style={{ animationDuration: '120ms' }}
        >
          <ul className="py-1.5 max-h-80 overflow-y-auto">
            {PERMIT_STATUSES.map((s) => {
              const isActive = s === value
              const dotColor = {
                SUBMITTED: 'bg-slate-500',
                UNDER_REVIEW: 'bg-blue-500',
                NEED_MORE_INFO: 'bg-amber-500',
                APPROVED: 'bg-emerald-500',
                REJECTED: 'bg-rose-500',
                COMPLETED: 'bg-violet-500',
              }[s]
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'bg-blue-50/70'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span
                        className={`text-sm ${
                          isActive ? 'font-semibold text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </span>
                    </span>
                    {isActive && <Check size={16} className="text-blue-600" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function AdminPermitDetailPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nextStatus, setNextStatus] = useState<PermitStatus>('UNDER_REVIEW')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setData(null)
    const res = await fetch(`/api/permits/requests/${params.id}`, { cache: 'no-store' })
    const d = await res.json()
    if (!res.ok) {
      setError(d.error || 'โหลดไม่สำเร็จ')
      return
    }
    setData(d)
    setNextStatus(d.status)
  }

  useEffect(() => {
    load()
  }, [params.id])

  async function update() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/permits/requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, note }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'บันทึกไม่สำเร็จ')
      setNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!data && !error) return <PageLoading />

  const docs: { name: string; url: string }[] = data
    ? (() => {
        try {
          const arr = JSON.parse(data.documents)
          return Array.isArray(arr) ? arr : []
        } catch {
          return []
        }
      })()
    : []

  return (
    <div className="p-6 sm:p-8">
      <Link
        href="/admin/permits"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
      >
        <ChevronLeft size={18} className="mr-1" /> กลับ
      </Link>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-4">
          {error}
        </div>
      )}

      {data && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm text-gray-500">{data.permitType.name}</p>
                  <h1 className="text-xl font-bold text-gray-900 mt-1">
                    {data.requestNo}
                  </h1>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${STATUS_COLOR[data.status]}`}
                >
                  {STATUS_LABEL[data.status]}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
                <div>
                  <p className="text-gray-500">ผู้ยื่น</p>
                  <p className="font-medium text-gray-900">{data.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500">เบอร์โทร</p>
                  <p className="font-medium text-gray-900">{data.phone}</p>
                </div>
                {data.email && (
                  <div>
                    <p className="text-gray-500">อีเมล</p>
                    <p className="font-medium text-gray-900">{data.email}</p>
                  </div>
                )}
                {data.address && (
                  <div>
                    <p className="text-gray-500">ที่อยู่</p>
                    <p className="font-medium text-gray-900">{data.address}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-gray-500">รายละเอียด</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{data.details}</p>
                </div>
              </div>
            </div>

            {docs.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-3">เอกสารแนบ</h3>
                <ul className="space-y-2">
                  {docs.map((f, i) => (
                    <li
                      key={`${f.url}-${i}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50"
                    >
                      <FileText size={16} className="text-gray-500" />
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline truncate flex-1"
                      >
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">ประวัติสถานะ</h3>
              <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                {data.history.map((h) => {
                  const status = h.toStatus as PermitStatus
                  return (
                    <li key={h.id} className="ml-5 relative">
                      <span className="absolute -left-[34px] flex items-center justify-center w-6 h-6 bg-white border-2 border-blue-400 rounded-full">
                        <Clock size={12} className="text-blue-600" />
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${
                            STATUS_COLOR[status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {STATUS_LABEL[status] || h.toStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(h.createdAt).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="text-xs text-gray-400">
                          • {h.changedBy === 'applicant' ? 'ผู้ยื่น' : 'เจ้าหน้าที่'}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.note}</p>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="bg-white rounded-2xl shadow p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-3">เปลี่ยนสถานะ</h3>
              <div className="mb-3">
                <StatusPicker value={nextStatus} onChange={setNextStatus} />
              </div>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (เช่น ขอเอกสารเพิ่มอะไรบ้าง)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none text-sm"
              />
              <button
                disabled={saving}
                onClick={update}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                บันทึก
              </button>
              <a
                href={`/portal/permits/track/${data.trackingToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-700"
              >
                เปิดมุมมองผู้ใช้
              </a>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
