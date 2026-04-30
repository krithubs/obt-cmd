'use client'

import { useEffect, useState } from 'react'
import { Loader2, Upload, Save, Plus, Trash2, Settings } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import { BankAccount, parseBankAccounts } from '@/lib/billing'

export default function BillingSettingsPage() {
  const [loaded, setLoaded] = useState(false)
  const [centralQrUrl, setCentralQrUrl] = useState<string | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/billing/settings')
    const d = await res.json()
    if (res.ok) {
      setCentralQrUrl(d.centralQrUrl || null)
      setPaymentNote(d.paymentNote || '')
      setBanks(parseBankAccounts(d.bankAccounts))
    } else {
      setError(d.error || 'โหลดไม่สำเร็จ')
    }
    setLoaded(true)
  }
  useEffect(() => {
    load()
  }, [])

  async function uploadQr(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      fd.append('docKey', 'central-qr')
      const res = await fetch('/api/permits/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'อัปโหลดไม่สำเร็จ')
      setCentralQrUrl(d.files[0]?.url || null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  function addBank() {
    setBanks((p) => [...p, { bankName: '', accountNo: '', accountName: '', branch: '' }])
  }
  function setBank(i: number, patch: Partial<BankAccount>) {
    setBanks((p) => p.map((b, idx) => (idx === i ? { ...b, ...patch } : b)))
  }
  function removeBank(i: number) {
    setBanks((p) => p.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSavedMsg(null)
    try {
      const res = await fetch('/api/admin/billing/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centralQrUrl,
          paymentNote,
          bankAccounts: banks.filter((b) => b.bankName && b.accountNo && b.accountName),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'บันทึกไม่สำเร็จ')
      setSavedMsg('บันทึกการตั้งค่าเรียบร้อย')
      setTimeout(() => setSavedMsg(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <PageLoading />

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-blue-600" /> ตั้งค่าการชำระเงิน
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          ตั้งค่า QR กลางและบัญชีธนาคารที่จะแสดงเมื่อชาวบ้านชำระเงินผ่าน portal
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-4">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 p-3 mb-4">
          {savedMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-5 space-y-3">
        <h2 className="font-semibold text-gray-900">QR กลางสำหรับสแกนชำระ</h2>
        <div className="flex items-start gap-4">
          <label
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm font-medium ${
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            อัปโหลด QR
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadQr(f)
              }}
            />
          </label>
          {centralQrUrl && (
            <a href={centralQrUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={centralQrUrl}
                alt="QR"
                className="w-32 h-32 rounded-xl border border-gray-200 object-cover bg-white"
              />
            </a>
          )}
          {centralQrUrl && (
            <button
              onClick={() => setCentralQrUrl(null)}
              className="text-rose-600 text-sm hover:underline"
            >
              ลบ
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">บัญชีธนาคาร</h2>
          <button
            onClick={addBank}
            className="inline-flex items-center gap-1 text-blue-700 text-sm hover:underline"
          >
            <Plus size={14} /> เพิ่มบัญชี
          </button>
        </div>
        {banks.length === 0 && (
          <p className="text-sm text-gray-400">ยังไม่มีบัญชี — กด "เพิ่มบัญชี" เพื่อเริ่ม</p>
        )}
        {banks.map((b, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 p-3 grid sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={b.bankName}
              onChange={(e) => setBank(i, { bankName: e.target.value })}
              placeholder="ชื่อธนาคาร เช่น ธ.ออมสิน"
              className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400"
            />
            <input
              type="text"
              value={b.accountNo}
              onChange={(e) => setBank(i, { accountNo: e.target.value })}
              placeholder="เลขที่บัญชี"
              className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400 font-mono"
            />
            <input
              type="text"
              value={b.accountName}
              onChange={(e) => setBank(i, { accountName: e.target.value })}
              placeholder="ชื่อบัญชี"
              className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={b.branch || ''}
                onChange={(e) => setBank(i, { branch: e.target.value })}
                placeholder="สาขา (ถ้ามี)"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400"
              />
              <button
                onClick={() => removeBank(i)}
                className="text-rose-600 hover:text-rose-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-5 space-y-2">
        <h2 className="font-semibold text-gray-900">หมายเหตุเพิ่มเติม</h2>
        <textarea
          rows={3}
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          placeholder="เช่น 'ชำระเงินภายในเวลาราชการ จันทร์-ศุกร์ 8:30-16:30'"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none resize-none text-sm"
        />
      </div>

      <button
        onClick={save}
        disabled={saving || uploading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        บันทึกทั้งหมด
      </button>
    </div>
  )
}
