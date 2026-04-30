'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronLeft,
  Plus,
  Loader2,
  X,
  Save,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { PageLoading } from '@/components/ui'
import {
  BILL_STATUS_LABEL,
  BILL_TYPES,
  BILL_TYPE_COLOR,
  BILL_TYPE_ICON,
  BILL_TYPE_LABEL,
  BillStatus,
  BillType,
  formatBaht,
} from '@/lib/billing'

type Bill = {
  id: string
  billNo: string
  billType: BillType
  period: string
  description: string | null
  amount: number | string
  dueDate: string | null
  status: BillStatus
  paidAt: string | null
  createdAt: string
}

type Household = {
  id: string
  houseNo: string
  villageNo: string | null
  ownerName: string
  phone: string | null
  lookupToken: string
  bills: Bill[]
}

const newBillEmpty = {
  billType: 'WATER' as BillType,
  period: '',
  amount: '',
  description: '',
  dueDate: '',
}

export default function HouseholdDetailPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<Household | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [billForm, setBillForm] = useState(newBillEmpty)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setData(null)
    const res = await fetch(`/api/admin/billing/households/${params.id}`, {
      cache: 'no-store',
    })
    const d = await res.json()
    if (!res.ok) {
      setError(d.error || 'โหลดไม่สำเร็จ')
      return
    }
    setData(d)
  }
  useEffect(() => {
    load()
  }, [params.id])

  async function createBill() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/billing/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: params.id,
          billType: billForm.billType,
          period: billForm.period,
          amount: Number(billForm.amount),
          description: billForm.description || null,
          dueDate: billForm.dueDate || null,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'สร้างไม่สำเร็จ')
      setCreating(false)
      setBillForm(newBillEmpty)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สร้างไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBill(id: string) {
    if (!confirm('ลบบิลนี้?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/billing/bills/${id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'ลบไม่สำเร็จ')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  async function updateStatus(id: string, status: BillStatus) {
    const res = await fetch(`/api/admin/billing/bills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) await load()
  }

  if (!data && !error) return <PageLoading />
  if (!data) return null

  const yyyymm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <Link
        href="/admin/households"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
      >
        <ChevronLeft size={16} className="mr-1" /> รายการบ้านทั้งหมด
      </Link>

      <div className="bg-white rounded-2xl shadow p-5 sm:p-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500">บ้านเลขที่</p>
          <h1 className="text-2xl font-bold">{data.houseNo}</h1>
          <p className="text-gray-600 mt-1">เจ้าบ้าน: {data.ownerName}</p>
          {data.phone && <p className="text-sm text-gray-500">โทร {data.phone}</p>}
        </div>
        <a
          href={`/portal/billing/${data.lookupToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ExternalLink size={14} /> ดูมุมมองชาวบ้าน
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-5 sm:p-6 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">บิลของบ้านนี้</h2>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <Plus size={14} /> เพิ่มบิล
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">เลขที่</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">งวด</th>
                <th className="px-4 py-3 text-right">ยอด</th>
                <th className="px-4 py-3">ครบกำหนด</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    ยังไม่มีบิล
                  </td>
                </tr>
              )}
              {data.bills.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{b.billNo}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const Icon = BILL_TYPE_ICON[b.billType]
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${BILL_TYPE_COLOR[b.billType]}`}
                        >
                          <Icon size={12} /> {BILL_TYPE_LABEL[b.billType]}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm">{b.period}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ฿{formatBaht(b.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {b.dueDate
                      ? new Date(b.dueDate).toLocaleDateString('th-TH')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value as BillStatus)}
                      className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white"
                    >
                      <option value="UNPAID">{BILL_STATUS_LABEL.UNPAID}</option>
                      <option value="PAID">{BILL_STATUS_LABEL.PAID}</option>
                      <option value="WAIVED">{BILL_STATUS_LABEL.WAIVED}</option>
                      <option value="CANCELLED">{BILL_STATUS_LABEL.CANCELLED}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteBill(b.id)}
                      disabled={deletingId === b.id}
                      className="text-rose-600 hover:text-rose-800 text-sm inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {deletingId === b.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">เพิ่มบิล</h2>
              <button
                onClick={() => setCreating(false)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภท
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BILL_TYPES.map((t) => {
                    const Icon = BILL_TYPE_ICON[t]
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBillForm({ ...billForm, billType: t })}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition ${
                          billForm.billType === t
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={14} /> {BILL_TYPE_LABEL[t]}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  งวด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={billForm.period}
                  onChange={(e) => setBillForm({ ...billForm, period: e.target.value })}
                  placeholder={`เช่น ${yyyymm} หรือ 2569`}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยอด (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ครบกำหนด
                </label>
                <input
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <input
                  type="text"
                  value={billForm.description}
                  onChange={(e) =>
                    setBillForm({ ...billForm, description: e.target.value })
                  }
                  placeholder="เช่น น้ำใช้ 25 หน่วย"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={createBill}
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
    </div>
  )
}
