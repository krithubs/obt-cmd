'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, FileCheck, Search } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'
import { PERMIT_CATEGORIES, categoryLabel, categoryIcon } from '@/lib/permit'

type PermitType = {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  formFileUrl: string | null
  isActive: boolean
}

export default function PermitsListPage() {
  const [items, setItems] = useState<PermitType[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<string>('all')

  useEffect(() => {
    fetch('/api/permits/types?public=1')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data)
        else setError(data.error || 'โหลดข้อมูลไม่สำเร็จ')
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
  }, [])

  const grouped = useMemo(() => {
    if (!items) return []
    const map = new Map<string, PermitType[]>()
    for (const t of items) {
      const key = t.category || 'general'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return PERMIT_CATEGORIES.filter((c) => map.has(c.key)).map((c) => ({
      key: c.key,
      label: c.label,
      icon: c.icon,
      items: map.get(c.key) || [],
    }))
  }, [items])

  const visibleGroups = useMemo(
    () => (activeCat === 'all' ? grouped : grouped.filter((g) => g.key === activeCat)),
    [grouped, activeCat]
  )

  const totalShown = visibleGroups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link
            href="/portal"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" />
            กลับไปหน้าแรก
          </Link>
          <Link
            href="/portal/permits/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
          >
            <Search size={16} />
            ติดตามสถานะ
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <FileCheck size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">คำร้อง / แบบฟอร์ม</h1>
                <p className="text-blue-100 mt-1">เลือกหมวดหมู่หรือแบบฟอร์มที่ต้องการ</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-4">
                {error}
              </div>
            )}

            {items && items.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveCat('all')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    activeCat === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  ทั้งหมด {items.length}
                </button>
                {grouped.map((g) => {
                  const Icon = g.icon
                  return (
                    <button
                      key={g.key}
                      onClick={() => setActiveCat(g.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        activeCat === g.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={14} />
                      {g.label} {g.items.length}
                    </button>
                  )
                })}
              </div>
            )}

            {!items && !error && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            )}

            {items && items.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                ยังไม่มีแบบฟอร์มในระบบ
              </div>
            )}

            {items && items.length > 0 && totalShown === 0 && (
              <div className="text-center text-gray-500 py-12">
                ไม่มีแบบฟอร์มในหมวดหมู่นี้
              </div>
            )}

            <div className="space-y-8">
              {visibleGroups.map((g) => {
                const Icon = g.icon
                return (
                <section key={g.key}>
                  <header className="flex items-center gap-2 mb-3">
                    <Icon size={20} className="text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{g.label}</h2>
                    <span className="text-sm text-gray-400">({g.items.length})</span>
                  </header>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {g.items.map((t) => (
                      <Link
                        key={t.id}
                        href={`/portal/permits/${t.slug}`}
                        className="group block rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition p-4 bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                            <FileCheck size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-700 leading-snug">
                              {t.name}
                            </h3>
                            {t.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
