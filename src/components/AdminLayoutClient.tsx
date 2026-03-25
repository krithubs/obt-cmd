'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import { ToastProvider } from '@/components/ui'

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1 min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
