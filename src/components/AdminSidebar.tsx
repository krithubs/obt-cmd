'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  LogOut,
  FileCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Wallet,
  Receipt,
  HomeIcon,
} from 'lucide-react'
import BrandLogo from './BrandLogo'

type LeafItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
type GroupItem = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: LeafItem[]
}
type NavItem = LeafItem | GroupItem

function isGroup(item: NavItem): item is GroupItem {
  return (item as GroupItem).children !== undefined
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด', icon: BarChart3 },
  { href: '/admin/complaints', label: 'รายการคำร้อง', icon: FileText },
  {
    key: 'permits-group',
    label: 'ใบอนุญาต ยื่นแบบ',
    icon: FileCheck,
    children: [
      { href: '/admin/permits', label: 'รายการคำร้องใบอนุญาต', icon: FileCheck },
      { href: '/admin/permit-types', label: 'ประเภทคำร้องใบอนุญาต', icon: Settings },
    ],
  },
  {
    key: 'billing-group',
    label: 'การจัดเก็บค่าบริการ',
    icon: Wallet,
    children: [
      { href: '/admin/households', label: 'ทะเบียนบ้าน', icon: HomeIcon },
      { href: '/admin/billing-payments', label: 'การชำระเงิน', icon: Receipt },
      { href: '/admin/billing-settings', label: 'ตั้งค่า QR/บัญชี', icon: Settings },
    ],
  },
  { href: '/admin/news', label: 'ประชาสัมพันธ์', icon: TrendingUp },
  { href: '/admin/users', label: 'ผู้ใช้', icon: Users },
  { href: '/admin/audit', label: 'บันทึกการทำงาน', icon: AlertCircle },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  const initialOpen: Record<string, boolean> = {}
  for (const item of NAV_ITEMS) {
    if (isGroup(item)) {
      initialOpen[item.key] = item.children.some((c) => pathname.startsWith(c.href))
    }
  }
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen)

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const item of NAV_ITEMS) {
        if (isGroup(item) && item.children.some((c) => pathname.startsWith(c.href))) {
          next[item.key] = true
        }
      }
      return next
    })
  }, [pathname])

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <BrandLogo className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/25" />
          <div>
            <h2 className="text-white text-lg font-bold">ผู้ใหญ่ลี PHUYAILEE</h2>
            <p className="text-gray-400 text-xs">ระบบจัดการคำร้อง</p>
          </div>
        </div>
      </div>

      <nav className="mt-2 flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (isGroup(item)) {
            const open = !!openGroups[item.key]
            const hasActiveChild = item.children.some((c) => pathname === c.href)
            return (
              <div key={item.key}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((p) => ({ ...p, [item.key]: !p[item.key] }))
                  }
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                    hasActiveChild
                      ? 'text-white bg-white/10 backdrop-blur-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 mr-3 ${hasActiveChild ? 'text-blue-400' : ''}`}
                  />
                  <span className={`flex-1 text-left ${hasActiveChild ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                  {open ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {open && (
                  <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'text-white bg-white/10'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <child.icon
                            className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-400' : ''}`}
                          />
                          <span className={isActive ? 'font-medium' : ''}>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-white/10 backdrop-blur-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-400' : ''}`} />
              <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mx-3 mb-3 bg-white/5 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Administrator</p>
            <p className="text-gray-500 text-xs truncate">admin@phuyailee.go.th</p>
          </div>
        </div>
        <Link
          href="/admin/login"
          className="flex items-center text-gray-500 hover:text-red-400 mt-3 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          ออกจากระบบ
        </Link>
      </div>
    </div>
  )
}
