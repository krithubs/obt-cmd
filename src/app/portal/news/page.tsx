'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, Calendar, Tag, Facebook, ChevronLeft } from 'lucide-react'
import Footer from '@/components/Footer'
import { formatDate } from '@/lib/dateFormat'
import { Skeleton } from '@/components/ui'

interface NewsItem {
  id: string
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  imageUrl?: string
  createdAt: string
  author?: {
    name: string
  }
}

const categoryLabels = {
  ANNOUNCEMENT: 'ประชาสัมพันธ์',
  ACTIVITY: 'กิจกรรม',
  NEWS: 'ข่าวสาร',
  WARNING: 'ประกาศ'
}

const categoryColors = {
  ANNOUNCEMENT: 'bg-blue-100 text-blue-800',
  ACTIVITY: 'bg-green-100 text-green-800',
  NEWS: 'bg-yellow-100 text-yellow-800',
  WARNING: 'bg-red-100 text-red-800'
}

const categories = Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]

const getCategoryText = (category: keyof typeof categoryLabels) => {
  return categoryLabels[category]
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    fetchNews()
  }, [selectedCategory])

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when category changes
  }, [selectedCategory])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const url = selectedCategory === 'ALL' 
        ? '/api/news' 
        : `/api/news?category=${selectedCategory}`
      
      const response = await fetch(url, {
        cache: 'no-cache', // ไม่ใช้ cache เพื่อให้ได้ข้อมูลล่าสุด
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (response.ok) {
                setNews(data.news || [])
      } else {
        console.error('API Error:', data.error)
        setNews([])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = news.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(news.length / itemsPerPage)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  const truncateContent = (content: string, maxLength: number = 150) => {
    // Remove date/time patterns to avoid redundancy with the date display
    const cleanContent = content
      .replace(/วันที่ \d+[-\d]*\s*ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|\d+/g, '')
      .replace(/เวลา \d+[:]\d+\s*[-\d]*\s*น\./g, '')
      .replace(/ในวันที่ \d+[-\d]*\s*ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|\d+/g, '')
      .replace(/ณ วันที่ \d+[-\d]*\s*ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|\d+/g, '')
      .trim()
    
    if (cleanContent.length <= maxLength) return cleanContent
    return cleanContent.substring(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
              <Link href="/portal/news" className="relative text-blue-600 font-semibold text-base px-4 py-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-all duration-300">
                <span className="relative z-10">ข่าวสาร</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"></div>
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
        <div className="mb-8">
          <Link href="/portal" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ChevronLeft size={18} className="mr-1" />
            กลับไปหน้าแรก
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 text-thai-heading mb-2">ข่าวสารและประชาสัมพันธ์</h1>
              <p className="text-gray-600 text-thai">ข่าวสารล่าสุดจากองค์การบริหารส่วนตำบลโหล่งขอด</p>
            </div>
            <button
              onClick={fetchNews}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 text-thai"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              รีเฟรชข่าว
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* News Content */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 text-thai border-2 ${
                    selectedCategory === 'ALL' 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  ทั้งหมด
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 text-thai border-2 ${
                      selectedCategory === category 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {getCategoryText(category)}
                  </button>
                ))}
              </div>
            </div>

            {/* News List */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-soft rounded-2xl p-6">
                    <Skeleton className="h-4 w-3/4 mb-3" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="card-soft rounded-2xl p-8 text-center">
                <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2 text-thai">ไม่พบข่าวสาร</h3>
                <p className="text-gray-500 text-thai">ไม่มีข่าวสารในหมวดหมู่นี้ในขณะนี้</p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {currentItems.map((item) => (
                    <article key={item.id} className="card-soft rounded-2xl overflow-hidden hover:shadow-soft-lg transition-all">
                      {item.imageUrl && (
                        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                            {categoryLabels[item.category]}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(item.createdAt)}
                        </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 text-thai-heading">
                        {item.title}
                      </h3>
                      
                      <div className="text-gray-600 mb-4 text-thai">
                        {truncateContent(item.content)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 text-thai">
                          โดย {item.author?.name || 'ผู้ดูแลระบบ'}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
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
            </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Facebook Feed */}
            <div className="card-soft rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Facebook className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 text-thai-heading">Facebook</h3>
              </div>
              <div className="bg-gray-100 rounded-2xl p-4">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded mb-3"></div>
                <p className="text-sm text-gray-600 mb-2 text-thai">
                  ติดตามข่าวสารล่าสุดผ่าน Facebook Page
                </p>
                <div className="bg-blue-600 text-white text-center py-2 rounded text-sm font-medium">
                  อบต ตัวอย่าง
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center text-thai">
                จะแสดง Facebook Page feed จริงเมื่อเชื่อมต่อกับ Facebook API
              </p>
            </div>

            {/* Quick Links */}
            <div className="card-soft rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-thai-heading">ลิงก์ด่วน</h3>
              <div className="space-y-3">
                <a
                  href="/portal"
                  className="block text-gray-600 hover:text-blue-600 transition-colors text-thai"
                >
                  หน้าแรก
                </a>
                <a
                  href="/portal/complaint-form"
                  className="block text-gray-600 hover:text-blue-600 transition-colors text-thai"
                >
                  แจ้งปัญหา
                </a>
                <a
                  href="/portal/faq"
                  className="block text-gray-600 hover:text-blue-600 transition-colors text-thai"
                >
                  คำถามที่พบบ่อย
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
