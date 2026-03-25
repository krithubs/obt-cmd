'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    message: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-700',
  },
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const Icon = iconMap[toast.type]
  const colors = colorMap[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${colors.bg} animate-slide-in min-w-[320px] max-w-[420px]`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colors.title}`}>{toast.title}</p>
        {toast.message && <p className={`text-sm mt-0.5 ${colors.message}`}>{toast.message}</p>}
      </div>
      <button onClick={() => onClose(toast.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirm, setConfirm] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, type, title, message, duration }])
  }, [])

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({ options, resolve })
    })
  }, [])

  const handleConfirm = (result: boolean) => {
    confirm?.resolve(result)
    setConfirm(null)
  }

  const confirmColors = {
    danger: { btn: 'bg-red-600 hover:bg-red-700', icon: 'text-red-500', iconBg: 'bg-red-100' },
    warning: { btn: 'bg-yellow-600 hover:bg-yellow-700', icon: 'text-yellow-500', iconBg: 'bg-yellow-100' },
    info: { btn: 'bg-blue-600 hover:bg-blue-700', icon: 'text-blue-500', iconBg: 'bg-blue-100' },
  }

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${confirmColors[confirm.options.type || 'danger'].iconBg}`}>
                  <AlertTriangle className={`w-5 h-5 ${confirmColors[confirm.options.type || 'danger'].icon}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{confirm.options.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{confirm.options.message}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {confirm.options.cancelText || 'ยกเลิก'}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors ${confirmColors[confirm.options.type || 'danger'].btn}`}
              >
                {confirm.options.confirmText || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </ToastContext.Provider>
  )
}
