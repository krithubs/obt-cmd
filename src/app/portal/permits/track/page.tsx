'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, Loader2 } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'

export default function TrackLookupPage() {
  const router = useRouter()
  const [requestNo, setRequestNo] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/permits/track/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestNo, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ไม่พบคำร้อง')
      router.push(`/portal/permits/track/${data.trackingToken}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ไม่พบคำร้อง')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/portal/permits"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปรายการคำร้อง
        </Link>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Search size={22} /> ติดตามสถานะคำร้อง
            </h1>
            <p className="text-blue-100 mt-1 text-sm">
              ใช้เลขที่คำร้องและเบอร์โทรที่ใช้ยื่น
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลขที่คำร้อง
              </label>
              <input
                required
                type="text"
                value={requestNo}
                onChange={(e) => setRequestNo(e.target.value)}
                placeholder="เช่น PR2026043000001"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทร
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
