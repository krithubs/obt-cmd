'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, MapPin, User, Phone, CheckCircle, Clock, AlertCircle, Camera, Eye, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface Complaint {
  id: string
  ticketNo: string
  name: string
  phone: string
  type: string
  description: string
  location?: string
  latitude?: number
  longitude?: number
  status: string
  notes?: string
  images: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionDetails?: string
  resolutionImages?: string
}

const statusOptions = [
  { value: 'PENDING', label: 'รอดำเนินการ', color: 'yellow' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ', color: 'blue' },
  { value: 'RESOLVED', label: 'แก้ไขเรียบร้อย', color: 'green' },
  { value: 'REJECTED', label: 'ปฏิเสธคำร้อง', color: 'red' }
]

const typeOptions = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'ถนน', label: 'ถนน' },
  { value: 'ไฟฟ้า', label: 'ไฟฟ้า' },
  { value: 'น้ำประปา', label: 'น้ำประปา' },
  { value: 'สิ่งแวดล้อม', label: 'สิ่งแวดล้อม' },
  { value: 'ความสะอาด', label: 'ความสะอาด' },
  { value: 'อื่นๆ', label: 'อื่นๆ' }
]

export default function ComplaintListPage() {
  const { showToast } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints')
      const result = await response.json()
      
      if (result.success) {
        setComplaints(result.complaints)
      } else {
        showToast('error', 'เกิดข้อผิดพลาด', result.error)
      }
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถดูข้อมูลคำร้องได้')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.color || 'gray'
  }

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.label || status
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = searchTerm === '' || 
      complaint.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === '' || complaint.status === statusFilter
    const matchesType = typeFilter === '' || complaint.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const openDetailModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setShowDetailModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">ติดตามสถานะคำร้อง</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่คำร้อง, ชื่อ, รายละเอียด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-500 flex items-center">
              พบ {filteredComplaints.length} รายการ
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบคำร้องที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => {
              const images = JSON.parse(complaint.images || '[]')
              const resolutionImages = JSON.parse(complaint.resolutionImages || '[]')
              
              return (
                <div key={complaint.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {complaint.ticketNo}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(complaint.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(complaint.status)}-100 text-${getStatusColor(complaint.status)}-800`}>
                              {getStatusLabel(complaint.status)}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {complaint.type}
                        </h3>
                        <p className="text-gray-600 line-clamp-2">
                          {complaint.description}
                        </p>
                      </div>
                      <button
                        onClick={() => openDetailModal(complaint)}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <User className="w-4 h-4 mr-2" />
                        {complaint.name}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Phone className="w-4 h-4 mr-2" />
                        {complaint.phone}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(complaint.createdAt)}
                      </div>
                    </div>

                    {/* Location */}
                    {complaint.location && (
                      <div className="mt-3 flex items-start text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{complaint.location}</span>
                      </div>
                    )}

                    {/* Images Preview */}
                    {images.length > 0 && (
                      <div className="mt-4 flex space-x-2">
                        {images.slice(0, 3).map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`รูปภาพ ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ))}
                        {images.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resolution Status */}
                    {complaint.status === 'RESOLVED' && complaint.resolutionDetails && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-green-800 mb-1">
                              แก้ไขเรียบร้อยแล้ว
                            </h4>
                            <p className="text-sm text-green-700 mb-2">
                              {complaint.resolutionDetails}
                            </p>
                            {complaint.resolvedAt && (
                              <p className="text-xs text-green-600">
                                แก้ไขเมื่อ: {formatDate(complaint.resolvedAt)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Resolution Images */}
                        {resolutionImages.length > 0 && (
                          <div className="mt-3 flex space-x-2">
                            {resolutionImages.slice(0, 3).map((image: string, index: number) => (
                              <img
                                key={index}
                                src={image}
                                alt={`รูปภาพหลักฐาน ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-green-200"
                              />
                            ))}
                            {resolutionImages.length > 3 && (
                              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center border-2 border-green-200">
                                <span className="text-xs text-green-600">+{resolutionImages.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* In Progress Status */}
                    {complaint.status === 'IN_PROGRESS' && complaint.notes && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-800 mb-1">
                              กำลังดำเนินการ
                            </h4>
                            <p className="text-sm text-blue-700">
                              {complaint.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  รายละเอียดคำร้อง {selectedComplaint.ticketNo}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Complaint Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลคำร้อง</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ประเภทปัญหา</label>
                      <p className="text-gray-900">{selectedComplaint.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">สถานะ</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(selectedComplaint.status)}
                        <span className={`px-2 py-1 rounded-full text-sm font-medium bg-${getStatusColor(selectedComplaint.status)}-100 text-${getStatusColor(selectedComplaint.status)}-800`}>
                          {getStatusLabel(selectedComplaint.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">ชื่อผู้แจ้ง</label>
                      <p className="text-gray-900">{selectedComplaint.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
                      <p className="text-gray-900">{selectedComplaint.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">วันที่แจ้ง</label>
                      <p className="text-gray-900">{formatDate(selectedComplaint.createdAt)}</p>
                    </div>
                    {selectedComplaint.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">สถานที่</label>
                        <p className="text-gray-900">{selectedComplaint.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">รายละเอียดปัญหา</label>
                  <p className="text-gray-900 mt-1">{selectedComplaint.description}</p>
                </div>

                {/* Original Images */}
                {JSON.parse(selectedComplaint.images || '[]').length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">รูปภาพประกอบการแจ้ง</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {JSON.parse(selectedComplaint.images || '[]').map((image: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`รูปภาพ ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <a
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                          >
                            <span className="text-white text-sm">ดูรูปใหญ่</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Details */}
                {selectedComplaint.status === 'RESOLVED' && selectedComplaint.resolutionDetails && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">รายละเอียดการแก้ไข</h4>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-gray-900">{selectedComplaint.resolutionDetails}</p>
                      {selectedComplaint.resolvedAt && (
                        <p className="text-sm text-green-600 mt-2">
                          แก้ไขเมื่อ: {formatDate(selectedComplaint.resolvedAt)}
                        </p>
                      )}
                    </div>

                    {/* Resolution Images */}
                    {JSON.parse(selectedComplaint.resolutionImages || '[]').length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">รูปภาพหลักฐานการแก้ไข</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {JSON.parse(selectedComplaint.resolutionImages || '[]').map((image: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`รูปภาพหลักฐาน ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                              />
                              <a
                                href={image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                              >
                                <span className="text-white text-sm">ดูรูปใหญ่</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedComplaint.notes && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">บันทึกช่วยจำ</h4>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900">{selectedComplaint.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
