'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Camera, CheckCircle, Clock, AlertCircle, Send, X, Calendar, User, MapPin, Phone, Mail } from 'lucide-react'
import { ButtonSpinner } from '@/components/ui'
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
  user?: {
    id: string
    name: string
    email: string
  }
}

const statusOptions = [
  { value: 'PENDING', label: 'รอดำเนินการ', color: 'yellow' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ', color: 'blue' },
  { value: 'RESOLVED', label: 'แก้ไขเรียบร้อย', color: 'green' },
  { value: 'REJECTED', label: 'ปฏิเสธคำร้อง', color: 'red' }
]

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showResolutionForm, setShowResolutionForm] = useState(false)
  
  // Form data for resolution
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    resolutionDetails: '',
    resolutionImages: [] as File[]
  })

  useEffect(() => {
    fetchComplaint()
  }, [params.id])

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/admin/complaints/${params.id}`, {
        headers: {
          'Authorization': 'Bearer admin-token' // Simple token for now
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setComplaint(result.complaint)
        setFormData({
          status: result.complaint.status,
          notes: result.complaint.notes || '',
          resolutionDetails: result.complaint.resolutionDetails || '',
          resolutionImages: []
        })
      } else {
        showToast('error', 'เกิดข้อผิดพลาด', result.error)
      }
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถดูข้อมูลคำร้องได้')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, resolutionImages: files }))
  }

  const uploadResolutionImages = async (files: File[]) => {
    if (files.length === 0) return []
    
    const uploadData = new FormData()
    files.forEach(file => uploadData.append('files', file))
    
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData })
    if (!uploadRes.ok) {
      throw new Error('อัปโหลดรูปภาพไม่สำเร็จ')
    }
    
    const uploadResult = await uploadRes.json()
    return uploadResult.urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      // อัปโหลดรูปภาพถ้ามี
      let resolutionImages = []
      if (formData.resolutionImages.length > 0) {
        resolutionImages = await uploadResolutionImages(formData.resolutionImages)
      }

      const response = await fetch(`/api/admin/complaints/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token' // Simple token for now
        },
        body: JSON.stringify({
          status: formData.status,
          notes: formData.notes,
          resolutionDetails: formData.status === 'RESOLVED' ? formData.resolutionDetails : null,
          resolutionImages: formData.status === 'RESOLVED' ? JSON.stringify(resolutionImages) : null
        })
      })

      const result = await response.json()
      
      if (result.success) {
        showToast('success', 'อัปเดตสำเร็จ', 'อัปเดตสถานะคำร้องเรียบร้อย')
        setComplaint(result.complaint)
        setShowResolutionForm(false)
      } else {
        showToast('error', 'เกิดข้อผิดพลาด', result.error)
      }
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตคำร้องได้')
    } finally {
      setUpdating(false)
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

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">ไม่พบข้อมูลคำร้อง</p>
        </div>
      </div>
    )
  }

  const originalImages = JSON.parse(complaint.images || '[]')
  const resolutionImages = JSON.parse(complaint.resolutionImages || '[]')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← กลับ
              </button>
              <h1 className="text-2xl font-bold text-gray-900">รายละเอียดคำร้อง</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(complaint.status)}-100 text-${getStatusColor(complaint.status)}-800`}>
                {getStatusLabel(complaint.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                ข้อมูลคำร้อง
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">เลขที่คำร้อง</label>
                    <p className="text-gray-900 font-mono">{complaint.ticketNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ประเภทปัญหา</label>
                    <p className="text-gray-900">{complaint.type}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">รายละเอียดปัญหา</label>
                  <p className="text-gray-900 mt-1">{complaint.description}</p>
                </div>

                {complaint.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานที่</label>
                    <p className="text-gray-900 mt-1">{complaint.location}</p>
                    {complaint.latitude && complaint.longitude && (
                      <p className="text-sm text-gray-500 mt-1">
                        พิกัด: {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">ผู้แจ้ง</label>
                      <p className="text-gray-900">{complaint.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
                      <p className="text-gray-900">{complaint.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">วันที่แจ้ง</label>
                    <p className="text-gray-900">
                      {new Date(complaint.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Original Images */}
            {originalImages.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-blue-600" />
                  รูปภาพประกอบการแจ้ง
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {originalImages.map((image: string, index: number) => (
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
            {complaint.status === 'RESOLVED' && complaint.resolutionDetails && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  รายละเอียดการแก้ไข
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">รายละเอียดการแก้ไข</label>
                    <p className="text-gray-900 mt-1">{complaint.resolutionDetails}</p>
                  </div>

                  {complaint.resolvedAt && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">วันที่แก้ไข</label>
                        <p className="text-gray-900">
                          {new Date(complaint.resolvedAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {resolutionImages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">รูปภาพหลักฐานการแก้ไข</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {resolutionImages.map((image: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`รูปภาพหลักฐาน ${index + 1}`}
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
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">อัปเดตสถานะ</h3>
              
              {!showResolutionForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานะปัจจุบัน</label>
                    <div className={`mt-1 px-3 py-2 rounded-full text-sm font-medium bg-${getStatusColor(complaint.status)}-100 text-${getStatusColor(complaint.status)}-800`}>
                      {getStatusLabel(complaint.status)}
                    </div>
                  </div>

                  {complaint.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">บันทึกช่วยจำ</label>
                      <p className="text-gray-900 mt-1">{complaint.notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowResolutionForm(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    อัปเดตสถานะ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะ
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      บันทึกช่วยจำ
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="บันทึกข้อมูลเพิ่มเติม..."
                    />
                  </div>

                  {formData.status === 'RESOLVED' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รายละเอียดการแก้ไข <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.resolutionDetails}
                          onChange={(e) => handleInputChange('resolutionDetails', e.target.value)}
                          rows={4}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="อธิบายรายละเอียดการแก้ไขปัญหา..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รูปภาพหลักฐานการแก้ไข (ถ้ามี)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png"
                            onChange={handleFileChange}
                            className="hidden"
                            id="resolution-images"
                          />
                          <label htmlFor="resolution-images" className="cursor-pointer">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">คลิกเพื่อเลือกรูปภาพ</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formData.resolutionImages.length > 0 
                                ? `เลือกแล้ว ${formData.resolutionImages.length} ไฟล์`
                                : 'สามารถเลือกได้หลายไฟล์'
                              }
                            </p>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowResolutionForm(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? (
                        <>
                          <ButtonSpinner size="sm" className="inline mr-2" />
                          กำลังอัปเดต...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 inline mr-2" />
                          อัปเดต
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
