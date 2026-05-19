'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { ButtonSpinner } from '@/components/ui'
import BrandLogo from '@/components/BrandLogo'

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        return
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <BrandLogo className="inline-block w-24 h-24 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">ผู้ใหญ่ลี PHUYAILEE</h1>
          <p className="text-blue-200 text-sm">ระบบจัดการคำร้อง สำหรับเจ้าหน้าที่</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">เข้าสู่ระบบ</h2>

          {error && (
            <div className="mb-5 bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/60" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-sm transition-all"
                  placeholder="admin@phuyailee.go.th"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/60" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-sm transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <ButtonSpinner className="mr-2" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-blue-300/60">สำหรับเจ้าหน้าที่เท่านั้น</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/40 text-xs mt-6">
          ผู้ใหญ่ลี PHUYAILEE สีลม เขตบางรัก กรุงเทพมหานคร
        </p>
      </div>
    </div>
  )
}
