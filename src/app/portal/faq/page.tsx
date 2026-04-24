'use client'

import Link from 'next/link'
import { ChevronLeft, FileText, HelpCircle, Upload, Send, Users, Phone, Mail, Map } from 'lucide-react'
import Footer from '@/components/Footer'
import PortalNavbar from '@/components/PortalNavbar'

export default function FAQPage() {
  const faqs = [
    {
      question: 'แจ้งปัญหาได้ผ่านช่องทางไหนบ้าง?',
      answer: 'ท่านสามารถแจ้งปัญหาได้ผ่านหน้าเว็บไซต์นี้โดยตรง หรือโทรติดต่อที่ อบต. CODEMONDAY ในเวลาราชการ'
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
      <PortalNavbar />

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
                <a href="tel:0615176466" className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-thai">
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
