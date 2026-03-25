'use client'

import Link from 'next/link'
import { ChevronLeft, FileText, HelpCircle, Upload, Send, Users, Phone, Mail, Map } from 'lucide-react'
import Footer from '@/components/Footer'

export default function FAQPage() {
  const faqs = [
    {
      question: 'แจ้งปัญหาได้ผ่านช่องทางไหนบ้าง?',
      answer: 'ท่านสามารถแจ้งปัญหาได้ผ่านหน้าเว็บไซต์นี้โดยตรง หรือโทรติดต่อที่ อบต.โหล่งขอด ในเวลาราชการ'
    },
    {
      question: 'การแจ้งปัญหาใช้เวลานานแค่ไหน?',
      answer: 'การกรอกข้อมูลในฟอร์มแจ้งปัญหาใช้เวลาประมาณ 5-10 นาที ขึ้นอยู่กับความละเอียดของข้อมูลที่ท่านให้'
    },
    {
      question: 'สามารถแนบรูปภาพประกอบได้หรือไม่?',
      answer: 'ได้ ท่านสามารถแนบรูปภาพประกอบได้สูงสุด 5 รูป ในรูปแบบ JPG หรือ PNG'
    },
    {
      question: 'หลังแจ้งปัญหาแล้วจะได้รับการติดต่อกลับเมื่อไหร่?',
      answer: 'เจ้าหน้าที่จะดำเนินการตรวจสอบและติดต่อกลับภายใน 1-3 วันทำการ'
    },
    {
      question: 'สามารถติดตามสถานะคำร้องได้อย่างไร?',
      answer: 'ท่านสามารถติดตามสถานะคำร้องได้ผ่านเลขที่คำร้องที่ได้รับหลังการแจ้งปัญหา'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 transform hover:scale-105">
                  <span className="text-white font-bold text-xl">อบต</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">อบต.โหล่งขอด</h1>
                  <p className="text-sm text-gray-600 font-medium">อ.พร้าว จ.เชียงใหม่</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/portal" className="text-gray-700 hover:text-blue-600 font-medium text-base px-4 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-300 transform hover:scale-105">
                หน้าแรก
              </Link>
              <Link href="/portal/news" className="text-gray-700 hover:text-blue-600 font-medium text-base px-4 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-300 transform hover:scale-105">
                ข่าวสาร
              </Link>
              <Link href="/portal/complaint-form" className="text-gray-700 hover:text-blue-600 font-medium text-base px-4 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-300 transform hover:scale-105">
                แจ้งปัญหา
              </Link>
              <Link href="/portal/faq" className="relative text-blue-600 font-semibold text-base px-4 py-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-all duration-300">
                <span className="relative z-10">คำถาม</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"></div>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/portal" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
          <ChevronLeft size={18} className="mr-1" />
          กลับไปหน้าแรก
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <HelpCircle size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 text-thai-heading">คำถามที่พบบ่อย</h1>
                <p className="text-blue-100 text-thai">คำถามและคำตอบที่พบบ่อยเกี่ยวกับการแจ้งปัญหา</p>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="p-8">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center text-thai-heading">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 ml-11 leading-relaxed text-thai">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Help Section */}
            <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 text-thai-heading">ต้องการความช่วยเหลือเพิ่มเติมหรือไม่?</h3>
              <p className="text-blue-700 mb-6 text-thai">
                หากท่านมีคำถามเพิ่มเติม สามารถติดต่อเจ้าหน้าที่ได้โดยตรง
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/portal/complaint-form" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-thai">
                  <FileText size={18} className="mr-2" />
                  แจ้งปัญหา
                </Link>
                <a href="tel:053-xxx-xxxx" className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-thai">
                  <Phone size={18} className="mr-2" />
                  โทรติดต่อ
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
