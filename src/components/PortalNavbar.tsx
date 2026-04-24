'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const navItems = [
  { href: '/portal', label: 'หน้าแรก' },
  { href: '/portal/news', label: 'ข่าวสาร' },
  { href: '/portal/complaint-form', label: 'แจ้งปัญหา' },
  { href: '/portal/faq', label: 'คำถาม' },
]

export default function PortalNavbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-soft-lg">
              <span className="text-white font-bold text-lg sm:text-xl">อบต</span>
            </div>
            <div>
              <Link href="/portal" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                อบต. โค้ดมันเดย์
              </Link>
              <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">สีลม เขตบางรัก กรุงเทพมหานคร</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? 'text-blue-600 font-semibold text-base px-4 py-2 rounded-xl bg-blue-50/50'
                      : 'text-gray-700 hover:text-blue-600 font-medium text-base px-4 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-300'
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="เมนู"
          >
            {menuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    isActive
                      ? 'block text-blue-600 font-semibold text-base px-4 py-3 rounded-xl bg-blue-50'
                      : 'block text-gray-700 hover:text-blue-600 font-medium text-base px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors'
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
