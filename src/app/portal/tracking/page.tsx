'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, FileText, Users, MapPin, Clock, AlertCircle, CheckCircle, Home } from 'lucide-react'
import Footer from '@/components/Footer'
import { PageLoading, ButtonSpinner } from '@/components/ui'
import { formatDate, formatDateShort, formatDateUltraShort } from '@/lib/dateFormat'

interface Complaint {
  id: string
  ticketNo: string
  type: string
  description: string
  location: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  createdAt: string
  updatedAt?: string
  // Note: name, phone, email are not included in public API for privacy
}

export default function TrackingPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchResult, setSearchResult] = useState<Complaint | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints/public', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Sort by creation date (newest first)
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA // newest first
        })
        setComplaints(sortedData)
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอดำเนินการ'
      case 'IN_PROGRESS': return 'ดำเนินการ'
      case 'RESOLVED': return 'ดำเนินการแล้ว'
      default: return status
    }
  }

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'ไม่ระบุวันที่'
      }
      
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffHours < 1) return 'เมื่อสักครู่'
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
      if (diffDays === 1) return 'เมื่อวานนี้'
      if (diffDays < 7) return `${diffDays} วันที่แล้ว`
      
      // For older dates, return formatted date
      return formatDate(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'ไม่ระบุวันที่'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS': return <AlertCircle className="w-4 h-4" />
      case 'RESOLVED': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchError('กรุณากรอกเลขที่คำร้อง')
      setSearchResult(null)
      return
    }

    setIsSearching(true)
    setSearchError('')

    // Search by ticket number (exact match) - name is not available in public API for privacy
    const result = complaints.find(complaint => 
      complaint.ticketNo && complaint.ticketNo.toLowerCase() === searchTerm.toLowerCase()
    )

    setTimeout(() => {
      if (result) {
        setSearchResult(result)
        setSearchError('')
      } else {
        setSearchResult(null)
        setSearchError('ไม่พบข้อมูลคำร้อง')
      }
      setIsSearching(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResult(null)
    setSearchError('')
    setCurrentPage(1)
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = complaints.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(complaints.length / itemsPerPage)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return <PageLoading bgClass="bg-gradient-to-br from-blue-50 via-white to-green-50" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 transform hover:scale-105">
                <span className="text-white font-bold text-xl">อบต</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">อบต.โหล่งขอด</h1>
                <p className="text-sm text-gray-600 font-medium">อ.พร้าว จ.เชียงใหม่</p>
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
              <Link href="/portal/faq" className="text-gray-700 hover:text-blue-600 font-medium text-base px-4 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-300 transform hover:scale-105">
                คำถาม
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/portal" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ChevronLeft size={18} className="mr-1" />
            กลับไปหน้าแรก
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 text-thai-heading mb-2">ติดตามคำร้อง</h1>
          <p className="text-gray-600 text-thai">ตรวจสอบสถานะคำร้องของคุณ</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-thai-heading text-center">
              ค้นหาคำร้องของคุณ
            </h2>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="กรอกเลขที่คำร้อง (เช่น CT202403001)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-thai"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-thai"
              >
                {isSearching ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    ค้นหา...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2 inline-block" />
                    ค้นหา
                  </>
                )}
              </button>
            </div>

            {searchError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800 text-thai">{searchError}</p>
                </div>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500 text-thai">
              <p>💡 คำแนะนำ:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ค้นหาด้วยเลขที่คำร้องจะได้ผลลัพธ์ที่แม่นยำที่สุด</li>
                <li>สามารถค้นหาด้วยชื่อผู้แจ้งได้</li>
                <li>เลขที่คำร้องมีรูปแบบ CT202403001</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 text-thai-heading">ผลการค้นหา</h3>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                      {searchResult.ticketNo}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-xs sm:text-sm sm:px-4 sm:py-2 font-medium rounded-full border flex items-center justify-center whitespace-nowrap ${getStatusColor(searchResult.status)}`}>
                      <span className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0">{getStatusIcon(searchResult.status)}</span>
                      <span>{getStatusText(searchResult.status)}</span>
                    </span>
                    <span className="text-sm text-gray-500">{getRelativeTime(searchResult.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-thai">รายละเอียดคำร้อง</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700 text-thai">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        ประเภท: {searchResult.type}
                      </div>
                      <div className="flex items-center text-gray-700 text-thai">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        สถานที่: {searchResult.location}
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-700 text-thai whitespace-pre-wrap">{searchResult.description}</p>
                      </div>
                    </div>
                  </div>

                  {searchResult.updatedAt && (
                    <div className="text-sm text-gray-500 text-thai">
                      <p>อัปเดตล่าสุด: {searchResult.updatedAt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Complaints (if no search result) */}
        {!searchResult && !searchError && complaints.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 text-thai-heading">คำร้องทั้งหมด</h3>
              <p className="text-gray-600 text-sm text-thai mt-1">
                แสดง {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, complaints.length)} จาก {complaints.length} รายการ
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentItems.map((complaint) => (
                  <div key={complaint.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                        {complaint.ticketNo}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center justify-center whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                        <span className="w-3 h-3 mr-1 flex-shrink-0">{getStatusIcon(complaint.status)}</span>
                        <span>{getStatusText(complaint.status)}</span>
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 text-thai mb-2 line-clamp-2" title={complaint.description}>
                        {complaint.description}
                      </p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center text-thai">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{complaint.location}</span>
                        </div>
                        <div className="flex items-center text-thai">
                          <FileText className="w-4 h-4 mr-1" />
                          <span className="truncate">{complaint.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(complaint.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ก่อนหน้า
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
