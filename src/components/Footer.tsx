'use client'

import Link from 'next/link'
import { Phone, Globe, Mail, MapPin, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Organization Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">อบต</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">อบต. CODEMONDAY</h3>
                <p className="text-blue-200 text-sm">สีลม เขตบางรัก กรุงเทพมหานคร</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              องค์การบริหารส่วนตำบล CODEMONDAY 
              พร้อมให้บริการประชาชนด้วยความเอาใจใส่
              และประสิทธิภาพสูงสุด
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">บริการ</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              <li>
                <Link href="/portal" className="text-gray-300 hover:text-white transition-colors text-sm">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/portal/news" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ข่าวสารประชาสัมพันธ์
                </Link>
              </li>
              <li>
                <Link href="/portal/complaint-form" className="text-gray-300 hover:text-white transition-colors text-sm">
                  แจ้งปัญหา
                </Link>
              </li>
              <li>
                <Link href="/portal/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                  คำถามที่พบบ่อย
                </Link>
              </li>
              <li>
                <Link href="/portal/tracking" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ติดตามสถานะคำร้อง
                </Link>
              </li>
              <li>
                <span className="text-gray-300 text-sm">
                  ประสานงานต่างๆ
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-blue-200">ติดต่อเรา</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm">061 517 6466</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Globe className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <a href="http://www.codemonday.go.th" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">
                  www.codemonday.go.th
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm">เขตบางรัก กรุงเทพมหานคร</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Facebook className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <a href="https://www.facebook.com/CODEMONDAYBangkok" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">
                  @codemonday
                </a>
              </div>
              <a
                href="https://www.facebook.com/CODEMONDAYBangkok"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span>ติดตามเราบน Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            © 2024 องค์การบริหารส่วนตำบล CODEMONDAY. สงวนลิขสิทธิ์ทั้งหมด
          </div>
          <div className="flex items-center space-x-6 text-gray-400 text-sm">
            <span>เวลาราชการ: 08:30 - 16:30 น.</span>
            <span>•</span>
            <span>พักกลางวัน: 12:00 - 13:00 น.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
