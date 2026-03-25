'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            หน้านี้ไม่พบ
          </h2>
          <p className="text-gray-600 mb-8">
            ขออภัย หน้าที่คุณกำลังมองหาไม่มีอยู่จริง
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                คุณอาจกำลังมองหา:
              </p>
              <div className="space-y-2">
                <Link 
                  href="/portal"
                  className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  หน้าหลัก
                </Link>
                <Link 
                  href="/"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับหน้าแรก
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ตรวจสอบ URL ที่คุณป้อนแล้วลองอีกครั้ง
              </p>
              <p className="text-xs text-gray-500 mt-2">
                หากคุณคิดว่านี่คือข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
