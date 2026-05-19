'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Save,
  Home,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  SkipForward,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageLoading } from '@/components/ui'

type Household = {
  id: string
  houseNo: string
  villageNo: string | null
  address: string | null
  ownerName: string
  ownerIdCard: string | null
  phone: string | null
  notes: string | null
  isActive: boolean
  lookupToken: string
  _count?: { bills: number; payments: number }
}

const empty = {
  houseNo: '',
  villageNo: '',
  address: '',
  ownerName: '',
  ownerIdCard: '',
  phone: '',
  notes: '',
  isActive: true,
}

export default function AdminHouseholdsPage() {
  const [items, setItems] = useState<Household[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Import state
  type ImportRow = {
    houseNo: string
    villageNo?: string
    address?: string
    ownerName: string
    ownerIdCard?: string
    phone?: string
    notes?: string
  }
  const [importOpen, setImportOpen] = useState(false)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [importParseError, setImportParseError] = useState<string | null>(null)
  const [onDuplicate, setOnDuplicate] = useState<'skip' | 'update'>('skip')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    inserted: number
    skipped: number
    errors: { row: number; houseNo: string; reason: string }[]
  } | null>(null)

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        houseNo: '123/45',
        villageNo: '4',
        address: 'ต.สีลม อ.บางรัก',
        ownerName: 'สมชาย ใจดี',
        ownerIdCard: '1234567890123',
        phone: '0812345678',
        notes: '',
      },
    ])
    ws['!cols'] = [
      { wch: 12 },
      { wch: 6 },
      { wch: 30 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'households')
    XLSX.writeFile(wb, 'household-template.xlsx')
  }

  function handleImportFile(file: File) {
    setImportParseError(null)
    setImportRows([])
    setImportResult(null)
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
        })
        if (raw.length === 0) {
          setImportParseError('ไฟล์ว่างเปล่า')
          return
        }

        const rows: ImportRow[] = raw.map((r) => {
          const get = (...keys: string[]) => {
            for (const k of keys) {
              for (const actual of Object.keys(r)) {
                if (actual.toLowerCase().trim() === k.toLowerCase()) {
                  return r[actual] != null ? String(r[actual]) : ''
                }
              }
            }
            return ''
          }
          return {
            houseNo: get('houseNo', 'บ้านเลขที่', 'house_no'),
            villageNo: get('villageNo', 'หมู่', 'village_no', 'หมู่ที่'),
            address: get('address', 'ที่อยู่'),
            ownerName: get('ownerName', 'ชื่อเจ้าบ้าน', 'owner_name', 'เจ้าบ้าน'),
            ownerIdCard: get(
              'ownerIdCard',
              'เลขบัตรประชาชน',
              'idCard',
              'id_card',
              'เลขบัตร'
            ),
            phone: get('phone', 'เบอร์โทร', 'tel', 'phone_no'),
            notes: get('notes', 'หมายเหตุ'),
          }
        })

        setImportRows(rows)
      } catch (err) {
        setImportParseError(
          err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ได้'
        )
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function runImport() {
    if (importRows.length === 0) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/admin/billing/households/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows, onDuplicate }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'นำเข้าไม่สำเร็จ')
      setImportResult(d)
      await load()
    } catch (e) {
      setImportParseError(e instanceof Error ? e.message : 'นำเข้าไม่สำเร็จ')
    } finally {
      setImporting(false)
    }
  }

  function closeImport() {
    setImportOpen(false)
    setImportRows([])
    setImportFileName(null)
    setImportParseError(null)
    setImportResult(null)
  }

  async function load() {
    setItems(null)
    const res = await fetch(
      `/api/admin/billing/households${q ? `?q=${encodeURIComponent(q)}` : ''}`
    )
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

  function startNew() {
    setForm(empty)
    setEditing('new')
  }
  function startEdit(h: Household) {
    setForm({
      houseNo: h.houseNo,
      villageNo: h.villageNo || '',
      address: h.address || '',
      ownerName: h.ownerName,
      ownerIdCard: h.ownerIdCard || '',
      phone: h.phone || '',
      notes: h.notes || '',
      isActive: h.isActive,
    })
    setEditing(h.id)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const url =
        editing === 'new'
          ? '/api/admin/billing/households'
          : `/api/admin/billing/households/${editing}`
      const method = editing === 'new' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  async function handleDelete(h: Household) {
    if (!confirm(`ลบบ้านเลขที่ ${h.houseNo} ?`)) return
    setDeletingId(h.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/billing/households/${h.id}`, {
        method: 'DELETE',
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'ลบไม่สำเร็จ')
      setItems((p) => (p ? p.filter((x) => x.id !== h.id) : p))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  if (!items && !error) return <PageLoading />

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="text-blue-600" /> ทะเบียนบ้าน
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            ข้อมูลบ้านและเจ้าบ้านในเขตผู้ใหญ่ลี ใช้เป็น key ค้นหาบิลของชาวบ้าน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 border border-blue-200 font-medium hover:bg-blue-50"
          >
            <FileSpreadsheet size={16} /> นำเข้า Excel
          </button>
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            <Plus size={16} /> เพิ่มบ้าน
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="ค้นบ้านเลขที่ / ชื่อเจ้าบ้าน / เบอร์ / เลขบัตร ปชช."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
          />
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          ค้นหา
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">บ้านเลขที่</th>
                <th className="px-4 py-3">เจ้าบ้าน</th>
                <th className="px-4 py-3">เบอร์</th>
                <th className="px-4 py-3">บิล / ชำระ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(items || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
              {(items || []).map((h) => (
                <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{h.houseNo}</div>
                    {h.villageNo && (
                      <div className="text-xs text-gray-500">หมู่ {h.villageNo}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{h.ownerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{h.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {h._count?.bills ?? 0} / {h._count?.payments ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        h.isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {h.isActive ? 'เปิด' : 'ปิด'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3 text-sm">
                      <Link
                        href={`/admin/households/${h.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        บิล
                      </Link>
                      <button
                        onClick={() => startEdit(h)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={14} /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(h)}
                        disabled={deletingId === h.id}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 disabled:opacity-50"
                      >
                        {deletingId === h.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}{' '}
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {editing === 'new' ? 'เพิ่มบ้าน' : 'แก้ไขบ้าน'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    บ้านเลขที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.houseNo}
                    onChange={(e) => setForm({ ...form, houseNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมู่
                  </label>
                  <input
                    type="text"
                    value={form.villageNo}
                    onChange={(e) => setForm({ ...form, villageNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่ (ตำบล/อำเภอ)
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุลเจ้าบ้าน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลขบัตรประชาชน (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={form.ownerIdCard}
                    onChange={(e) => setForm({ ...form, ownerIdCard: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none resize-none"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span className="text-sm">เปิดใช้งาน (ให้ค้นเจอใน portal)</span>
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
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600" /> นำเข้าทะเบียนบ้านจาก Excel
              </h2>
              <button
                onClick={closeImport}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm space-y-2">
                <p className="font-medium text-blue-900">ขั้นตอนการนำเข้า</p>
                <ol className="list-decimal list-inside text-blue-800 space-y-1">
                  <li>ดาวน์โหลด template (.xlsx) ด้านล่าง</li>
                  <li>เปิดด้วย Excel/Google Sheets → กรอกข้อมูลบ้านทุกหลัง (ใส่บ้านเลขที่ + ชื่อเจ้าบ้านอย่างน้อย)</li>
                  <li>save → กลับมาที่นี่ → อัปโหลดไฟล์ → ตรวจสอบ preview → กด "นำเข้า"</li>
                </ol>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg bg-white text-blue-700 border border-blue-300 hover:bg-blue-100 text-sm"
                >
                  <Download size={14} /> ดาวน์โหลด template
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <Upload size={14} /> เลือกไฟล์ .xlsx / .csv
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImportFile(f)
                    }}
                  />
                </label>
                {importFileName && (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <FileSpreadsheet size={14} className="text-blue-600" />
                    {importFileName} ({importRows.length} แถว)
                  </span>
                )}
              </div>

              {importParseError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                  {importParseError}
                </div>
              )}

              {importRows.length > 0 && !importResult && (
                <>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">บ้านเลขที่</th>
                            <th className="px-3 py-2">หมู่</th>
                            <th className="px-3 py-2">เจ้าบ้าน</th>
                            <th className="px-3 py-2">เบอร์โทร</th>
                            <th className="px-3 py-2">เลขบัตร</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((r, i) => {
                            const bad = !r.houseNo || !r.ownerName
                            return (
                              <tr
                                key={i}
                                className={`border-t ${bad ? 'bg-rose-50' : ''}`}
                              >
                                <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                                <td className="px-3 py-1.5 font-medium">
                                  {r.houseNo || (
                                    <span className="text-rose-500 text-xs">
                                      ขาดข้อมูล
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5">{r.villageNo || '—'}</td>
                                <td className="px-3 py-1.5">
                                  {r.ownerName || (
                                    <span className="text-rose-500 text-xs">
                                      ขาดข้อมูล
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 text-gray-600">
                                  {r.phone || '—'}
                                </td>
                                <td className="px-3 py-1.5 text-gray-600 font-mono text-xs">
                                  {r.ownerIdCard || '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm space-y-2">
                    <p className="font-medium text-amber-900">
                      ถ้ามีบ้านเลขที่ซ้ำกับที่อยู่ในระบบแล้ว:
                    </p>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={onDuplicate === 'skip'}
                          onChange={() => setOnDuplicate('skip')}
                        />
                        <span className="text-amber-900">ข้ามไป (skip)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={onDuplicate === 'update'}
                          onChange={() => setOnDuplicate('update')}
                        />
                        <span className="text-amber-900">เขียนทับข้อมูลเดิม (update)</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {importResult && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                    <p className="font-semibold text-blue-900">นำเข้าเสร็จสิ้น</p>
                    <ul className="text-sm text-blue-800 mt-1 space-y-0.5">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> บันทึกสำเร็จ: {importResult.inserted} หลัง
                      </li>
                      <li className="flex items-center gap-1.5">
                        <SkipForward size={14} /> ข้าม: {importResult.skipped} หลัง
                      </li>
                      <li className="flex items-center gap-1.5">
                        <XCircle size={14} className="text-rose-600" /> ผิดพลาด:{' '}
                        {importResult.errors.length} หลัง
                      </li>
                    </ul>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="rounded-2xl border border-rose-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-rose-50">
                          <tr className="text-left text-xs uppercase tracking-wide text-rose-700">
                            <th className="px-3 py-2">แถว</th>
                            <th className="px-3 py-2">บ้านเลขที่</th>
                            <th className="px-3 py-2">เหตุผล</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((e, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-1.5">{e.row}</td>
                              <td className="px-3 py-1.5">{e.houseNo || '—'}</td>
                              <td className="px-3 py-1.5 text-rose-700">{e.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={closeImport}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
              >
                {importResult ? 'ปิด' : 'ยกเลิก'}
              </button>
              {importRows.length > 0 && !importResult && (
                <button
                  onClick={runImport}
                  disabled={importing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {importing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  นำเข้า {importRows.length} แถว
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
