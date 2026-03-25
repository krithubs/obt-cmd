'use client'

import { useState } from 'react'
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react'
import { ButtonSpinner } from '@/components/ui'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login process
    setTimeout(() => {
      // In real app, this would be an API call
      window.location.href = '/admin/dashboard'
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="text-blue-100 text-center text-sm">องค์การบริหารส่วนตำบลโหล่งขอด</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  อีเมล
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@longkhot.go.th"
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 bg-white/10 border-white/20 rounded focus:ring-blue-400 focus:ring-2 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-blue-200">จำฉันไว้</span>
                </label>
                <a href="#" className="text-sm text-blue-300 hover:text-white transition-colors">
                  ลืมรหัสผ่าน?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <ButtonSpinner size="md" className="mr-2" />
                    กำลังเข้าสู่ระบบ...
                  </div>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </form>

            {/* Demo Account */}
            <div className="mt-6 p-4 bg-blue-600/20 rounded-2xl border border-blue-400/30">
              <p className="text-xs text-blue-200 text-center">
                <strong>บัญชีสำหรับทดสอบ:</strong><br />
                อีเมล: admin@longkhot.go.th<br />
                รหัสผ่าน: admin123
              </p>
            </div>
          </div>
        </div>

        {/* Back to Portal */}
        <div className="text-center mt-6">
          <a
            href="/portal"
            className="text-blue-300 hover:text-white transition-colors flex items-center justify-center"
          >
            <span className="mr-2">←</span>
            กลับไปหน้าแรก
          </a>
        </div>
      </div>
    </div>
  )
}
