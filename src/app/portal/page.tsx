'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Search,
  Users, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Home,
  Phone,
  Mail,
  Globe,
  Facebook,
  Smartphone
} from 'lucide-react'
import Footer from '@/components/Footer'
import { PageLoading, AnimatedNumber } from '@/components/ui'
import { formatDate, formatDateShort, formatDateUltraShort } from '@/lib/dateFormat'

interface NewsItem {
  id: string
  title: string
  content: string
  category: string
  images: string[]
  createdAt: string
  author: string
}

interface RecentComplaint {
  id: string
  ticketNo: string
  type: string
  status: string
  createdAt: string
  name: string
  description: string
  location: string
}

interface Stats {
  total: number
  resolved: number
  inProgress: number
  pending: number
  successRate: number
  thisMonth: number
  thisMonthInProgress: number
  thisMonthResolved: number
}

export default function PortalHome() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
    successRate: 0,
    thisMonth:0,
    thisMonthInProgress: 0,
    thisMonthResolved: 0
  })
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([])
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])
  const [allNews, setAllNews] = useState<NewsItem[]>([])
  const [newsPage, setNewsPage] = useState(1)
  const [newsLoading, setNewsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const newsPerPage = 3


  useEffect(() => {
    fetchData()
  }, [])

  // Fetch real data from APIs
  const fetchData = async () => {
    try {
      setDataLoading(true)
      
      // Fetch news from real API
      const newsResponse = await fetch('/api/news', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (newsResponse.ok) {
        const newsData = await newsResponse.json()
        // Sort by creation date (newest first) - convert string dates to Date objects for proper sorting
        const sortedNews = newsData.news.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA // newest first
        })
        
        // Transform all news data
        const transformedNews = sortedNews.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: getCategoryText(item.category),
          createdAt: item.createdAt,
          author: item.author?.name || 'ผู้ดูแลระบบ',
          summary: item.content?.substring(0, 100) + '...' || ''
        }))
        
        setAllNews(transformedNews)
        
        // Set initial page data
        const initialNews = transformedNews.slice(0, newsPerPage)
        setLatestNews(initialNews)
      }

      // Fetch complaints from public API (no personal data exposed)
      const complaintsResponse = await fetch('/api/complaints/public', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json()
        
        // Sort by creation date (newest first) - convert string dates to Date objects for proper sorting
        const sortedComplaints = complaintsData.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA // newest first
        })
        
        // Transform data to match portal format - get only 3 latest
        const transformedComplaints = sortedComplaints.slice(0, 3).map((item: any) => ({
          id: item.id,
          ticketNo: item.ticketNo,
          type: item.type,
          status: getStatusText(item.status),
          createdAt: item.createdAt,
          description: item.description || '',
          location: item.location || 'ไม่ระบุ'
        }))
        setRecentComplaints(transformedComplaints)
        
        // Update stats based on real data
        const total = complaintsData.length
        const resolved = complaintsData.filter((c: any) => c.status === 'RESOLVED').length
        const inProgress = complaintsData.filter((c: any) => c.status === 'IN_PROGRESS').length
        const pending = complaintsData.filter((c: any) => c.status === 'PENDING').length
        const successRate = total > 0 ? Math.round((resolved / total) * 100) : 0

        // This month stats
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonthComplaints = complaintsData.filter((c: any) => new Date(c.createdAt) >= thisMonthStart)
        const thisMonth = thisMonthComplaints.length
        const thisMonthInProgress = thisMonthComplaints.filter((c: any) => c.status === 'IN_PROGRESS' || c.status === 'PENDING').length
        const thisMonthResolved = thisMonthComplaints.filter((c: any) => c.status === 'RESOLVED').length
        
        setStats({
          total,
          resolved,
          inProgress,
          pending,
          successRate,
          thisMonth,
          thisMonthInProgress,
          thisMonthResolved
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'ANNOUNCEMENT': return 'ประกาศ'
      case 'ACTIVITY': return 'กิจกรรม'
      case 'WARNING': return 'เตือนภัย'
      case 'NEWS': return 'ข่าวสาร'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ประกาศ': return 'bg-blue-100 text-blue-800'
      case 'กิจกรรม': return 'bg-green-100 text-green-800'
      case 'เตือนภัย': return 'bg-red-100 text-red-800'
      case 'ข่าวสาร': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'รอดำเนินการ': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'IN_PROGRESS':
      case 'ดำเนินการ': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'RESOLVED':
      case 'ดำเนินการแล้ว': return 'bg-green-100 text-green-800 border-green-200'
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

  const paginateNews = (pageNumber: number) => {
    setNewsPage(pageNumber)
    const startIndex = (pageNumber - 1) * newsPerPage
    const endIndex = startIndex + newsPerPage
    const pageNews = allNews.slice(startIndex, endIndex)
    setLatestNews(pageNews)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      console.error('Error parsing date:', dateString, error)
      return 'ไม่ระบุวันที่'
    }
  }


  if (dataLoading) {
    return <PageLoading bgClass="bg-gradient-to-br from-blue-50 via-white to-green-50" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 transform hover:scale-105">
                <span className="text-white font-bold text-xl">อบต</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">อบต.โหล่งขอด</h1>
                <p className="text-sm text-gray-600 font-medium">อ.พร้าว จ.เชียงใหม่ 50190</p>
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
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-soft-lg">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="lg:w-2/3 mb-6 lg:mb-0">
                <h2 className="text-3xl font-bold mb-4 text-thai-heading">ศูนย์แจ้งเหตุบรรเทาทุกข์ออนไลน์ตลอด 24 ชั่วโมง</h2>
                <p className="text-lg mb-6 text-blue-100 text-thai">องค์การบริหารส่วนตำบลโหล่งขอด</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/portal/complaint-form" className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg text-thai">
                    <PlusCircle size={20} className="mr-2" />
                    แจ้งปัญหาใหม่
                  </Link>
                  <Link href="/portal/tracking" className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 text-thai">
                    <Search size={20} className="mr-2" />
                    ติดตามคำร้อง
                  </Link>
                </div>
              </div>
              <div className="lg:w-1/3 text-center lg:text-right">
                {/* 4 Stats Boxes */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white mb-1">
                          <AnimatedNumber value={stats.total} />
                        </div>
                        <div className="text-xs text-blue-100 text-thai">คำร้องทั้งหมด</div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-300 mb-1">
                          <AnimatedNumber value={stats.resolved} />
                        </div>
                        <div className="text-xs text-blue-100 text-thai">สำเร็จแล้ว</div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-300 mb-1">
                          <AnimatedNumber value={stats.inProgress} />
                        </div>
                        <div className="text-xs text-blue-100 text-thai">กำลังดำเนินการ</div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-300 mb-1">
                          <AnimatedNumber value={stats.pending} />
                        </div>
                        <div className="text-xs text-blue-100 text-thai">รอดำเนินการ</div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="card-soft rounded-2xl p-4 sm:p-6 hover:shadow-soft-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">เดือนนี้</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 text-thai-heading">
              <AnimatedNumber value={stats.thisMonth} />
            </div>
            <div className="text-xs sm:text-sm text-gray-600 text-thai">คำร้องเดือนนี้</div>
            <div className="mt-2 sm:mt-3 flex items-center text-purple-600 text-xs sm:text-sm text-thai">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full mr-1.5 sm:mr-2"></span>
              <span className="hidden sm:inline">คำร้องที่เข้ามาในเดือนนี้</span>
              <span className="sm:hidden">{stats.thisMonth} รายการ</span>
            </div>
          </div>

          <div className="card-soft rounded-2xl p-4 sm:p-6 hover:shadow-soft-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">รอดำเนินการ</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 text-thai-heading">
              <AnimatedNumber value={stats.thisMonthInProgress} />
            </div>
            <div className="text-xs sm:text-sm text-gray-600 text-thai">รับเรื่องเดือนนี้</div>
            <div className="mt-2 sm:mt-3 flex items-center text-blue-600 text-xs sm:text-sm text-thai">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full mr-1.5 sm:mr-2"></span>
              <span className="hidden sm:inline">กำลังดำเนินการ/รอดำเนินการ</span>
              <span className="sm:hidden">{stats.thisMonthInProgress} รายการ</span>
            </div>
          </div>

          <div className="card-soft rounded-2xl p-4 sm:p-6 hover:shadow-soft-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">สำเร็จ</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 text-thai-heading">
              <AnimatedNumber value={stats.thisMonthResolved} />
            </div>
            <div className="text-xs sm:text-sm text-gray-600 text-thai">สำเร็จแล้วเดือนนี้</div>
            <div className="mt-2 sm:mt-3 flex items-center text-green-600 text-xs sm:text-sm text-thai">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-600 rounded-full mr-1.5 sm:mr-2"></span>
              <span className="hidden sm:inline">ดำเนินการแก้ไขสำเร็จในเดือนนี้</span>
              <span className="sm:hidden">สำเร็จแล้ว</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest News */}
          <div className="lg:col-span-2">
            <div className="card-soft rounded-3xl overflow-hidden h-full">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-thai-heading">ข่าวสารประชาสัมพันธ์ล่าสุด</h3>
                  <Link href="/portal/news" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center self-start sm:self-auto">
                    ดูทั้งหมด
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {latestNews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-thai">ยังไม่มีข่าวสาร</p>
                    </div>
                  ) : (
                    latestNews.map((news) => {
                      const content = news.content || ''
                      const truncatedContent = content.length > 150 
                        ? content.substring(0, 150) + '...' 
                        : content
                      const hasMore = content.length > 150
                      
                      return (
                      <div key={news.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Post Header */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{news.author}</p>
                                <p className="text-xs text-gray-500">{formatDate(news.createdAt)}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(news.category)}`}>
                              {getCategoryText(news.category)}
                            </span>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 text-thai">{news.title}</h4>
                          <p className="text-sm text-gray-700 text-thai whitespace-pre-line">
                            {truncatedContent}
                            {hasMore && (
                              <Link href={`/portal/news`} className="text-blue-600 hover:text-blue-700 font-medium ml-1">
                                อ่านต่อ
                              </Link>
                            )}
                          </p>
                        </div>

                        {/* Post Images */}
                        {news.images && news.images.length > 0 && (
                          <div className={`grid gap-1 ${
                            news.images.length === 1 ? 'grid-cols-1' :
                            news.images.length === 2 ? 'grid-cols-2' :
                            news.images.length === 3 ? 'grid-cols-3' :
                            'grid-cols-2'
                          }`}>
                            {news.images.slice(0, 4).map((image, idx) => (
                              <div key={idx} className="relative aspect-square overflow-hidden bg-gray-100">
                                <img 
                                  src={image} 
                                  alt={`${news.title} - ${idx + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image'
                                  }}
                                />
                                {idx === 3 && news.images.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">+{news.images.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="space-y-6">
            <div className="card-soft rounded-3xl overflow-hidden h-full">
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 text-thai-heading">คำร้องล่าสุด</h3>
                  <Link href="/portal/tracking" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                    ดูทั้งหมด
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentComplaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-thai">ยังไม่มีคำร้อง</p>
                    </div>
                  ) : (
                    recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors overflow-hidden">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                            {complaint.ticketNo}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{formatDate(complaint.createdAt)}</span>
                          <span className="sm:hidden md:inline">{formatDateShort(complaint.createdAt)}</span>
                          <span className="md:hidden">{formatDateUltraShort(complaint.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mb-2 overflow-hidden">
                        <p className="font-medium text-gray-900 text-thai truncate" title={complaint.description}>{complaint.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 overflow-hidden">
                          <span className="flex items-center text-thai min-w-0 truncate">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{complaint.location}</span>
                          </span>
                          <span className="flex items-center text-thai whitespace-nowrap">
                            <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
                            {complaint.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
