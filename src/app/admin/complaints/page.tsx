'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, FileText, HelpCircle, Upload, Send, MapPin, Camera, Phone, Mail, Map, Users, TrendingUp, AlertCircle, LogOut, X, Save, Image, Calendar, ChevronDown, FileDown, Search, Eye, Plus, Filter, Home, Check, ExternalLink, Trash2, ArrowRightCircle } from 'lucide-react'
import { generateComplaintsExcel } from '@/lib/excel-generator'
import { PageLoading } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import CustomDropdown from '@/components/ui/CustomDropdown'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import { formatDate } from '@/lib/dateFormat'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

interface Complaint {
  id: string
  ticketNo: string
  name: string
  type: string
  description: string
  location: string
  latitude?: number | null
  longitude?: number | null
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'FORWARDED'
  createdAt: string
  updatedAt?: string
  internalNote?: string
  notes?: string
  images?: string[]
  phone?: string
  forwardedTo?: string
}

interface ComplaintFormData {
  name: string
  type: string
  description: string
  location: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'FORWARDED'
  internalNote: string
  phone: string
  images: string[]
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [monthFilter, setMonthFilter] = useState<string>('ALL')
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'add' | 'view' | 'status' | 'accept' | 'forward' | null>(null)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [formData, setFormData] = useState<ComplaintFormData>({
    name: '',
    type: '',
    description: '',
    location: '',
    status: 'PENDING',
    internalNote: '',
    phone: '',
    images: []
  })
  const [formErrors, setFormErrors] = useState<Partial<ComplaintFormData>>({})
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'FORWARDED',
    internalNote: ''
  })
  const [forwardData, setForwardData] = useState({ forwardedTo: '', reason: '' })
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null)
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const { showToast, showConfirm } = useToast()

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints')
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch complaints')
      }
      const data = await response.json()
      const parsed = data.map((c: any) => ({
        ...c,
        images: Array.isArray(c.images) ? c.images : (() => { try { return JSON.parse(c.images) } catch { return [] } })()
      }))
      // Sort by newest first (createdAt descending)
      const sorted = parsed.sort((a: Complaint, b: Complaint) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setComplaints(sorted)
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'FORWARDED': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอรับเรื่อง'
      case 'IN_PROGRESS': return 'กำลังดำเนินการ'
      case 'RESOLVED': return 'เสร็จสิ้น'
      case 'FORWARDED': return 'ส่งต่อ'
      default: return status
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<ComplaintFormData> = {}

    if (!formData.name.trim()) {
      errors.name = 'กรุณาระบุชื่อ'
    } else if (formData.name.trim().length > FIELD_LIMITS.COMPLAINT_NAME) {
      errors.name = `ชื่อต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_NAME} ตัวอักษร`
    }

    if (!formData.type.trim()) {
      errors.type = 'กรุณาระบุประเภท'
    }

    if (!formData.description.trim()) {
      errors.description = 'กรุณาระบุรายละเอียด'
    } else if (formData.description.trim().length < 10) {
      errors.description = 'รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร'
    } else if (formData.description.trim().length > FIELD_LIMITS.COMPLAINT_DESCRIPTION) {
      errors.description = `รายละเอียดต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_DESCRIPTION} ตัวอักษร`
    }

    if (!formData.location.trim()) {
      errors.location = 'กรุณาระบุสถานที่'
    } else if (formData.location.trim().length > FIELD_LIMITS.COMPLAINT_LOCATION) {
      errors.location = `สถานที่ต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_LOCATION} ตัวอักษร`
    }

    if (formData.phone && formData.phone.length > FIELD_LIMITS.COMPLAINT_PHONE) {
      errors.phone = `เบอร์โทรต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_PHONE} ตัว`
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddComplaint = () => {
    setSelectedComplaint(null)
    setFormData({
      name: '',
      type: '',
      description: '',
      location: '',
      status: 'PENDING',
      internalNote: '',
      phone: '',
      images: []
    })
    setFormErrors({})
    setShowModal('add')
  }

  const handleAcceptComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setShowModal('accept')
  }

  const confirmAccept = async () => {
    if (!selectedComplaint) return
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' })
      })
      if (response.ok) {
        const raw = await response.json()
        const updated = { ...raw, images: Array.isArray(raw.images) ? raw.images : (() => { try { return JSON.parse(raw.images) } catch { return [] } })() }
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        showToast('success', 'รับเรื่องสำเร็จ', `เลขที่ ${selectedComplaint.ticketNo} อยู่ระหว่างดำเนินการ`)
        setShowModal(null)
      } else {
        showToast('error', 'ไม่สามารถรับเรื่อง')
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาด')
    }
  }

  const handleEditComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setStatusUpdateData({
      status: complaint.status,
      internalNote: complaint.internalNote || ''
    })
    setAfterImageFile(null)
    setAfterImagePreview(null)
    setShowModal('status')
  }

  const handleForwardComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setForwardData({ forwardedTo: complaint.forwardedTo || '', reason: '' })
    setShowModal('forward')
  }

  const handleSubmitForward = async () => {
    if (!selectedComplaint) return
    if (!forwardData.forwardedTo.trim()) {
      showToast('error', 'กรุณาระบุหน่วยงานปลายทาง')
      return
    }
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FORWARDED',
          forwardedTo: forwardData.forwardedTo.trim(),
          notes: forwardData.reason.trim()
        })
      })
      if (response.ok) {
        const raw = await response.json()
        const updated = { ...raw, images: Array.isArray(raw.images) ? raw.images : (() => { try { return JSON.parse(raw.images) } catch { return [] } })() }
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        showToast('success', 'ส่งต่อเคสสำเร็จ', `ส่งต่อให้ ${forwardData.forwardedTo}`)
        setShowModal(null)
      } else {
        const errorData = await response.json()
        showToast('error', 'ไม่สามารถส่งต่อ', errorData.error)
      }
    } catch (error) {
      console.error('Error forwarding complaint:', error)
      showToast('error', 'เกิดข้อผิดพลาด')
    }
  }

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setShowModal('view')
  }

  const handleSaveComplaint = async () => {
    if (!validateForm()) return

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const raw = await response.json()
        const newComplaint = { ...raw, images: Array.isArray(raw.images) ? raw.images : (() => { try { return JSON.parse(raw.images) } catch { return [] } })() }
        // Add new complaint and sort by newest first
        const updatedComplaints = [...complaints, newComplaint].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setComplaints(updatedComplaints)
        showToast('success', 'เพิ่มคำร้องสำเร็จ', `เลขที่: ${newComplaint.ticketNo}`)
        setShowModal(null)
      } else {
        const errorData = await response.json()
        showToast('error', 'ไม่สามารถบันทึกคำร้อง', errorData.error)
      }
    } catch (error) {
      console.error('Error saving complaint:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกคำร้องได้')
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return

    try {
      let resolutionImageUrls: string[] = []

      // Upload after image if provided
      if (afterImageFile) {
        const uploadData = new FormData()
        uploadData.append('files', afterImageFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData })
        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json()
          resolutionImageUrls = uploadResult.urls || []
        }
      }

      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'RESOLVED',
          internalNote: statusUpdateData.internalNote,
          ...(resolutionImageUrls.length > 0 && { resolutionImages: resolutionImageUrls })
        })
      })

      if (response.ok) {
        const raw = await response.json()
        const updatedComplaint = {
          ...raw,
          images: Array.isArray(raw.images) ? raw.images : (() => { try { return JSON.parse(raw.images) } catch { return [] } })()
        }
        const updatedComplaints = complaints.map(item =>
          item.id === selectedComplaint.id ? updatedComplaint : item
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setComplaints(updatedComplaints)
        showToast('success', 'อัปเดตสถานะสำเร็จ')
        setShowModal(null)
        setAfterImageFile(null)
        setAfterImagePreview(null)
      } else {
        const errorData = await response.json()
        showToast('error', 'ไม่สามารถอัปเดตสถานะ', errorData.error)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้')
    }
  }

  const handleDeleteComplaint = async (complaintId: string) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบคำร้องนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      confirmText: 'ลบคำร้อง',
      type: 'danger'
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setComplaints(complaints.filter(item => item.id !== complaintId))
        showToast('success', 'ลบคำร้องสำเร็จ')
      } else {
        const errorData = await response.json()
        showToast('error', 'ไม่สามารถลบคำร้อง', errorData.error)
      }
    } catch (error) {
      console.error('Error deleting complaint:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถลบคำร้องได้')
    }
  }

  const handleInputChange = (field: keyof ComplaintFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.ticketNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'ALL' || complaint.status === filter
    const matchesType = typeFilter === 'ALL' || complaint.type === typeFilter
    
    const complaintDate = new Date(complaint.createdAt)
    const complaintMonth = complaintDate.getMonth()
    const complaintYear = complaintDate.getFullYear()
    
    const matchesMonth = monthFilter === 'ALL' || complaintMonth === parseInt(monthFilter)
    const matchesYear = yearFilter === 'ALL' || complaintYear === parseInt(yearFilter)
    
    let matchesDateRange = true
    if (dateFrom) {
      matchesDateRange = matchesDateRange && complaintDate >= new Date(dateFrom)
    }
    if (dateTo) {
      matchesDateRange = matchesDateRange && complaintDate <= new Date(dateTo + 'T23:59:59')
    }
    
    return matchesSearch && matchesFilter && matchesType && matchesMonth && matchesYear && matchesDateRange
  })

  // Pagination
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentComplaints = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const complaintTypes = Array.from(new Set(complaints.map(c => c.type))).sort()
  
  // Map English types to Thai for display (if needed)
  const typeLabels: Record<string, string> = {
    'ถนน': 'ถนน',
    'ไฟฟ้า': 'ไฟฟ้า',
    'น้ำประปา': 'น้ำประปา',
    'สิ่งแวดล้อม': 'สิ่งแวดล้อม',
    'ความสะอาด': 'ความสะอาด',
    'อื่นๆ': 'อื่นๆ',
  }

  // Create dropdown options for filters
  const typeFilterOptions = [
    { value: 'ALL', label: 'ทุกประเภท' },
    ...complaintTypes.map(type => ({ value: type, label: typeLabels[type] || type }))
  ]

  const monthFilterOptions = [
    { value: 'ALL', label: 'ทุกเดือน' },
    { value: '0', label: 'มกราคม' },
    { value: '1', label: 'กุมภาพันธ์' },
    { value: '2', label: 'มีนาคม' },
    { value: '3', label: 'เมษายน' },
    { value: '4', label: 'พฤษภาคม' },
    { value: '5', label: 'มิถุนายน' },
    { value: '6', label: 'กรกฎาคม' },
    { value: '7', label: 'สิงหาคม' },
    { value: '8', label: 'กันยายน' },
    { value: '9', label: 'ตุลาคม' },
    { value: '10', label: 'พฤศจิกายน' },
    { value: '11', label: 'ธันวาคม' },
  ]

  const yearFilterOptions = [
    { value: 'ALL', label: 'ทุกปี' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' }
  ]

  const statusUpdateOptions = [
    { value: 'PENDING', label: 'รอดำเนินการ' },
    { value: 'IN_PROGRESS', label: 'ดำเนินการ' },
    { value: 'RESOLVED', label: 'ดำเนินการแล้ว' }
  ]
  const months = [
    { value: 'ALL', label: 'ทุกเดือน' },
    { value: '0', label: 'มกราคม' },
    { value: '1', label: 'กุมภาพันธ์' },
    { value: '2', label: 'มีนาคม' },
    { value: '3', label: 'เมษายน' },
    { value: '4', label: 'พฤษภาคม' },
    { value: '5', label: 'มิถุนายน' },
    { value: '6', label: 'กรกฎาคม' },
    { value: '7', label: 'สิงหาคม' },
    { value: '8', label: 'กันยายน' },
    { value: '9', label: 'ตุลาคม' },
    { value: '10', label: 'พฤศจิกายน' },
    { value: '11', label: 'ธันวาคม' },
  ]
  const years = ['ALL', '2024', '2023', '2022']

  const handleDownloadExcel = async () => {
    try {
      console.log('Excel download clicked, complaints:', filteredComplaints.length);
      console.log('Date range:', { from: dateFrom, to: dateTo });
      
      const excelBytes = await generateComplaintsExcel(filteredComplaints as any, {
        from: dateFrom,
        to: dateTo
      })
      
      console.log('Excel generated, byte length:', excelBytes.length);
      
      // Create blob with proper type - convert Uint8Array to ArrayBuffer
      const arrayBuffer = excelBytes.buffer.slice(excelBytes.byteOffset, excelBytes.byteOffset + excelBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `complaints_report_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.xlsx`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('Excel download completed');
    } catch (error) {
      console.error('Error generating Excel:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast('error', 'ไม่สามารถสร้าง Excel', errorMessage)
    }
  }

  const clearFilters = () => {
    setMonthFilter('ALL')
    setYearFilter(new Date().getFullYear().toString())
    setDateFrom('')
    setDateTo('')
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="flex-1">
      <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">รายการคำร้อง</h1>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Top Row: Search, Status, Add */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="ค้นหาตามชื่อหรือรายละเอียด"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Status Filter Buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setFilter('ALL')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setFilter('PENDING')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      รอดำเนินการ
                    </button>
                    <button
                      onClick={() => setFilter('IN_PROGRESS')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filter === 'IN_PROGRESS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ดำเนินการ
                    </button>
                    <button
                      onClick={() => setFilter('RESOLVED')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filter === 'RESOLVED' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      เสร็จสิ้น
                    </button>
                  </div>

                  <button 
                    onClick={handleDownloadExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    title="ดาวน์โหลดรายงาน Excel"
                  >
                    <FileDown className="w-5 h-5 mr-2" />
                    Excel
                  </button>
                </div>
              </div>

              {/* Filters - Original Layout */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      value={typeFilter}
                      onChange={setTypeFilter}
                      options={typeFilterOptions}
                      className="w-40"
                    />

                    <CustomDropdown
                      value={monthFilter}
                      onChange={setMonthFilter}
                      options={monthFilterOptions}
                      className="w-32"
                    />

                    <CustomDropdown
                      value={yearFilter}
                      onChange={setYearFilter}
                      options={yearFilterOptions}
                      className="w-32"
                    />

                    <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-2">
                      <span className="text-sm text-gray-500">วันที่:</span>
                      <CustomDatePicker
                        value={dateFrom}
                        onChange={setDateFrom}
                        placeholder="จาก"
                        format="yyyy-mm-dd"
                        className="w-32"
                      />
                      <span className="text-gray-400">-</span>
                      <CustomDatePicker
                        value={dateTo}
                        onChange={setDateTo}
                        placeholder="ถึง"
                        format="yyyy-mm-dd"
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-gray-600">
                      แสดง <span className="font-semibold text-blue-600">{filteredComplaints.length}</span> จาก {complaints.length} รายการ
                    </span>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm font-medium"
                    >
                      <X className="w-4 h-4 mr-1" />
                      ล้างตัวกรอง
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Complaints Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      เลขที่
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      ชื่อผู้แจ้ง
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      ประเภท
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      สถานะ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานที่
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      วันที่
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
                        {complaint.ticketNo}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-gray-900" title={complaint.name}>
                          {complaint.name}
                        </div>
                        {complaint.phone && (
                          <div className="text-xs text-gray-500">{complaint.phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {typeLabels[complaint.type] || complaint.type}
                      </td>
                      <td className="px-3 py-3">
                        {/* Mini stepper */}
                        <div className="flex items-center space-x-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                            complaint.status === 'PENDING' ? 'bg-yellow-100 border-yellow-400 text-yellow-600' :
                            'bg-green-500 border-green-500 text-white'
                          }`}>
                            {complaint.status !== 'PENDING' ? <Check className="w-3 h-3" /> : '1'}
                          </div>
                          <div className={`w-4 h-0.5 ${complaint.status !== 'PENDING' ? 'bg-green-400' : 'bg-gray-200'}`} />
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                            complaint.status === 'IN_PROGRESS' ? 'bg-blue-100 border-blue-400 text-blue-600' :
                            (complaint.status === 'RESOLVED' || complaint.status === 'FORWARDED') ? 'bg-green-500 border-green-500 text-white' :
                            'bg-gray-50 border-gray-200 text-gray-400'
                          }`}>
                            {(complaint.status === 'RESOLVED' || complaint.status === 'FORWARDED') ? <Check className="w-3 h-3" /> : '2'}
                          </div>
                          <div className={`w-4 h-0.5 ${
                            complaint.status === 'RESOLVED' ? 'bg-green-400' :
                            complaint.status === 'FORWARDED' ? 'bg-indigo-400' :
                            'bg-gray-200'
                          }`} />
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                            complaint.status === 'RESOLVED' ? 'bg-green-500 border-green-500 text-white' :
                            complaint.status === 'FORWARDED' ? 'bg-indigo-500 border-indigo-500 text-white' :
                            'bg-gray-50 border-gray-200 text-gray-400'
                          }`}>
                            {complaint.status === 'RESOLVED' ? <Check className="w-3 h-3" /> :
                             complaint.status === 'FORWARDED' ? <ArrowRightCircle className="w-3 h-3" /> :
                             '3'}
                          </div>
                        </div>
                        <p className={`mt-1 text-xs font-medium ${
                          complaint.status === 'PENDING' ? 'text-yellow-600' :
                          complaint.status === 'IN_PROGRESS' ? 'text-blue-600' :
                          complaint.status === 'FORWARDED' ? 'text-indigo-600' :
                          'text-green-600'
                        }`}>
                          {getStatusText(complaint.status)}
                          {complaint.status === 'FORWARDED' && complaint.forwardedTo && (
                            <span className="block text-[10px] font-normal text-indigo-500">→ {complaint.forwardedTo}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        <div className="max-w-[200px] truncate" title={complaint.location}>
                          {complaint.location}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        <div className="max-w-[250px] truncate" title={complaint.description}>
                          {complaint.description}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(complaint.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleViewComplaint(complaint)}
                            className="text-blue-600 hover:text-blue-800"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {complaint.status === 'PENDING' && (
                            <button
                              onClick={() => handleAcceptComplaint(complaint)}
                              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full hover:bg-amber-600 shadow-sm"
                            >
                              รับเรื่อง
                            </button>
                          )}
                          {complaint.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                onClick={() => handleEditComplaint(complaint)}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-full hover:bg-green-700 shadow-sm"
                              >
                                ปิดเคส
                              </button>
                              <button
                                onClick={() => handleForwardComplaint(complaint)}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full hover:bg-indigo-700 shadow-sm flex items-center"
                                title="ส่งต่อให้หน่วยงานที่เกี่ยวข้อง"
                              >
                                <ArrowRightCircle className="w-3 h-3 mr-1" />
                                ส่งต่อ
                              </button>
                            </>
                          )}
                          {complaint.status === 'RESOLVED' && (
                            <span className="text-xs text-green-600 font-medium flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              เสร็จสิ้น
                            </span>
                          )}
                          {complaint.status === 'FORWARDED' && (
                            <span
                              className="text-xs text-indigo-600 font-medium flex items-center"
                              title={complaint.forwardedTo ? `ส่งต่อให้ ${complaint.forwardedTo}` : 'ส่งต่อ'}
                            >
                              <ArrowRightCircle className="w-3 h-3 mr-1" />
                              ส่งต่อ
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteComplaint(complaint.id)}
                            className="text-red-600 hover:text-red-800 ml-1"
                            title="ลบคำร้อง"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      แสดง <span className="font-medium">{indexOfFirstItem + 1}</span> ถึง{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredComplaints.length)}</span> จาก{' '}
                      <span className="font-medium">{filteredComplaints.length}</span> รายการ
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        ก่อนหน้า
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showModal === 'add' ? 'เพิ่มคำร้องใหม่' : showModal === 'status' ? 'ปิดเคส' : showModal === 'view' ? 'รายละเอียดคำร้อง' : showModal === 'accept' ? 'ยืนยันรับเรื่อง' : showModal === 'forward' ? 'ส่งต่อเคส' : ''}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Update Modal */}
            {showModal === 'status' && selectedComplaint && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">เลขที่คำร้อง</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.ticketNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อผู้แจ้ง</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานที่</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.location}</p>
                    {selectedComplaint.latitude && selectedComplaint.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        เปิดใน Google Maps
                      </a>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะปัจจุบัน</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusText(selectedComplaint.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่แจ้ง</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedComplaint.description}</p>
                </div>

                {/* Close Case Form */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">ปิดคำร้อง</h4>
                  <p className="text-sm text-gray-500 mb-4">เลขที่ {selectedComplaint.ticketNo} — {selectedComplaint.type}</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">บันทึกการแก้ไข</label>
                      <textarea
                        value={statusUpdateData.internalNote}
                        onChange={(e) => setStatusUpdateData(prev => ({ ...prev, internalNote: e.target.value }))}
                        rows={3}
                        maxLength={FIELD_LIMITS.COMPLAINT_INTERNAL_NOTE}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="ระบุรายละเอียดการแก้ไขปัญหา..."
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-green-800 mb-2">📷 แนบรูปหลังแก้ไข (ไม่บังคับ)</label>
                      {afterImagePreview ? (
                        <div className="relative inline-block">
                          <img src={afterImagePreview} alt="After preview" className="w-full max-w-xs h-40 object-cover rounded-lg border" />
                          <button
                            type="button"
                            onClick={() => { setAfterImageFile(null); if (afterImagePreview) URL.revokeObjectURL(afterImagePreview); setAfterImagePreview(null) }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAfterImageFile(e.target.files[0])
                              setAfterImagePreview(URL.createObjectURL(e.target.files[0]))
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    ปิดเคส
                  </button>
                </div>
              </div>
            )}

            {/* View Modal */}
            {showModal === 'view' && selectedComplaint && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">เลขที่คำร้อง</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.ticketNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อผู้แจ้ง</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานที่</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedComplaint.location}</p>
                    {selectedComplaint.latitude && selectedComplaint.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        เปิดใน Google Maps
                      </a>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusText(selectedComplaint.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่แจ้ง</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
                {selectedComplaint.internalNote && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">บันทึกภายใน</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedComplaint.internalNote}</p>
                  </div>
                )}
                {selectedComplaint.images && Array.isArray(selectedComplaint.images) && selectedComplaint.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">รูปภาพประกอบ</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {selectedComplaint.images.map((image: string, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`รูปภาพ ${index + 1}`}
                            className="w-full h-32 object-cover rounded cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => window.open(image, '_blank')}
                              className="bg-white rounded-full p-1 shadow hover:shadow-md"
                            >
                              <Eye className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons in view modal */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedComplaint.status === 'PENDING' && (
                    <button
                      onClick={() => handleAcceptComplaint(selectedComplaint)}
                      className="px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 shadow-sm flex items-center"
                    >
                      รับเรื่อง
                    </button>
                  )}
                  {selectedComplaint.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        setStatusUpdateData({ status: 'IN_PROGRESS', internalNote: '' })
                        setAfterImageFile(null)
                        setAfterImagePreview(null)
                        setShowModal('status')
                      }}
                      className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-sm flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      ปิดเคส
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )}

            {/* Accept Confirmation Modal */}
            {showModal === 'accept' && selectedComplaint && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 font-medium text-center">
                    กรุณาตรวจสอบรายละเอียดก่อนยืนยันรับเรื่อง
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">เลขที่คำร้อง</label>
                      <p className="text-sm font-bold text-blue-600">{selectedComplaint.ticketNo}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">วันที่แจ้ง</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedComplaint.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">ชื่อผู้แจ้ง</label>
                      <p className="text-sm text-gray-900">{selectedComplaint.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">เบอร์โทร</label>
                      <p className="text-sm text-gray-900">{selectedComplaint.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">ประเภท</label>
                      <p className="text-sm text-gray-900">{selectedComplaint.type}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">สถานที่</label>
                      <p className="text-sm text-gray-900">{selectedComplaint.location}</p>
                      {selectedComplaint.latitude && selectedComplaint.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          เปิดแผนที่
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">รายละเอียด</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                  {selectedComplaint.images && Array.isArray(selectedComplaint.images) && selectedComplaint.images.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500">รูปภาพประกอบ</label>
                      <div className="mt-1 grid grid-cols-3 gap-2">
                        {selectedComplaint.images.map((image: string, index: number) => (
                          <img key={index} src={image} alt={`รูป ${index + 1}`} className="w-full h-24 object-cover rounded cursor-pointer" onClick={() => window.open(image, '_blank')} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmAccept}
                    className="px-6 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 shadow-sm"
                  >
                    ยืนยันรับเรื่อง
                  </button>
                </div>
              </div>
            )}

            {/* Forward Modal */}
            {showModal === 'forward' && selectedComplaint && (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start">
                  <ArrowRightCircle className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-indigo-800">
                    <p className="font-semibold mb-1">ส่งต่อให้หน่วยงานที่เกี่ยวข้อง</p>
                    <p className="text-xs text-indigo-700">
                      เคสนี้จะถูกปิดในระบบของเรา และส่งต่อไปให้หน่วยงานปลายทางเป็นผู้ดำเนินการ
                      ผู้แจ้งจะเห็นว่าเคสนี้ส่งต่อ ไม่ใช่ปิดเอง
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <div><span className="text-gray-500">เลขที่:</span> <span className="font-medium text-blue-600">{selectedComplaint.ticketNo}</span></div>
                  <div><span className="text-gray-500">ประเภท:</span> {selectedComplaint.type}</div>
                  <div><span className="text-gray-500">รายละเอียด:</span> {selectedComplaint.description}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หน่วยงานปลายทาง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={forwardData.forwardedTo}
                    onChange={(e) => setForwardData(prev => ({ ...prev, forwardedTo: e.target.value }))}
                    maxLength={200}
                    placeholder="เช่น การไฟฟ้าส่วนภูมิภาค, แขวงทางหลวง, การประปาส่วนภูมิภาค"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล / รายละเอียดการส่งต่อ</label>
                  <textarea
                    value={forwardData.reason}
                    onChange={(e) => setForwardData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    maxLength={FIELD_LIMITS.COMPLAINT_INTERNAL_NOTE}
                    placeholder="เช่น ปัญหาอยู่นอกเขตความรับผิดชอบ อบต. จึงประสานต่อให้หน่วยงานเฉพาะ..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmitForward}
                    className="px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                  >
                    <ArrowRightCircle className="w-4 h-4 mr-2" />
                    ยืนยันส่งต่อ
                  </button>
                </div>
              </div>
            )}

            {/* Add Modal */}
            {showModal === 'add' && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveComplaint(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อผู้แจ้ง *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      maxLength={FIELD_LIMITS.COMPLAINT_NAME}
                      className={`mt-1 block w-full px-3 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="กรอกชื่อผู้แจ้ง"
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      maxLength={FIELD_LIMITS.COMPLAINT_PHONE}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="กรอกเบอร์โทรศัพท์"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภท *</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border ${formErrors.type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="กรอกประเภทปัญหา"
                    />
                    {formErrors.type && <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">สถานที่ *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      maxLength={FIELD_LIMITS.COMPLAINT_LOCATION}
                      className={`mt-1 block w-full px-3 py-2 border ${formErrors.location ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="กรอกสถานที่"
                    />
                    {formErrors.location && <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">รายละเอียด *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    maxLength={FIELD_LIMITS.COMPLAINT_DESCRIPTION}
                    className={`mt-1 block w-full px-3 py-2 border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="กรอกรายละเอียดปัญหา"
                  />
                  <p className="mt-1 text-xs text-gray-400 text-right">{formData.description.length}/{FIELD_LIMITS.COMPLAINT_DESCRIPTION}</p>
                  {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
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
    </div>
  )
}
