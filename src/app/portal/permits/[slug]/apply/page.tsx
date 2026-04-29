'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Upload, FileText, X, Loader2, Send } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'

type PermitType = {
  id: string
  name: string
  slug: string
  description: string | null
  requiredDocs: string
}

type UploadedFile = {
  key: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

type RequiredDoc = { key: string; label: string; required: boolean }

export default function ApplyPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [permitType, setPermitType] = useState<PermitType | null>(null)
  const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([])
  const [filesByKey, setFilesByKey] = useState<Record<string, UploadedFile[]>>({})
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    details: '',
  })

  type FieldErrors = {
    fullName?: string
    phone?: string
    docs?: Record<string, string>
  }
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function clearFieldError(name: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  useEffect(() => {
    fetch(`/api/permits/types/${params.slug}?public=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setPermitType(data)
        try {
          const docs = JSON.parse(data.requiredDocs)
          setRequiredDocs(Array.isArray(docs) ? docs : [])
        } catch {
          setRequiredDocs([])
        }
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
  }, [params.slug])

  async function handleUpload(key: string, files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingKey(key)
    setError(null)
    setFieldErrors((prev) => {
      if (!prev.docs?.[key]) return prev
      const nextDocs = { ...prev.docs }
      delete nextDocs[key]
      return { ...prev, docs: Object.keys(nextDocs).length ? nextDocs : undefined }
    })
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('files', f))
      fd.append('docKey', key)
      const res = await fetch('/api/permits/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ')
      setFilesByKey((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), ...(data.files || [])],
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploadingKey(null)
    }
  }

  function removeFile(key: string, url: string) {
    setFilesByKey((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((f) => f.url !== url),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!permitType) return
    setError(null)

    const errs: FieldErrors = {}
    if (!form.fullName.trim()) errs.fullName = 'โปรดระบุชื่อ-นามสกุล'
    const phone = form.phone.trim()
    if (!phone) errs.phone = 'โปรดระบุเบอร์โทร'
    else if (!/^[0-9+\-\s]{8,15}$/.test(phone)) errs.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง'

    const docErrors: Record<string, string> = {}
    requiredDocs
      .filter((d) => d.required)
      .forEach((d) => {
        if (!(filesByKey[d.key] && filesByKey[d.key].length > 0)) {
          docErrors[d.key] = `โปรดแนบ${d.label}`
        }
      })
    if (Object.keys(docErrors).length > 0) errs.docs = docErrors

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})

    const allDocs: UploadedFile[] = Object.values(filesByKey).flat()
    setSubmitting(true)
    try {
      const res = await fetch('/api/permits/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permitTypeId: permitType.id,
          ...form,
          documents: allDocs,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ส่งคำร้องไม่สำเร็จ')
      router.push(`/portal/permits/track/${data.trackingToken}?success=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งคำร้องไม่สำเร็จ')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/portal/permits/${params.slug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับ
        </Link>

        {!permitType && !error && (
          <div className="h-72 rounded-3xl bg-white animate-pulse" />
        )}

        {permitType && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <h1 className="text-xl sm:text-2xl font-bold">ยื่นคำร้อง</h1>
              <p className="text-blue-100 mt-1">{permitType.name}</p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => {
                    setForm({ ...form, fullName: e.target.value })
                    clearFieldError('fullName')
                  }}
                  aria-invalid={!!fieldErrors.fullName}
                  className={`w-full px-3 py-2 rounded-xl border outline-none transition ${
                    fieldErrors.fullName
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-300'
                      : 'border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value })
                    clearFieldError('phone')
                  }}
                  aria-invalid={!!fieldErrors.phone}
                  className={`w-full px-3 py-2 rounded-xl border outline-none transition ${
                    fieldErrors.phone
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-300'
                      : 'border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดคำร้อง
                </label>
                <textarea
                  rows={4}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
                />
              </div>

              {requiredDocs.length > 0 && (
                <section className="border-t pt-5">
                  <h2 className="font-semibold text-gray-900 mb-3">เอกสารแนบ</h2>
                  <div className="space-y-3">
                    {requiredDocs.map((d) => {
                      const list = filesByKey[d.key] || []
                      const isUploading = uploadingKey === d.key
                      const docError = fieldErrors.docs?.[d.key]
                      return (
                        <div
                          key={d.key}
                          className={`rounded-2xl border p-4 transition ${
                            docError ? 'border-rose-400 bg-rose-50/40' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {d.label}
                                {d.required ? (
                                  <span className="text-rose-500 ml-1">*</span>
                                ) : (
                                  <span className="text-gray-400 text-xs ml-1">(ถ้ามี)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">PDF, JPG, PNG (สูงสุด 10MB/ไฟล์)</p>
                            </div>
                            <label
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium transition ${
                                isUploading
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {isUploading ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Upload size={14} />
                              )}
                              เลือกไฟล์
                              <input
                                type="file"
                                hidden
                                multiple
                                disabled={isUploading}
                                accept="application/pdf,image/jpeg,image/png"
                                onChange={(e) => handleUpload(d.key, e.target.files)}
                              />
                            </label>
                          </div>
                          {docError && (
                            <p className="mb-2 text-xs text-rose-600">{docError}</p>
                          )}
                          {list.length > 0 && (
                            <ul className="space-y-1.5">
                              {list.map((f) => (
                                <li
                                  key={f.url}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 text-sm"
                                >
                                  <FileText size={14} className="text-gray-500" />
                                  <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline truncate flex-1"
                                  >
                                    {f.name}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(d.key, f.url)}
                                    className="text-rose-500 hover:text-rose-700"
                                    aria-label="ลบไฟล์"
                                  >
                                    <X size={14} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  ยื่นแบบ
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
