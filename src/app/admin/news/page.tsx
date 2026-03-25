'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Eye, Edit2, Trash2, Calendar, FileText, Bell, Activity, AlertTriangle, Newspaper, Filter, X, Save, Edit, Image as ImageIcon } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import CustomDropdown from '@/components/ui/CustomDropdown'
import { formatDate } from '@/lib/dateFormat'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

interface NewsItem {
  id: string
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt?: string
  author?: {
    id: string
    name: string
  }
}

interface NewsFormData {
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  images: string[]
  isActive: boolean
  authorId: string
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'view' | null>(null)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  
  const { showToast, showConfirm } = useToast()
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    category: 'ANNOUNCEMENT',
    images: [],
    isActive: true,
    authorId: '' // Will be set from logged-in user
  })
  const [formErrors, setFormErrors] = useState<Partial<NewsFormData>>({})
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news')
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      const data = await response.json()
      // API returns { news: [...] } for portal compatibility
      setNews(data.news || data)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ANNOUNCEMENT': return 'bg-blue-100 text-blue-800'
      case 'ACTIVITY': return 'bg-green-100 text-green-800'
      case 'NEWS': return 'bg-purple-100 text-purple-800'
      case 'WARNING': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'ANNOUNCEMENT': return 'ประกาศ'
      case 'ACTIVITY': return 'กิจกรรม'
      case 'NEWS': return 'ข่าวสาร'
      case 'WARNING': return 'เตือน'
      default: return category
    }
  }

  const categoryFilterOptions = [
    { value: 'ALL', label: 'ทุกประเภท' },
    { value: 'ANNOUNCEMENT', label: 'ประกาศ' },
    { value: 'ACTIVITY', label: 'กิจกรรม' },
    { value: 'NEWS', label: 'ข่าวสาร' },
    { value: 'WARNING', label: 'เตือน' }
  ]

  const statusFilterOptions = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'true', label: 'แสดง' },
    { value: 'false', label: 'ซ่อน' }
  ]

  const categoryOptions = [
    { value: 'ANNOUNCEMENT', label: 'ประกาศ' },
    { value: 'ACTIVITY', label: 'กิจกรรม' },
    { value: 'NEWS', label: 'ข่าวสาร' },
    { value: 'WARNING', label: 'เตือน' }
  ]

  const validateForm = (): boolean => {
    const errors: Partial<NewsFormData> = {}

    if (!formData.title.trim()) {
      errors.title = 'กรุณาระบุหัวข้อ'
    } else if (formData.title.trim().length < 5) {
      errors.title = 'หัวข้อต้องมีอย่างน้อย 5 ตัวอักษร'
    } else if (formData.title.trim().length > FIELD_LIMITS.NEWS_TITLE) {
      errors.title = `หัวข้อต้องไม่เกิน ${FIELD_LIMITS.NEWS_TITLE} ตัวอักษร`
    }

    if (!formData.content.trim()) {
      errors.content = 'กรุณาระบุเนื้อหา'
    } else if (formData.content.trim().length < 10) {
      errors.content = 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร'
    } else if (formData.content.trim().length > FIELD_LIMITS.NEWS_CONTENT) {
      errors.content = `เนื้อหาต้องไม่เกิน ${FIELD_LIMITS.NEWS_CONTENT} ตัวอักษร`
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddImage = (url: string) => {
    if (url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }))
      setImagePreview(prev => [...prev, url.trim()])
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddNews = () => {
    setSelectedNews(null)
    setFormData({
      title: '',
      content: '',
      category: 'ANNOUNCEMENT',
      images: [],
      isActive: true,
      authorId: 'admin-001' // Use valid admin ID
    })
    setImagePreview([])
    setFormErrors({})
    setShowModal('add')
  }

  const handleEditNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem)
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category,
      images: newsItem.images || [],
      isActive: newsItem.isActive,
      authorId: newsItem.author?.id || 'admin-001'
    })
    setImagePreview(newsItem.images || [])
    setFormErrors({})
    setShowModal('edit')
  }

  const handleViewNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem)
    setShowModal('view')
  }

  const handleDeleteNews = async (newsId: string) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบประชาสัมพันธ์นี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      confirmText: 'ลบประชาสัมพันธ์',
      type: 'danger'
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNews(news.filter(item => item.id !== newsId))
        showToast('success', 'ลบประชาสัมพันธ์สำเร็จ')
      } else {
        const errorData = await response.json()
        showToast('error', 'ไม่สามารถลบประชาสัมพันธ์', errorData.error)
      }
    } catch (error) {
      console.error('Error deleting news:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถลบประชาสัมพันธ์ได้')
    }
  }

  const handleSaveNews = async () => {
    if (!validateForm()) return

    try {
      let response
      if (showModal === 'add') {
        response = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
      } else if (showModal === 'edit' && selectedNews) {
        response = await fetch(`/api/news/${selectedNews.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
      }

      if (response && response.ok) {
        if (showModal === 'add') {
          const newNews = await response.json()
          setNews([...news, newNews])
          showToast('success', 'เพิ่มประชาสัมพันธ์สำเร็จ', `สร้าง "${newNews.title}" เรียบร้อยแล้ว`)
        } else if (showModal === 'edit' && selectedNews) {
          const updatedNews = await response.json()
          setNews(news.map(item => 
            item.id === selectedNews.id ? updatedNews : item
          ))
          showToast('success', 'อัปเดตประชาสัมพันธ์สำเร็จ')
        }
        setShowModal(null)
      } else {
        const errorData = response ? await response.json() : { error: 'Unknown error' }
        showToast('error', 'ไม่สามารถบันทึกข้อมูล', errorData.error)
      }
    } catch (error) {
      console.error('Error saving news:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้')
    }
  }

  const handleInputChange = (field: keyof NewsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Filter news based on search and filters
  const filteredNews = news.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
    
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && item.isActive) ||
      (statusFilter === 'INACTIVE' && !item.isActive)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <>
      <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">ประชาสัมพันธ์</h1>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ค้นหาตามหัวข้อหรือเนื้อหา"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <CustomDropdown
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryFilterOptions}
                  className="w-40"
                />

                {/* Status Filter */}
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusFilterOptions}
                  className="w-32"
                />

                <button 
                  onClick={handleAddNews}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center ml-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  เพิ่มประชาสัมพันธ์
                </button>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  แสดง <span className="font-semibold text-blue-600">{filteredNews.length}</span> จาก {news.length} รายการ
                </div>
                {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center text-sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>

            {/* News Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หัวข้อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      ผู้เขียน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNews.map((newsItem) => (
                    <tr key={newsItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{newsItem.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{newsItem.content}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(newsItem.category)}`}>
                          {getCategoryText(newsItem.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          newsItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {newsItem.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {newsItem.author?.name || 'ผู้ดูแลระบบ'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(newsItem.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewNews(newsItem)}
                            className="text-blue-600 hover:text-blue-800"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditNews(newsItem)}
                            className="text-green-600 hover:text-green-800"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(newsItem.id)}
                            className="text-red-600 hover:text-red-800"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showModal === 'add' ? 'เพิ่มประชาสัมพันธ์ใหม่' : showModal === 'edit' ? 'แก้ไขประชาสัมพันธ์' : 'รายละเอียดประชาสัมพันธ์'}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showModal === 'view' && selectedNews ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">หัวข้อ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNews.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">เนื้อหา</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedNews.content}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getCategoryColor(selectedNews.category)}`}>
                    {getCategoryText(selectedNews.category)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                    selectedNews.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedNews.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ผู้เขียน</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNews.author?.name || 'ผู้ดูแลระบบ'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สร้าง</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNews.createdAt}</p>
                </div>
                {selectedNews.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่อัปเดต</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedNews.updatedAt}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveNews(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">หัวข้อ *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    maxLength={FIELD_LIMITS.NEWS_TITLE}
                    className={`mt-1 block w-full px-3 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="กรอกหัวข้อประชาสัมพันธ์"
                  />
                  <p className="mt-1 text-xs text-gray-400 text-right">{formData.title.length}/{FIELD_LIMITS.NEWS_TITLE}</p>
                  {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">เนื้อหา *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={6}
                    maxLength={FIELD_LIMITS.NEWS_CONTENT}
                    className={`mt-1 block w-full px-3 py-2 border ${formErrors.content ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="กรอกเนื้อหาประชาสัมพันธ์"
                  />
                  <p className="mt-1 text-xs text-gray-400 text-right">{formData.content.length}/{FIELD_LIMITS.NEWS_CONTENT}</p>
                  {formErrors.content && <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภท *</label>
                  <CustomDropdown
                    value={formData.category}
                    onChange={(value) => handleInputChange('category', value as 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING')}
                    options={categoryOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ</label>
                  <div className="space-y-3">
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {imagePreview.map((url, index) => (
                          <div key={index} className="relative group">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="imageUrl"
                        placeholder="ใส่ URL รูปภาพ (https://...)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const input = e.target as HTMLInputElement
                            handleAddImage(input.value)
                            input.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('imageUrl') as HTMLInputElement
                          if (input) {
                            handleAddImage(input.value)
                            input.value = ''
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        เพิ่ม
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">กด Enter หรือคลิก "เพิ่ม" เพื่อเพิ่มรูปภาพ</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    ใช้งาน
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
