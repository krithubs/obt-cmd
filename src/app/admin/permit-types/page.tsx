'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Edit2,
  Save,
  X,
  Upload,
  Loader2,
  Trash2,
} from 'lucide-react'
import { PageLoading } from '@/components/ui'
import { PERMIT_CATEGORIES, categoryLabel, categoryIcon } from '@/lib/permit'

type RequiredDoc = { key: string; label: string; required: boolean }

type PermitType = {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  formFileUrl: string | null
  requiredDocs: string
  isActive: boolean
  sortOrder?: number
  requiresPayment?: boolean
  paymentQrUrl?: string | null
  defaultFee?: number | string | null
  paymentNote?: string | null
}

const emptyForm = {
  name: '',
  slug: '',
  category: 'general' as string,
  description: '',
  formFileUrl: '',
  requiredDocs: [
    { key: 'request_form', label: 'ใบคำขอ', required: true },
    { key: 'id_card', label: 'สำเนาบัตรประชาชน', required: true },
    { key: 'house_reg', label: 'สำเนาทะเบียนบ้าน', required: true },
  ] as RequiredDoc[],
  isActive: true,
  requiresPayment: false,
  paymentQrUrl: '',
  defaultFee: '' as string,
  paymentNote: '',
}

export default function AdminPermitTypesPage() {
  const [items, setItems] = useState<PermitType[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [uploadingForm, setUploadingForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setItems(null)
    const res = await fetch('/api/permits/types')
    const d = await res.json()
    if (!res.ok) {
      setError(d.error || 'โหลดไม่สำเร็จ')
      setItems([])
      return
    }
    setItems(d)
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(t: PermitType) {
    setEditing(t.id)
    let docs: RequiredDoc[] = []
    try {
      const arr = JSON.parse(t.requiredDocs)
      if (Array.isArray(arr)) docs = arr
    } catch {}
    setForm({
      category: t.category || 'general',
      name: t.name,
      slug: t.slug,
      description: t.description || '',
      formFileUrl: t.formFileUrl || '',
      requiredDocs: docs,
      isActive: t.isActive,
      requiresPayment: !!t.requiresPayment,
      paymentQrUrl: t.paymentQrUrl || '',
      defaultFee: t.defaultFee != null ? String(t.defaultFee) : '',
      paymentNote: t.paymentNote || '',
    })
  }

  function startNew() {
    setEditing('new')
    setForm(emptyForm)
  }

  async function uploadForm(file: File) {
    setUploadingForm(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      fd.append('docKey', 'permit-form')
      const res = await fetch('/api/permits/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'อัปโหลดไม่สำเร็จ')
      setForm((p) => ({ ...p, formFileUrl: d.files[0]?.url || '' }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploadingForm(false)
    }
  }

  const [uploadingQr, setUploadingQr] = useState(false)
  async function uploadQr(file: File) {
    setUploadingQr(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      fd.append('docKey', 'payment-qr')
      const res = await fetch('/api/permits/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'อัปโหลดไม่สำเร็จ')
      setForm((p) => ({ ...p, paymentQrUrl: d.files[0]?.url || '' }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploadingQr(false)
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const fee = form.defaultFee.trim()
      const payload = {
        ...form,
        defaultFee: fee === '' ? null : Number(fee),
      }
      const url = editing === 'new' ? '/api/permits/types' : `/api/permits/types/${editing}`
      const method = editing === 'new' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'บันทึกไม่สำเร็จ')
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(t: PermitType) {
    if (!confirm(`ยืนยันการลบประเภทคำร้อง "${t.name}" ?\n\nการลบนี้ไม่สามารถย้อนกลับได้`)) return
    setDeletingId(t.id)
    setError(null)
    try {
      const res = await fetch(`/api/permits/types/${t.id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'ลบไม่สำเร็จ')
      setItems((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleActive(t: PermitType) {
    const next = !t.isActive
    setTogglingId(t.id)
    setError(null)
    setItems((prev) =>
      prev ? prev.map((x) => (x.id === t.id ? { ...x, isActive: next } : x)) : prev
    )
    try {
      const res = await fetch(`/api/permits/types/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'เปลี่ยนสถานะไม่สำเร็จ')
      }
    } catch (e) {
      setItems((prev) =>
        prev
          ? prev.map((x) => (x.id === t.id ? { ...x, isActive: t.isActive } : x))
          : prev
      )
      setError(e instanceof Error ? e.message : 'เปลี่ยนสถานะไม่สำเร็จ')
    } finally {
      setTogglingId(null)
    }
  }

  function setDoc(idx: number, patch: Partial<RequiredDoc>) {
    setForm((p) => ({
      ...p,
      requiredDocs: p.requiredDocs.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }))
  }

  function addDoc() {
    setForm((p) => ({
      ...p,
      requiredDocs: [
        ...p.requiredDocs,
        { key: `doc_${p.requiredDocs.length + 1}`, label: '', required: false },
      ],
    }))
  }

  function removeDoc(i: number) {
    setForm((p) => ({ ...p, requiredDocs: p.requiredDocs.filter((_, x) => x !== i) }))
  }

  if (!items && !error) return <PageLoading />

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/permits"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            <ChevronLeft size={16} className="mr-1" /> รายการคำร้อง
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">ประเภทคำร้อง</h1>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> เพิ่มประเภท
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">หมวดหมู่</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">แบบฟอร์ม</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(items || []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  ยังไม่มีประเภทคำร้อง
                </td>
              </tr>
            )}
            {(items || []).map((t, idx, arr) => {
              const prev = idx > 0 ? arr[idx - 1] : null
              const showGroup = !prev || prev.category !== t.category
              const CatIcon = categoryIcon(t.category)
              return (
                <Fragment key={t.id}>
                  {showGroup && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={6} className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1.5">
                          <CatIcon size={14} />
                          {categoryLabel(t.category)}
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <CatIcon size={14} />
                        <span>{categoryLabel(t.category)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{t.slug}</td>
                <td className="px-4 py-3">
                  {t.formFileUrl ? (
                    <a
                      href={t.formFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      ดูไฟล์
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(t)}
                    disabled={togglingId === t.id}
                    aria-label={t.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    aria-pressed={t.isActive}
                    title={t.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    className={`relative inline-flex items-center h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                      t.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    } ${togglingId === t.id ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        t.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span
                    className={`ml-2 text-xs font-medium ${
                      t.isActive ? 'text-emerald-700' : 'text-gray-500'
                    }`}
                  >
                    {t.isActive ? 'เปิด' : 'ปิด'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-3">
                    <button
                      onClick={() => startEdit(t)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Edit2 size={14} /> แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      disabled={deletingId === t.id}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 text-sm disabled:opacity-50"
                    >
                      {deletingId === t.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}{' '}
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {editing === 'new' ? 'เพิ่มประเภทคำร้อง' : 'แก้ไขประเภทคำร้อง'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                />
              </div>
              {editing === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (เว้นว่างเพื่อสร้างอัตโนมัติ)
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none font-mono"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PERMIT_CATEGORIES.map((c) => {
                    const Icon = c.icon
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setForm({ ...form, category: c.key })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
                          form.category === c.key
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-left flex-1">{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ไฟล์แบบฟอร์ม (PDF)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer text-sm font-medium">
                    {uploadingForm ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    อัปโหลด
                    <input
                      type="file"
                      hidden
                      accept="application/pdf"
                      disabled={uploadingForm}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadForm(f)
                      }}
                    />
                  </label>
                  {form.formFileUrl && (
                    <a
                      href={form.formFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate"
                    >
                      ดูไฟล์ปัจจุบัน
                    </a>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    เอกสารที่ต้องใช้
                  </label>
                  <button
                    type="button"
                    onClick={addDoc}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    + เพิ่ม
                  </button>
                </div>
                <div className="space-y-2">
                  {form.requiredDocs.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-xl border border-gray-200"
                    >
                      <input
                        type="text"
                        value={d.key}
                        onChange={(e) => setDoc(i, { key: e.target.value })}
                        placeholder="key"
                        className="w-32 px-2 py-1 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                      />
                      <input
                        type="text"
                        value={d.label}
                        onChange={(e) => setDoc(i, { label: e.target.value })}
                        placeholder="ชื่อเอกสาร เช่น สำเนาบัตรประชาชน"
                        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={d.required}
                          onChange={(e) => setDoc(i, { required: e.target.checked })}
                        />
                        บังคับ
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresPayment}
                    onChange={(e) =>
                      setForm({ ...form, requiresPayment: e.target.checked })
                    }
                  />
                  <span className="text-sm font-medium text-gray-900">
                    ต้องชำระค่าธรรมเนียมก่อนดำเนินการให้เสร็จ
                  </span>
                </label>

                {form.requiresPayment && (
                  <div className="ml-6 p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ยอดเรียกเก็บเริ่มต้น (บาท) — เจ้าหน้าที่แก้ไขได้ตอนออกบิล
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="เช่น 500"
                        value={form.defaultFee}
                        onChange={(e) =>
                          setForm({ ...form, defaultFee: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        รูป QR สำหรับชำระเงิน
                      </label>
                      <div className="flex items-start gap-3">
                        <label
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm font-medium ${
                            uploadingQr
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {uploadingQr ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Upload size={14} />
                          )}
                          อัปโหลด QR
                          <input
                            type="file"
                            hidden
                            accept="image/jpeg,image/png"
                            disabled={uploadingQr}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) uploadQr(f)
                            }}
                          />
                        </label>
                        {form.paymentQrUrl && (
                          <a
                            href={form.paymentQrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={form.paymentQrUrl}
                              alt="QR"
                              className="w-24 h-24 rounded-lg border border-gray-200 object-cover bg-white"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ข้อความเพิ่มเติม (เช่น ชื่อบัญชี/ธนาคาร)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="เช่น ธ.ออมสิน เลขที่ 020-...   ชื่อบัญชี ผู้ใหญ่ลี PHUYAILEE"
                        value={form.paymentNote}
                        onChange={(e) =>
                          setForm({ ...form, paymentNote: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 border-t pt-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span className="text-sm">เปิดใช้งาน</span>
              </label>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                disabled={saving || uploadingForm || uploadingQr}
                title={
                  uploadingForm || uploadingQr
                    ? 'กำลังอัปโหลดไฟล์ — โปรดรอให้เสร็จก่อนบันทึก'
                    : undefined
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {uploadingForm || uploadingQr ? 'กำลังอัปโหลด...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
