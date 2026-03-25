'use client'

import { ToastProvider } from '@/components/ui'

export default function PortalLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ToastProvider>
  )
}
