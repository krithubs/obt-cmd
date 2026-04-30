'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronLeft,
  Loader2,
  Upload,
  X,
  QrCode,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
} from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'
import {
  BILL_TYPE_COLOR,
  BILL_TYPE_ICON,
  BILL_TYPE_LABEL,
  BillType,
  formatBaht,
  parseBankAccounts,
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
}
type PaymentDetail = {
  id: string
  paymentNo: string
  totalAmount: number | string
  method: string | null
  status: PaymentStatus
  paymentSlipUrl: string | null
  paidAt: string | null
  rejectionNote: string | null
  createdAt: string
  items: { id: string; bill: Bill; amount: number | string }[]
}
type Setting = {
  centralQrUrl: string | null
  bankAccounts: string
  paymentNote: string | null
}
type Resp = { payment: PaymentDetail; setting: Setting | null }

type UploadedFile = { url: string; name: string; type: string; size: number }

export default function PaymentPage() {
  const params = useParams<{ token: string; paymentId: string }>()
  const [data, setData] = useState<Resp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'qr' | 'transfer'>('qr')
  const [slip, setSlip] = useState<UploadedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    setData(null)
    const res = await fetch(
      `/api/billing/${params.token}/payments/${params.paymentId}`,
      { cache: 'no-store' }
    )
    const d = await res.json()
    if (!res.ok) {
      setError(d.error || 'โหลดไม่สำเร็จ')
      return
    }
    setData(d)
  }
  useEffect(() => {
    load()
  }, [params.token, params.paymentId])

  async function handleSlipUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      Array.from(files)
        .slice(0, 1)
        .forEach((f) => fd.append('files', f))
      fd.append('docKey', 'slip')
      const res = await fetch('/api/permits/upload', { method: 'POST', body: fd })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'อัปโหลดไม่สำเร็จ')
      setSlip(r.files?.[0] || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  async function submitSlip() {
    if (!slip) {
      setError('กรุณาแนบสลิป')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/billing/${params.token}/payments/${params.paymentId}/slip`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slipUrl: slip.url, method: tab === 'qr' ? 'QR' : 'TRANSFER' }),
        }
      )
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'ส่งสลิปไม่สำเร็จ')
      setSubmitMsg('ส่งสลิปการชำระเงินเรียบร้อยแล้ว — รอเจ้าหน้าที่ตรวจสอบ')
      setSlip(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งสลิปไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  if (!data && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <PortalNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="h-72 rounded-3xl bg-white animate-pulse" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!data) return null

  const banks = parseBankAccounts(data.setting?.bankAccounts)
  const isPending = data.payment.status === 'PENDING' || data.payment.status === 'REJECTED'
  const isVerifying = data.payment.status === 'VERIFYING'
  const isDone = data.payment.status === 'VERIFIED'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <Link
          href={`/portal/billing/${params.token}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปหน้าบิล
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <p className="text-blue-100 text-sm font-mono">{data.payment.paymentNo}</p>
            <p className="text-3xl font-bold mt-1">฿{formatBaht(data.payment.totalAmount)}</p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium mt-3 bg-white/95 ${PAYMENT_STATUS_COLOR[data.payment.status]}`}
            >
              {PAYMENT_STATUS_LABEL[data.payment.status]}
            </span>
          </div>
          <div className="p-5 sm:p-6 border-b">
            <p className="text-xs text-gray-500 mb-2">รายการที่ชำระ</p>
            <ul className="space-y-1.5">
              {data.payment.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 text-sm"
                >
                  {(() => {
                    const Icon = BILL_TYPE_ICON[it.bill.billType]
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${BILL_TYPE_COLOR[it.bill.billType]}`}
                      >
                        <Icon size={12} /> {BILL_TYPE_LABEL[it.bill.billType]}
                      </span>
                    )
                  })()}
                  <span className="text-gray-600">งวด {it.bill.period}</span>
                  <span className="ml-auto font-medium">฿{formatBaht(it.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {isDone && (
          <div className="rounded-3xl bg-blue-50 border-2 border-blue-300 p-6 text-center">
            <CheckCircle2 size={40} className="text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-blue-900 text-lg">ชำระเงินสำเร็จ</p>
            <p className="text-sm text-blue-800 mt-1">
              เจ้าหน้าที่ตรวจสอบสลิปและบันทึกการชำระเรียบร้อยแล้ว
            </p>
            {data.payment.paidAt && (
              <p className="text-xs text-blue-700 mt-2">
                {new Date(data.payment.paidAt).toLocaleString('th-TH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>
        )}

        {isVerifying && (
          <div className="rounded-3xl bg-indigo-50 border-2 border-indigo-300 p-6">
            <div className="flex items-start gap-3">
              <Clock size={24} className="text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-indigo-900">รอตรวจสอบสลิป</p>
                <p className="text-sm text-indigo-800 mt-1">
                  เจ้าหน้าที่จะตรวจสอบสลิปและอัปเดตสถานะให้เร็วที่สุด
                </p>
                {data.payment.paymentSlipUrl && (
                  <a
                    href={data.payment.paymentSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3"
                  >
                    <img
                      src={data.payment.paymentSlipUrl}
                      alt="สลิป"
                      className="max-w-xs rounded-xl border border-gray-200 bg-white shadow-sm"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <>
            {data.payment.status === 'REJECTED' && data.payment.rejectionNote && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-2">
                <AlertCircle size={18} className="text-rose-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-rose-900">สลิปก่อนหน้านี้ถูกปฏิเสธ</p>
                  <p className="text-rose-700 mt-0.5">{data.payment.rejectionNote}</p>
                  <p className="text-rose-700 mt-1">
                    กรุณาตรวจสอบและแนบสลิปใหม่
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setTab('qr')}
                  className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                    tab === 'qr'
                      ? 'text-blue-700 border-b-2 border-emerald-500 bg-blue-50/40'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <QrCode size={16} /> สแกน QR
                </button>
                <button
                  onClick={() => setTab('transfer')}
                  className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                    tab === 'transfer'
                      ? 'text-blue-700 border-b-2 border-emerald-500 bg-blue-50/40'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building2 size={16} /> โอนเข้าบัญชี
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {tab === 'qr' && (
                  <div className="text-center">
                    {data.setting?.centralQrUrl ? (
                      <a
                        href={data.setting.centralQrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={data.setting.centralQrUrl}
                          alt="QR ชำระเงิน"
                          className="w-full max-w-xs mx-auto rounded-2xl border border-gray-200 shadow-sm bg-white"
                        />
                      </a>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-gray-400 text-sm">
                        ยังไม่ได้ตั้งค่า QR กลาง — กรุณาติดต่อเจ้าหน้าที่
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-3">
                      สแกน QR ด้วยแอปธนาคารใดก็ได้ → กรอกยอด ฿
                      {formatBaht(data.payment.totalAmount)}
                    </p>
                  </div>
                )}

                {tab === 'transfer' && (
                  <div className="space-y-3">
                    {banks.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        ยังไม่ได้ตั้งค่าบัญชีธนาคาร
                      </p>
                    ) : (
                      banks.map((b, i) => (
                        <div
                          key={`${b.bankName}-${i}`}
                          className="rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition"
                        >
                          <p className="text-xs text-gray-500">{b.bankName}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="font-mono text-lg font-semibold">
                              {b.accountNo}
                            </p>
                            <button
                              onClick={() => copy(b.accountNo)}
                              className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1"
                            >
                              <Copy size={12} />
                              {copied === b.accountNo ? 'คัดลอกแล้ว' : 'คัดลอก'}
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{b.accountName}</p>
                          {b.branch && (
                            <p className="text-xs text-gray-500">สาขา: {b.branch}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {data.setting?.paymentNote && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
                    {data.setting.paymentNote}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">อัปโหลดสลิปการชำระเงิน</h3>
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                  {error}
                </div>
              )}
              {submitMsg && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 p-3 text-sm">
                  {submitMsg}
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                เลือกรูปสลิป
                <input
                  type="file"
                  hidden
                  disabled={uploading}
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleSlipUpload(e.target.files)}
                />
              </label>
              {slip && (
                <div className="rounded-xl border border-gray-200 p-2 flex items-center gap-2">
                  <img
                    src={slip.url}
                    alt="slip"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <span className="flex-1 text-sm truncate">{slip.name}</span>
                  <button
                    onClick={() => setSlip(null)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <button
                onClick={submitSlip}
                disabled={submitting || !slip}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                ส่งสลิป
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
