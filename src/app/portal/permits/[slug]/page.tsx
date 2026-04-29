'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Download, Send, CheckCircle2, FileCheck } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'

type PermitType = {
  id: string
  name: string
  slug: string
  description: string | null
  formFileUrl: string | null
  requiredDocs: string
}

export default function PermitDetailPage() {
  const params = useParams<{ slug: string }>()
  const [item, setItem] = useState<PermitType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/permits/types/${params.slug}?public=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setItem(data)
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
  }, [params.slug])

  const requiredDocs: { key: string; label: string; required: boolean }[] = (() => {
    if (!item) return []
    try {
      const arr = JSON.parse(item.requiredDocs)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <PortalNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/portal/permits"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปรายการคำร้อง
        </Link>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4">
            {error}
          </div>
        )}

        {!item && !error && (
          <div className="h-72 rounded-3xl bg-white animate-pulse" />
        )}

        {item && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <FileCheck size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{item.name}</h1>
                  {item.description && (
                    <p className="text-blue-100 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {requiredDocs.length > 0 && (
                <section>
                  <h2 className="font-semibold text-gray-900 mb-3">
                    เอกสารที่ต้องใช้
                  </h2>
                  <ul className="space-y-2">
                    {requiredDocs.map((d) => (
                      <li
                        key={d.key}
                        className="flex items-center gap-2 text-gray-700"
                      >
                        <CheckCircle2
                          size={18}
                          className={d.required ? 'text-emerald-600' : 'text-gray-400'}
                        />
                        <span>
                          {d.label}
                          {!d.required && (
                            <span className="text-gray-400 text-sm ml-1">(ถ้ามี)</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                {item.formFileUrl ? (
                  <a
                    href={item.formFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 font-medium transition"
                  >
                    <Download size={18} />
                    ดาวน์โหลดแบบฟอร์ม
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-400 font-medium">
                    <Download size={18} />
                    ยังไม่มีแบบฟอร์ม
                  </div>
                )}
                <Link
                  href={`/portal/permits/${item.slug}/apply`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow hover:shadow-lg transition"
                >
                  <Send size={18} />
                  ยื่นคำร้อง
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
