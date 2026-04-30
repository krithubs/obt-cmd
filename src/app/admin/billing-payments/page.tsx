'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Receipt,
  Clock,
} from 'lucide-react'
import { PageLoading } from '@/components/ui'
import {
  BILL_TYPE_COLOR,
  BILL_TYPE_ICON,
  BILL_TYPE_LABEL,
  BillType,
  formatBaht,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  PaymentStatus,
} from '@/lib/billing'

type Payment = {
  id: string
  paymentNo: string
  totalAmount: number | string
  method: string | null
  status: PaymentStatus
  paymentSlipUrl: string | null
  paidAt: string | null
  rejectionNote: string | null
  createdAt: string
  household: { houseNo: string; ownerName: string }
  items: { id: string; bill: { billType: BillType; period: string } }[]
}

export default function AdminBillingPaymentsPage() {
  const [items, setItems] = useState<Payment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | PaymentStatus>('VERIFYING')
  const [actingId, setActingId] = useState<string | null>(null)

  async function load() {
    setItems(null)
    const url =
      filter === 'ALL'
        ? '/api/admin/billing/payments'
        : `/api/admin/billing/payments?status=${filter}`
    const res = await fetch(url)
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
  }, [filter])

  async function act(id: string, action: 'verify' | 'reject', note?: string) {
    setActingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/billing/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note || null }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'ดำเนินการไม่สำเร็จ')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ')
    } finally {
      setActingId(null)
    }
  }

  if (!items && !error) return <PageLoading />

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="text-blue-600" /> การชำระเงิน
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          ตรวจสอบสลิปและยืนยันการชำระเงินจากชาวบ้าน
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          ทั้งหมด
        </button>
        {PAYMENT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {PAYMENT_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-4">
          {error}
        </div>
      )}

      {(items || []).length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
          ไม่มีรายการ
        </div>
      ) : (
        <div className="grid gap-4">
          {(items || []).map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow p-5 sm:p-6 grid sm:grid-cols-3 gap-5"
            >
              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{p.paymentNo}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      บ้าน <span className="font-medium">{p.household.houseNo}</span> —{' '}
                      {p.household.ownerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleString('th-TH', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${PAYMENT_STATUS_COLOR[p.status]}`}
                  >
                    {PAYMENT_STATUS_LABEL[p.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">รายการ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.items.map((it) => {
                      const Icon = BILL_TYPE_ICON[it.bill.billType]
                      return (
                        <span
                          key={it.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${BILL_TYPE_COLOR[it.bill.billType]}`}
                        >
                          <Icon size={12} />
                          {BILL_TYPE_LABEL[it.bill.billType]} ({it.bill.period})
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  ฿{formatBaht(p.totalAmount)}
                </div>
                {p.status === 'VERIFYING' && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => act(p.id, 'verify')}
                      disabled={actingId === p.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actingId === p.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}{' '}
                      ยืนยันชำระ → บิลทั้งหมด PAID
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt('เหตุผลที่ปฏิเสธ:')
                        if (note !== null) act(p.id, 'reject', note)
                      }}
                      disabled={actingId === p.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 disabled:opacity-50"
                    >
                      <XCircle size={14} /> ปฏิเสธ
                    </button>
                  </div>
                )}
                {p.status === 'REJECTED' && p.rejectionNote && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                    เหตุผล: {p.rejectionNote}
                  </div>
                )}
              </div>
              <div>
                {p.paymentSlipUrl ? (
                  <a
                    href={p.paymentSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <p className="text-xs text-gray-500 mb-1">สลิป (คลิกเพื่อดูใหญ่)</p>
                    <img
                      src={p.paymentSlipUrl}
                      alt="สลิป"
                      className="rounded-xl border border-gray-200 max-h-64 object-contain bg-white"
                    />
                  </a>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-400 text-sm">
                    <Clock size={20} className="mx-auto mb-1" />
                    ยังไม่ได้แนบสลิป
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
