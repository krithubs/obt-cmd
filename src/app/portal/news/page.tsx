'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, Calendar, Facebook, ChevronLeft, User } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'
import { formatDate } from '@/lib/dateFormat'
import { Skeleton } from '@/components/ui'
import DOMPurify from 'dompurify'

interface NewsItem {
  id: string
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  images: string[]
  createdAt: string
  author?: {
    name: string
  }
}

const categoryLabels = {
  ANNOUNCEMENT: 'ประกาศ',
  ACTIVITY: 'กิจกรรม',
  NEWS: 'ข่าวสาร',
  WARNING: 'เตือน'
}

const categoryColors = {
  ANNOUNCEMENT: 'bg-blue-100 text-blue-700 border-blue-200',
  ACTIVITY: 'bg-green-100 text-green-700 border-green-200',
  NEWS: 'bg-purple-100 text-purple-700 border-purple-200',
  WARNING: 'bg-red-100 text-red-700 border-red-200'
}

const categories = Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]

const getCategoryText = (category: keyof typeof categoryLabels) => {
  return categoryLabels[category]
}

function ImageGrid({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null

  if (images.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden">
        <img src={images[0]} alt="" className="w-full max-h-96 object-cover" />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.map((img, i) => (
          <img key={i} src={img} alt="" className="w-full h-48 object-cover" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
      {images.slice(0, 4).map((img, i) => (
        <div key={i} className="relative">
          <img src={img} alt="" className="w-full h-48 object-cover" />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
              +{images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  )
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
    setCurrentPage(1)
  }, [selectedCategory])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const url = selectedCategory === 'ALL'
        ? '/api/news'
        : `/api/news?category=${selectedCategory}`

      const response = await fetch(url, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()

      if (response.ok) {
        setNews(data.news || [])
      } else {
        setNews([])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = news.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(news.length / itemsPerPage)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '')

  const truncateHtml = (html: string, maxLen: number = 200) => {
    const text = stripHtml(html).trim()
    if (text.length <= maxLen) return text
    return text.substring(0, maxLen) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/portal" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors">
            <ChevronLeft size={18} className="mr-1" />
            กลับไปหน้าแรก
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ข่าวสารและประชาสัมพันธ์</h1>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {getCategoryText(category)}
            </button>
          ))}
        </div>

        {/* News Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่มีข่าวสารในหมวดหมู่นี้</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentItems.map((item) => (
                <article key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {item.author?.name?.charAt(0) || 'อ'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.author?.name || 'อบต. โค้ดมันเดย์'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${categoryColors[item.category]}`}>
                          {categoryLabels[item.category]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="px-5 pb-2">
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  </div>

                  {/* Content - render HTML */}
                  <div className="px-5 pb-3">
                    {item.content.includes('<') ? (
                      <div
                        className="text-sm text-gray-700 leading-relaxed [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_b]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed">{truncateHtml(item.content)}</p>
                    )}
                  </div>

                  {/* Images */}
                  {item.images && item.images.length > 0 && (
                    <div className="px-5 pb-3">
                      <ImageGrid images={item.images} />
                    </div>
                  )}
                </article>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => paginate(p)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === p ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
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
      </main>
      <Footer />
    </div>
  )
}
