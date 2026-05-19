'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Upload, FileText, User, UserX, Phone, Mail, MessageSquare, AlertCircle, CheckCircle, Copy, Home, BookOpen, Users, ChevronDown, ChevronLeft, Camera, Send, MapPin } from 'lucide-react'
import PortalNavbar from '@/components/PortalNavbar'
import Footer from '@/components/Footer'
import GoogleMapPicker from '@/components/GoogleMapPicker'
import { ButtonSpinner } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import CustomDropdown from '@/components/ui/CustomDropdown'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

interface FormData {
  name: string
  phone: string
  email: string
  problemType: string
  village: string
  location: string
  description: string
  isAnonymous: boolean
  latitude?: number
  longitude?: number
}

export default function ComplaintForm() {
  const problemTypeOptions = [
    { value: 'ถนน', label: 'ถนน', icon: '🛣️' },
    { value: 'ไฟฟ้า', label: 'ไฟฟ้า', icon: '💡' },
    { value: 'น้ำประปา', label: 'น้ำประปา', icon: '💧' },
    { value: 'สิ่งแวดล้อม', label: 'สิ่งแวดล้อม', icon: '🌿' },
    { value: 'ความสะอาด', label: 'ความสะอาด', icon: '🧹' },
    { value: 'เตือนภัย', label: 'เตือนภัย', icon: '⚠️' },
    { value: 'อุบัติเหตุ', label: 'อุบัติเหตุ', icon: '🚨' },
    { value: 'อื่นๆ', label: 'อื่นๆ', icon: '📌' }
  ]

  const villageOptions = [
    { value: '', label: 'เลือกหมู่บ้าน' },
    { value: 'หมู่ 1', label: 'หมู่ 1' },
    { value: 'หมู่ 2', label: 'หมู่ 2' },
    { value: 'หมู่ 3', label: 'หมู่ 3' },
    { value: 'หมู่ 4', label: 'หมู่ 4' },
    { value: 'หมู่ 5', label: 'หมู่ 5' },
    { value: 'หมู่ 6', label: 'หมู่ 6' },
    { value: 'หมู่ 7', label: 'หมู่ 7' },
    { value: 'หมู่ 8', label: 'หมู่ 8' },
    { value: 'หมู่ 9', label: 'หมู่ 9' }
  ]

  const { showToast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    problemType: '',
    village: '',
    location: '',
    description: '',
    isAnonymous: false
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submittedTicketNo, setSubmittedTicketNo] = useState('')
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    setSelectedCoords({ lat, lng })
  }

  const clearMapLocation = () => {
    setFormData(prev => ({
      ...prev,
      latitude: undefined,
      longitude: undefined
    }))
    setSelectedCoords(null)
  }

  const useCurrentLocation = () => {}

  const getFieldBorderClass = (fieldName: string, hasError: boolean) => {
    if (hasError) {
      return 'border-red-500 focus:ring-red-500 focus:border-red-500'
    }
    
    // Check if required field is empty after submission (only for non-anonymous personal fields)
    if (hasSubmitted) {
      const requiredFields = formData.isAnonymous 
        ? ['location', 'problemType', 'description'] // Anonymous: only problem details required
        : ['name', 'location', 'problemType', 'description'] // Non-anonymous: required fields (phone optional)
      
      if (requiredFields.includes(fieldName) && !formData[fieldName as keyof FormData]?.toString().trim()) {
        return 'border-red-300 focus:ring-red-500 focus:border-red-500'
      }
    }
    
    return 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
  }

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Only validate personal info if not anonymous
    if (!formData.isAnonymous) {
      // Name validation
      if (!formData.name.trim()) {
        errors.name = 'กรุณาระบุชื่อ-นามสกุล'
      } else if (formData.name.trim().length > FIELD_LIMITS.COMPLAINT_NAME) {
        errors.name = `ชื่อต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_NAME} ตัวอักษร`
      }
      
      // Phone validation (optional)
      if (formData.phone.trim() && !/^0\d{8,9}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
        errors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)'
      } else if (formData.phone.length > FIELD_LIMITS.COMPLAINT_PHONE) {
        errors.phone = `เบอร์โทรต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_PHONE} ตัว`
      }
    }
    
    // Problem type validation
    if (!formData.problemType) {
      errors.problemType = 'กรุณาเลือกประเภทปัญหา'
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'กรุณาระบุรายละเอียดปัญหา'
    } else if (formData.description.trim().length > FIELD_LIMITS.COMPLAINT_DESCRIPTION) {
      errors.description = `รายละเอียดต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_DESCRIPTION} ตัวอักษร`
    }

    // Files validation (max 1 image)
    if (files && files.length > 1) {
      errors.files = 'อัปโหลดรูปได้สูงสุด 1 รูป'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setHasSubmitted(true)

    const isValid = validateForm()
    if (!isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images first if any
      let imageUrls: string[] = []
      if (files && files.length > 0) {
        const uploadData = new FormData()
        Array.from(files).forEach(file => uploadData.append('files', file))
        
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData })
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json()
          showToast('error', 'อัปโหลดรูปภาพไม่สำเร็จ', uploadErr.error)
          setIsSubmitting(false)
          return
        }
        const uploadResult = await uploadRes.json()
        imageUrls = uploadResult.urls
      }

      // Submit complaint
      const complaintData = {
        name: formData.isAnonymous ? 'ผู้แจ้งประเภทไม่เปิดเผยตัวตน' : formData.name.trim(),
        phone: formData.isAnonymous ? '' : formData.phone.trim(),
        email: formData.isAnonymous ? '' : formData.email.trim(),
        type: formData.problemType,
        village: formData.village,
        location: formData.location.trim(),
        description: formData.description.trim(),
        images: imageUrls,
        isAnonymous: formData.isAnonymous,
        latitude: formData.latitude,
        longitude: formData.longitude
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintData)
      })

      if (response.ok) {
        const result = await response.json()
        setSubmittedTicketNo(result.ticketNo)
        setSubmitSuccess(true)
        
        setFormData({ name: '', phone: '', email: '', problemType: '', village: '', location: '', description: '', isAnonymous: false, latitude: undefined, longitude: undefined })
        setFiles(null)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
      } else {
        const errorData = await response.json()
        if (errorData.errors) {
          setFieldErrors(errorData.errors)
        } else {
          showToast('error', 'ไม่สามารถส่งคำร้อง', errorData.error)
        }
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
      // Generate preview
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      // Clear file error when files are changed
      if (fieldErrors.files) {
        setFieldErrors(prev => ({ ...prev, files: '' }))
      }
    }
  }

  const handleRemoveFile = () => {
    setFiles(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(submittedTicketNo)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const closeSuccessModal = () => {
    setSubmitSuccess(false)
    setSubmittedTicketNo('')
    setCopiedToClipboard(false)
  }

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
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <FileText size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 text-thai-heading">แจ้งปัญหา / ร้องเรียน</h1>
                <p className="text-blue-100 text-thai">กรอกข้อมูลด้านล่างเพื่อแจ้งปัญหาให้ ผู้ใหญ่ลี PHUYAILEE ทราบ</p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>

              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center text-thai-heading">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  ข้อมูลผู้แจ้ง
                </h3>

                {/* Anonymous Option */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                    />
                    <div className="flex items-center">
                      <UserX className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900 text-thai">แจ้งปัญหาโดยไม่ระบุตัวตน</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-600 mt-2 ml-8 text-thai">
                    ข้อมูลส่วนตัวของคุณจะถูกเก็บเป็นความลับ แต่อาจจำเป็นต้องมีข้อมูลติดต่อเพื่อประสานงานเพิ่มเติม
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className={formData.isAnonymous ? 'opacity-50' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-thai">
                      ชื่อ-นามสกุล {!formData.isAnonymous && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={formData.isAnonymous ? 'ไม่ระบุตัวตน' : 'ชื่อ นามสกุล'}
                      maxLength={FIELD_LIMITS.COMPLAINT_NAME}
                      disabled={formData.isAnonymous}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-thai ${getFieldBorderClass('name', !!fieldErrors.name)} ${formData.isAnonymous ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {hasSubmitted && fieldErrors.name && !formData.isAnonymous && (
                      <p className="mt-1 text-sm text-red-600 text-thai">{fieldErrors.name}</p>
                    )}
                  </div>

                  
                  {/* Phone */}
                  <div className={formData.isAnonymous ? 'opacity-50' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-thai">
                      เบอร์โทรศัพท์ (ถ้ามี)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder={formData.isAnonymous ? 'ไม่ระบุตัวตน' : '0812345678'}
                      maxLength={FIELD_LIMITS.COMPLAINT_PHONE}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      disabled={formData.isAnonymous}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-thai ${getFieldBorderClass('phone', !!fieldErrors.phone)} ${formData.isAnonymous ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {hasSubmitted && fieldErrors.phone && !formData.isAnonymous && (
                      <p className="mt-1 text-sm text-red-600 text-thai">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center text-thai-heading">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  รายละเอียดปัญหา
                </h3>

                {/* Problem Type - Chip Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-thai">
                    ประเภทปัญหา <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {problemTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('problemType', option.value)}
                        className={`inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                          formData.problemType === option.value
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <span className="mr-1.5">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {hasSubmitted && fieldErrors.problemType && (
                    <p className="mt-2 text-sm text-red-600 text-thai">{fieldErrors.problemType}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-thai">
                    รายละเอียดปัญหา <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="กรุณาอธิบายรายละเอียดปัญหาที่พบ..."
                    rows={5}
                    maxLength={FIELD_LIMITS.COMPLAINT_DESCRIPTION}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-thai resize-none ${getFieldBorderClass('description', !!fieldErrors.description)}`}
                  />
                  {hasSubmitted && fieldErrors.description && (
                    <p className="mt-1 text-sm text-red-600 text-thai">{fieldErrors.description}</p>
                  )}
                </div>

                {/* Location Section with Google Maps */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-thai">
                    📍 ตำแหน่งที่เกิดปัญหา <span className="text-red-500">*</span>
                  </label>

                  <GoogleMapPicker
                    onLocationSelect={handleMapLocationSelect}
                    onClear={clearMapLocation}
                    selectedCoords={selectedCoords}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center text-thai-heading">
                  <Camera className="w-5 h-5 mr-2 text-blue-600" />
                  รูปภาพประกอบ (ถ้ามี)
                </h3>

                {previewUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-w-sm h-48 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer text-thai"
                        >
                          เลือกรูปภาพ
                        </label>
                      </div>
                      <p className="text-xs text-gray-400 text-thai">
                        รองรับไฟล์ JPG, PNG (สูงสุด 1 รูป)
                      </p>
                    </div>
                  </div>
                )}
                {fieldErrors.files && (
                  <p className="mt-1 text-sm text-red-600 text-thai">{fieldErrors.files}</p>
                )}
              </div>

              
              {/* Validation Error Message */}
              {hasSubmitted && Object.keys(fieldErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mt-0.5 mr-3 flex-shrink-0">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                      <h4 className="text-red-800 font-semibold text-thai mb-1">กรุณาตรวจสอบข้อมูล</h4>
                      <p className="text-red-700 text-sm text-thai">มีข้อมูลบางช่องที่ยังไม่ได้กรอกหรือกรอกไม่ถูกต้อง กรุณาตรวจสอบช่องที่มีข้อความสีแดงและกรอกข้อมูลให้ครบถ้วน</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:scale-105 shadow-lg text-thai disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <ButtonSpinner size="md" className="mr-3" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Send size={20} className="mr-3" />
                      ส่งคำร้อง
                    </>
                  )}
                </button>
              </div>

              {/* Success Modal */}
              {submitSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                    <div className="text-center">
                      {/* Success Icon */}
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      
                      {/* Success Message */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 text-thai">ส่งคำร้องสำเร็จ!</h3>
                      <p className="text-gray-600 mb-6 text-thai">เราได้รับเรื่องร้องของคุณแล้ว จะดำเนินการตรวจสอบในเร็วๆ</p>
                      
                      {/* Ticket Number */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-blue-600 font-medium mb-2 text-thai">เลขที่คำร้องของคุณ:</p>
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-2xl font-bold text-blue-800">{submittedTicketNo}</span>
                          <button
                            onClick={copyToClipboard}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="คัดลอกเลขที่คำร้อง"
                          >
                            {copiedToClipboard ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                        {copiedToClipboard && (
                          <p className="text-sm text-green-600 mt-2 text-thai">คัดลอกแล้ว!</p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={closeSuccessModal}
                          className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors text-thai"
                        >
                          ปิด
                        </button>
                        <Link
                          href="/portal/tracking"
                          onClick={closeSuccessModal}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-center text-thai"
                        >
                          ติดตามคำร้อง
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
