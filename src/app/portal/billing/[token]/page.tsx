'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ShoppingCart,
  Loader2,
  History,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'
import {
  BILL_TYPE_COLOR,
  BILL_TYPE_ICON,
  BILL_TYPE_LABEL,
  BillType,
  formatBaht,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  PaymentStatus,
} from '@/lib/billing'

type Bill = {
  id: string
  billNo: string
  billType: BillType
  period: string
  description: string | null
  amount: number | string
  dueDate: string | null
  status: 'UNPAID' | 'PAID' | 'WAIVED' | 'CANCELLED'
}

type PaymentSummary = {
  id: string
  paymentNo: string
  totalAmount: number | string
  status: PaymentStatus
  createdAt: string
  paidAt: string | null
  items: { id: string; bill: Bill }[]
}

type Data = {
  household: {
    houseNo: string
    villageNo: string | null
    address: string | null
    ownerName: string
    phone: string | null
    lookupToken: string
  }
  bills: Bill[]
  payments: PaymentSummary[]
}

export default function BillingHomePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setData(null)
    const res = await fetch(`/api/billing/${params.token}`, { cache: 'no-store' })
    const d = await res.json()
    if (!res.ok) {
      setError(d.error || 'โหลดไม่สำเร็จ')
      return
    }
    setData(d)
    setSelected(new Set())
  }
  useEffect(() => {
    load()
  }, [params.token])

  const unpaidBills = useMemo(
    () => (data ? data.bills.filter((b) => b.status === 'UNPAID') : []),
    [data]
  )

  const total = useMemo(() => {
    if (!data) return 0
    return unpaidBills
      .filter((b) => selected.has(b.id))
      .reduce((s, b) => s + Number(b.amount), 0)
  }, [unpaidBills, selected, data])

  function toggle(id: string) {
    setSelected((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function selectAll() {
    setSelected(new Set(unpaidBills.map((b) => b.id)))
  }
  function clearSelection() {
    setSelected(new Set())
  }

  async function checkout() {
    if (selected.size === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/billing/${params.token}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billIds: Array.from(selected) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'สร้างรายการชำระไม่สำเร็จ')
      router.push(`/portal/billing/${params.token}/pay/${d.paymentId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ไม่สำเร็จ')
      setSubmitting(false)
    }
  }

  if (!data && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <PortalNavbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-72 rounded-3xl bg-white animate-pulse" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <Link
          href="/portal/billing"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft size={18} className="mr-1" />
          ค้นหาบ้านอื่น
        </Link>

        {error && !data && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <p className="text-blue-100 text-sm">บ้านเลขที่</p>
                <h1 className="text-2xl font-bold mt-0.5">{data.household.houseNo}</h1>
                <p className="text-blue-100 mt-1">
                  เจ้าบ้าน: {data.household.ownerName}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">บิลค้างชำระ</h2>
                {unpaidBills.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={selectAll}
                      className="px-2 py-1 rounded-lg text-blue-700 hover:bg-blue-50"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      ล้าง
                    </button>
                  </div>
                )}
              </div>

              {error && data && (
                <div className="m-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                  {error}
                </div>
              )}

              {unpaidBills.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CheckCircle2 size={32} className="mx-auto text-blue-500 mb-2" />
                  ไม่มีบิลค้างชำระในขณะนี้
                </div>
              ) : (
                <ul className="divide-y">
                  {unpaidBills.map((b) => {
                    const isSel = selected.has(b.id)
                    return (
                      <li
                        key={b.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                          isSel ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => toggle(b.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggle(b.id)}
                            className="mt-1.5 h-5 w-5 accent-blue-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {(() => {
                                const Icon = BILL_TYPE_ICON[b.billType]
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${BILL_TYPE_COLOR[b.billType]}`}
                                  >
                                    <Icon size={12} />
                                    {BILL_TYPE_LABEL[b.billType]}
                                  </span>
                                )
                              })()}
                              <span className="text-xs text-gray-500">งวด {b.period}</span>
                              <span className="text-xs text-gray-400 font-mono">
                                {b.billNo}
                              </span>
                            </div>
                            {b.description && (
                              <p className="text-sm text-gray-700">{b.description}</p>
                            )}
                            {b.dueDate && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                ครบกำหนด:{' '}
                                {new Date(b.dueDate).toLocaleDateString('th-TH', {
                                  dateStyle: 'medium',
                                })}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 whitespace-nowrap">
                            ฿{formatBaht(b.amount)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {selected.size > 0 && (
              <div className="sticky bottom-4">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-300 p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      เลือก {selected.size} รายการ
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      ฿{formatBaht(total)}
                    </p>
                  </div>
                  <button
                    onClick={checkout}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={18} />
                    )}
                    ดำเนินการชำระ
                  </button>
                </div>
              </div>
            )}

            {data.payments.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-5 sm:p-6 border-b flex items-center gap-2">
                  <History size={18} className="text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">ประวัติการชำระ</h2>
                </div>
                <ul className="divide-y">
                  {data.payments.map((p) => (
                    <li key={p.id} className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 font-mono">
                            {p.paymentNo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(p.createdAt).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {p.items.length} รายการ
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium mb-1 ${PAYMENT_STATUS_COLOR[p.status]}`}
                          >
                            {PAYMENT_STATUS_LABEL[p.status]}
                          </span>
                          <p className="font-bold">฿{formatBaht(p.totalAmount)}</p>
                          {(p.status === 'PENDING' || p.status === 'VERIFYING' || p.status === 'REJECTED') && (
                            <Link
                              href={`/portal/billing/${params.token}/pay/${p.id}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              ดู/ดำเนินการต่อ →
                            </Link>
                          )}
                        </div>
                      </div>
                      {p.status === 'REJECTED' && (
                        <div className="mt-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 p-2 text-xs flex items-start gap-1">
                          <AlertCircle size={12} className="mt-0.5" />
                          เจ้าหน้าที่ปฏิเสธสลิป — สามารถกลับไปแนบสลิปใหม่ได้
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
