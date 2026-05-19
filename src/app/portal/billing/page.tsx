'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, Loader2, Wallet, Lightbulb } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'

export default function BillingLookupPage() {
  const router = useRouter()
  const [houseNo, setHouseNo] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/billing/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseNo: houseNo.trim(), fullName: fullName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ไม่พบข้อมูล')
      router.push(`/portal/billing/${data.lookupToken}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ไม่พบข้อมูล')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/portal"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปหน้าแรก
        </Link>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">ชำระค่าน้ำ-ไฟ-ภาษี-ขยะ</h1>
                <p className="text-blue-50 text-sm mt-0.5">
                  กรอกข้อมูลเพื่อดูบิลค้างชำระ
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                บ้านเลขที่ <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="เช่น 123/45"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุลเจ้าบ้าน <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ตามที่ลงทะเบียนกับผู้ใหญ่ลี"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              ค้นหา
            </button>

            <p className="text-xs text-gray-500 leading-relaxed pt-2 flex items-start gap-1.5">
              <Lightbulb size={14} className="mt-0.5 text-amber-500 shrink-0" />
              <span>
                บ้านเลขที่และชื่อเจ้าบ้านต้องตรงกับที่ลงทะเบียนไว้กับผู้ใหญ่ลี
                ถ้ายังไม่เคยลงทะเบียน กรุณาติดต่อเจ้าหน้าที่
              </span>
            </p>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
