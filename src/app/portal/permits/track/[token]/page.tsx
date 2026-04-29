'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'
import { STATUS_LABEL, STATUS_COLOR, PermitStatus } from '@/lib/permit'

type HistoryItem = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  attachments: string
  changedBy: string
  createdAt: string
}

type TrackData = {
  requestNo: string
  trackingToken: string
  fullName: string
  phone: string
  email: string | null
  details: string
  documents: string
  status: PermitStatus
  createdAt: string
  updatedAt: string
  permitType: { name: string; slug: string }
  history: HistoryItem[]
}

type UploadedFile = {
  key: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function TrackDetailPage() {
  const params = useParams<{ token: string }>()
  const search = useSearchParams()
  const showSuccess = search.get('success') === '1'

  const [data, setData] = useState<TrackData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extraFiles, setExtraFiles] = useState<UploadedFile[]>([])
  const [extraNote, setExtraNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  async function load() {
    const res = await fetch(`/api/permits/track/${params.token}`, { cache: 'no-store' })
    const d = await res.json()
    if (!res.ok) {
      setError(d.error || 'ไม่พบคำร้อง')
      return
    }
    setData(d)
  }

  useEffect(() => {
    load()
  }, [params.token])

  const docs: UploadedFile[] = useMemo(() => {
    if (!data) return []
    try {
      const arr = JSON.parse(data.documents)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }, [data])

  async function handleExtraUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('files', f))
      fd.append('docKey', 'extra')
      const res = await fetch('/api/permits/upload', { method: 'POST', body: fd })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'อัปโหลดไม่สำเร็จ')
      setExtraFiles((prev) => [...prev, ...(r.files || [])])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  async function submitExtra() {
    if (extraFiles.length === 0) {
      setError('กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/permits/track/${params.token}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: extraFiles, note: extraNote }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'ส่งเอกสารไม่สำเร็จ')
      setSubmitMsg('ส่งเอกสารเพิ่มเติมเรียบร้อยแล้ว')
      setExtraFiles([])
      setExtraNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งเอกสารไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/portal/permits"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปรายการคำร้อง
        </Link>

        {showSuccess && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-start gap-2">
            <CheckCircle2 size={20} className="mt-0.5" />
            <div>
              <p className="font-semibold">ส่งคำร้องสำเร็จ!</p>
              <p className="text-sm mt-0.5">บันทึกหน้านี้ไว้เพื่อติดตามสถานะ</p>
            </div>
          </div>
        )}

        {error && !data && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4">
            {error}
          </div>
        )}

        {!data && !error && <div className="h-72 rounded-3xl bg-white animate-pulse" />}

        {data && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <p className="text-blue-100 text-sm">{data.permitType.name}</p>
                <h1 className="text-xl sm:text-2xl font-bold mt-1">เลขที่ {data.requestNo}</h1>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${STATUS_COLOR[data.status]}`}
                  >
                    {STATUS_LABEL[data.status]}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">ผู้ยื่น</p>
                  <p className="font-medium text-gray-900">{data.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500">เบอร์โทร</p>
                  <p className="font-medium text-gray-900">{data.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">รายละเอียด</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{data.details}</p>
                </div>
                {docs.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500 mb-1">เอกสารแนบ</p>
                    <ul className="space-y-1.5">
                      {docs.map((f) => (
                        <li
                          key={f.url}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50"
                        >
                          <FileText size={14} className="text-gray-500" />
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline truncate"
                          >
                            {f.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {data.status === 'NEED_MORE_INFO' && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-amber-300">
                <div className="bg-amber-50 p-5 flex items-start gap-3">
                  <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-amber-900">ต้องการเอกสารเพิ่ม</p>
                    <p className="text-sm text-amber-800 mt-0.5">
                      เจ้าหน้าที่ขอให้แนบเอกสารเพิ่มเติม กรุณาตรวจสอบหมายเหตุด้านล่าง
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-3">
                  {submitMsg && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-sm">
                      {submitMsg}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                      {error}
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    เลือกไฟล์
                    <input
                      type="file"
                      hidden
                      multiple
                      disabled={uploading}
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleExtraUpload(e.target.files)}
                    />
                  </label>
                  {extraFiles.length > 0 && (
                    <ul className="space-y-1.5">
                      {extraFiles.map((f) => (
                        <li
                          key={f.url}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 text-sm"
                        >
                          <FileText size={14} className="text-gray-500" />
                          <span className="truncate flex-1">{f.name}</span>
                          <button
                            onClick={() =>
                              setExtraFiles((prev) => prev.filter((x) => x.url !== f.url))
                            }
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <textarea
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
                  />
                  <button
                    onClick={submitExtra}
                    disabled={submitting || extraFiles.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow hover:shadow-lg transition disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    ส่งเอกสารเพิ่ม
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ประวัติสถานะ</h2>
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
                          {formatDate(h.createdAt)}
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
        )}
      </main>
      <Footer />
    </div>
  )
}
