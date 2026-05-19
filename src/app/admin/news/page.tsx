'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Eye, Trash2, X, Save, Edit, Upload, Image as ImageIcon, MoreHorizontal, Globe, Pin, Calendar, Megaphone, PartyPopper, Newspaper, AlertTriangle } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { formatDate } from '@/lib/dateFormat'
import BrandLogo from '@/components/BrandLogo'

interface NewsItem {
  id: string
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  images: string[]
  privacySetting?: string
  locationName?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  author?: { id: string; name: string }
}

const CATEGORY_CONFIG = {
  ANNOUNCEMENT: { label: 'ประกาศ', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', icon: Megaphone },
  ACTIVITY: { label: 'กิจกรรม', color: 'bg-green-500', badge: 'bg-green-100 text-green-700', icon: PartyPopper },
  NEWS: { label: 'ข่าวสาร', color: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', icon: Newspaper },
  WARNING: { label: 'เตือน', color: 'bg-red-500', badge: 'bg-red-100 text-red-700', icon: AlertTriangle },
} as const

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'view' | null>(null)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const { showToast, showConfirm } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'ANNOUNCEMENT' as NewsItem['category'],
    images: [] as string[],
    privacySetting: 'public' as string,
    locationName: '',
    isActive: true,
    authorId: 'admin-001',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchNews() }, [])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      if (res.ok) { const data = await res.json(); setNews(data.news || data) }
    } catch { console.error('Error fetching news') }
    finally { setLoading(false) }
  }

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '')

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = 'กรุณาระบุหัวข้อ'
    if (!formData.content.trim()) errors.content = 'กรุณาระบุเนื้อหา'
    else if (stripHtml(formData.content).trim().length < 5) errors.content = 'เนื้อหาต้องมีอย่างน้อย 5 ตัวอักษร'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUploadImages = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
    input.multiple = true
    input.onchange = async () => {
      const files = input.files
      if (!files || files.length === 0) return
      setUploadingImage(true)
      const fd = new FormData()
      for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) fd.append('files', files[i])
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) { const data = await res.json(); (data.urls || []).forEach((u: string) => { setFormData(p => ({ ...p, images: [...p.images, u] })) }) }
      } catch { console.error('Upload failed') }
      finally { setUploadingImage(false) }
    }
    input.click()
  }

  const removeImage = (idx: number) => {
    setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))
  }

  const openAdd = () => {
    setSelectedNews(null)
    setFormData({ title: '', content: '', category: 'ANNOUNCEMENT', images: [], privacySetting: 'public', locationName: '', isActive: true, authorId: 'admin-001' })
    setFormErrors({})
    setShowModal('add')
  }

  const openEdit = (item: NewsItem) => {
    setSelectedNews(item)
    setFormData({
      title: item.title, content: item.content, category: item.category, images: item.images || [],
      privacySetting: (item as any).privacySetting || 'public',
      locationName: (item as any).locationName || '',
      isActive: item.isActive, authorId: item.author?.id || 'admin-001'
    })
    setFormErrors({})
    setShowModal('edit')
    setOpenMenuId(null)
  }

  const openView = (item: NewsItem) => {
    setSelectedNews(item)
    setShowModal('view')
    setOpenMenuId(null)
  }

  const handleDelete = async (id: string) => {
    setOpenMenuId(null)
    const ok = await showConfirm({ title: 'ยืนยันการลบ', message: 'คุณต้องการลบโพสต์นี้ใช่หรือไม่?', confirmText: 'ลบ', type: 'danger' })
    if (!ok) return
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' })
      if (res.ok) { setNews(p => p.filter(n => n.id !== id)); showToast('success', 'ลบโพสต์สำเร็จ') }
      else { showToast('error', 'ไม่สามารถลบโพสต์') }
    } catch { showToast('error', 'เกิดข้อผิดพลาด') }
  }

  const handleSave = async () => {
    if (!validateForm()) return
    try {
      const res = showModal === 'add'
        ? await fetch('/api/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        : await fetch(`/api/news/${selectedNews!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })

      if (res.ok) {
        const saved = await res.json()
        if (showModal === 'add') { setNews(p => [saved, ...p]); showToast('success', 'เพิ่มโพสต์สำเร็จ') }
        else { setNews(p => p.map(n => n.id === saved.id ? saved : n)); showToast('success', 'อัปเดตโพสต์สำเร็จ') }
        setShowModal(null)
      } else {
        const err = await res.json()
        showToast('error', 'ไม่สามารถบันทึก', err.error)
      }
    } catch { showToast('error', 'เกิดข้อผิดพลาด') }
  }

  const filteredNews = news.filter(item => {
    const matchSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()) || stripHtml(item.content).toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter
    return matchSearch && matchCat
  })

  if (loading) return <PageLoading />

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ประชาสัมพันธ์</h1>

        {/* Create Post Box */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="w-10 h-10 rounded-full flex-shrink-0" />
            <button onClick={openAdd} className="flex-1 text-left bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2.5 text-gray-500 text-sm transition-colors">
              มีอะไรจะประชาสัมพันธ์ไหม?
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button onClick={openAdd} className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">
              <ImageIcon className="w-5 h-5 text-green-500" />
              รูปภาพ
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาโพสต์..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          <div className="flex gap-1">
            {(['ALL', 'ANNOUNCEMENT', 'ACTIVITY', 'NEWS', 'WARNING'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'ALL' ? 'ทั้งหมด' : CATEGORY_CONFIG[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* News Feed */}
        {filteredNews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-400">ยังไม่มีโพสต์</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map(item => {
              const cfg = CATEGORY_CONFIG[item.category]
              const preview = stripHtml(item.content).substring(0, 200)
              const needsTruncate = stripHtml(item.content).length > 200
              return (
                <article key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {React.createElement(cfg.icon, { className: 'w-5 h-5' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.author?.name || 'ผู้ใหญ่ลี'}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>·</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.badge}`}>{cfg.label}</span>
                        {!item.isActive && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">ซ่อน</span>}
                      </div>
                    </div>
                    <div className="relative" ref={openMenuId === item.id ? menuRef : null}>
                      <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openMenuId === item.id && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[140px]">
                          <button onClick={() => openView(item)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Eye className="w-4 h-4" /> ดู</button>
                          <button onClick={() => openEdit(item)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Edit className="w-4 h-4" /> แก้ไข</button>
                          <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> ลบ</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-2">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                    {(item as any).locationName && <p className="text-xs text-gray-500 mb-1">📍 {(item as any).locationName}</p>}
                    {item.content.includes('<') ? (
                      <div
                        className="text-sm text-gray-700 leading-relaxed [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_b]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed">{preview}{needsTruncate ? '...' : ''}</p>
                    )}
                  </div>

                  {/* Uploaded Images */}
                  {item.images && item.images.length > 0 && (
                    <div className="mt-1">
                      {item.images.length === 1 ? (
                        <img src={item.images[0]} alt="" className="w-full max-h-[500px] object-cover" />
                      ) : (
                        <div className="grid grid-cols-2 gap-0.5">
                          {item.images.slice(0, 4).map((img, i) => (
                            <div key={i} className="relative">
                              <img src={img} alt="" className="w-full h-48 object-cover" />
                              {i === 3 && item.images.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">+{item.images.length - 4}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action bar under post */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                    <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm transition-colors">
                      <Edit className="w-4 h-4" /> แก้ไข
                    </button>
                    <div className="w-px h-5 bg-gray-200" />
                    <button onClick={() => handleDelete(item.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-red-50 text-red-500 text-sm transition-colors">
                      <Trash2 className="w-4 h-4" /> ลบ
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showModal === 'add' || showModal === 'edit') && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[5vh]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-bold">{showModal === 'add' ? 'สร้างโพสต์' : 'แก้ไขโพสต์'}</h3>
              <button onClick={() => setShowModal(null)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            {/* Author Row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <BrandLogo className="w-10 h-10 rounded-full flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">ผู้ใหญ่ลี</p>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.category}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value as NewsItem['category'] }))}
                    className="text-xs bg-gray-100 border-0 rounded px-2 py-0.5"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select
                    value={formData.isActive ? 'published' : 'draft'}
                    onChange={e => setFormData(p => ({ ...p, isActive: e.target.value === 'published' }))}
                    className="text-xs bg-gray-100 border-0 rounded px-2 py-0.5"
                  >
                    <option value="published">แสดง</option>
                    <option value="draft">แบบร่าง</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-4 pb-4 space-y-3">
              <input
                type="text" value={formData.title}
                onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); if (formErrors.title) setFormErrors(p => { const n = {...p}; delete n.title; return n }) }}
                placeholder="หัวข้อโพสต์"
                className="w-full text-lg font-bold bg-transparent outline-none placeholder-gray-400"
              />
              {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}

              <RichTextEditor
                value={formData.content}
                onChange={html => { setFormData(p => ({ ...p, content: html })); if (formErrors.content) setFormErrors(p => { const n = {...p}; delete n.content; return n }) }}
                placeholder="เขียนเนื้อหาโพสต์..."
              />
              {formErrors.content && <p className="text-xs text-red-500">{formErrors.content}</p>}

              {/* Location */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
                  <input
                    type="text" value={formData.locationName}
                    onChange={e => setFormData(p => ({ ...p, locationName: e.target.value }))}
                    placeholder="เพิ่มสถานที่..."
                    className="w-full pl-7 pr-3 py-1.5 bg-gray-50 rounded-lg text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Image Previews */}
              {formData.images.length > 0 && (
                <div className={`grid ${formData.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                  {formData.images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden">
                      <img src={url} alt="" className="w-full h-32 object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-1">
                  <button type="button" onClick={handleUploadImages} disabled={uploadingImage || formData.images.length >= 5} className="p-2 rounded-full hover:bg-green-50 text-green-600 disabled:opacity-40" title="เพิ่มรูปภาพ">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  {showModal === 'add' ? 'โพสต์' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showModal === 'view' && selectedNews && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[10vh]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold">รายละเอียดโพสต์</h3>
              <button onClick={() => setShowModal(null)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${CATEGORY_CONFIG[selectedNews.category].color} flex items-center justify-center text-white`}>
                  {React.createElement(CATEGORY_CONFIG[selectedNews.category].icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedNews.author?.name || 'ผู้ใหญ่ลี'}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedNews.createdAt)}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">{selectedNews.title}</h3>
              {(selectedNews as any).locationName && <p className="text-xs text-gray-500 mb-1">📍 {(selectedNews as any).locationName}</p>}
              <div
                className="text-sm text-gray-800 leading-relaxed mt-2 [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_b]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: selectedNews.content }}
              />
              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className={`grid ${selectedNews.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1 mt-3 rounded-lg overflow-hidden`}>
                  {selectedNews.images.map((img, i) => <img key={i} src={img} alt="" className="w-full h-40 object-cover" />)}
                </div>
              )}
            </div>
            <div className="flex gap-2 px-4 py-3 border-t">
              <button onClick={() => openEdit(selectedNews)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">แก้ไข</button>
              <button onClick={() => { handleDelete(selectedNews.id); setShowModal(null) }} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200">ลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
