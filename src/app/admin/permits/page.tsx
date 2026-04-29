'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Eye, FileCheck } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import {
  PERMIT_STATUSES,
  STATUS_LABEL,
  STATUS_COLOR,
  PermitStatus,
} from '@/lib/permit'

type Item = {
  id: string
  requestNo: string
  fullName: string
  phone: string
  status: PermitStatus
  createdAt: string
  permitType: { name: string; slug: string }
}

export default function AdminPermitsPage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'ALL' | PermitStatus>('ALL')

  async function load() {
    setItems(null)
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (q) params.set('q', q)
    const res = await fetch(`/api/permits/requests?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'โหลดข้อมูลไม่สำเร็จ')
      setItems([])
      return
    }
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [status])

  const counts = useMemo(() => {
    if (!items) return null
    const c: Record<string, number> = { ALL: items.length }
    PERMIT_STATUSES.forEach((s) => (c[s] = 0))
    items.forEach((i) => (c[i.status] = (c[i.status] || 0) + 1))
    return c
  }, [items])

  if (!items && !error) return <PageLoading />

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="text-blue-600" /> คำร้องใบอนุญาต
          </h1>
          <p className="text-gray-500 mt-1">รายการคำร้องที่ผู้ใช้ยื่นเข้ามา</p>
        </div>
        <Link
          href="/admin/permit-types"
          className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
        >
          จัดการประเภทคำร้อง
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatus('ALL')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            status === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          ทั้งหมด {counts?.ALL ?? 0}
        </button>
        {PERMIT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              status === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABEL[s]} {counts?.[s] ?? 0}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="ค้นหาเลขที่คำร้อง / ชื่อ / เบอร์โทร"
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
                <th className="px-4 py-3">เลขที่</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ผู้ยื่น</th>
                <th className="px-4 py-3">เบอร์โทร</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่ยื่น</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(items || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    ยังไม่มีคำร้อง
                  </td>
                </tr>
              )}
              {(items || []).map((it) => (
                <tr key={it.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{it.requestNo}</td>
                  <td className="px-4 py-3">{it.permitType.name}</td>
                  <td className="px-4 py-3">{it.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{it.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLOR[it.status]}`}
                    >
                      {STATUS_LABEL[it.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {new Date(it.createdAt).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/permits/${it.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Eye size={14} /> ดู
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
