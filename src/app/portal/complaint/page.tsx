'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, MapPin, X, Camera, Send } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import CustomDropdown from '@/components/ui/CustomDropdown'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

const complaintSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').max(FIELD_LIMITS.COMPLAINT_NAME, `ชื่อต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_NAME} ตัวอักษร`),
  phone: z.string().min(10, 'กรุณากรอกข้อมูลเบอร์ติดต่อ').max(FIELD_LIMITS.COMPLAINT_PHONE, `เบอร์โทรต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_PHONE} ตัว`),
  type: z.enum(['ถนน', 'ไฟฟ้า', 'น้ำประปา', 'สิ่งแวดล้อม', 'ความสะอาด', 'อื่นๆ'], {
    errorMap: () => ({ message: 'กรุณาเลือกประเภทปัญหา' })
  }),
  village: z.enum(['หมู่ 1', 'หมู่ 2', 'หมู่ 3', 'หมู่ 4', 'หมู่ 5', 'หมู่ 6', 'หมู่ 7', 'หมู่ 8', 'หมู่ 9'], {
    errorMap: () => ({ message: 'กรุณาเลือกหมู่บ้าน' })
  }),
  description: z.string().min(10, 'กรุณาระบุรายละเอียดปัญหา').max(FIELD_LIMITS.COMPLAINT_DESCRIPTION, `รายละเอียดต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_DESCRIPTION} ตัวอักษร`),
  location: z.string().min(1, 'กรุณาระบุรายละเอียดสถานที่').max(FIELD_LIMITS.COMPLAINT_LOCATION, `สถานที่ต้องไม่เกิน ${FIELD_LIMITS.COMPLAINT_LOCATION} ตัวอักษร`),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})

type ComplaintFormData = z.infer<typeof complaintSchema>

const complaintTypes = [
  { value: '', label: 'เลือกประเภทปัญหา' },
  { value: 'ถนน', label: 'ถนน' },
  { value: 'ไฟฟ้า', label: 'ไฟฟ้า' },
  { value: 'น้ำประปา', label: 'น้ำประปา' },
  { value: 'สิ่งแวดล้อม', label: 'สิ่งแวดล้อม' },
  { value: 'ความสะอาด', label: 'ความสะอาด' },
  { value: 'อื่นๆ', label: 'อื่นๆ' }
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

export default function ComplaintForm() {
  const { showToast } = useToast()
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema)
  })

  const getFieldBorderClass = (fieldName: keyof ComplaintFormData, hasError: boolean) => {
    if (hasError) {
      return 'border-red-500 focus:ring-red-500 focus:border-red-500'
    }
    
    // Check if required field is empty after submission
    if (hasSubmitted) {
      const requiredFields: (keyof ComplaintFormData)[] = ['name', 'location', 'phone', 'type', 'village', 'description']
      if (requiredFields.includes(fieldName) && !getValues(fieldName)?.toString().trim()) {
        return 'border-red-300 focus:ring-red-500 focus:border-red-500'
      }
    }
    
    return 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (validFiles.length + images.length > 5) {
      showToast('warning', 'รูปภาพเกินกำหนด', 'สามารถอัปโหลดรูปภาพได้สูงสุด 5 รูป')
      return
    }
    
    setImages([...images, ...validFiles])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', position.coords.latitude)
          setValue('longitude', position.coords.longitude)
          // In a real app, you'd reverse geocode to get address
          setValue('location', `พิกัด: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`)
        },
        (error) => {
          console.error('Error getting location:', error)
          showToast('error', 'ไม่สามารถดึงตำแหน่ง', 'กรุณาอนุญาตการเข้าถึงตำแหน่ง')
        }
      )
    } else {
      showToast('warning', 'ไม่รองรับ', 'เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')
    }
  }

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    setHasSubmitted(true)
    
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('phone', data.phone)
      formData.append('type', data.type)
      formData.append('village', data.village)
      formData.append('description', data.description)
      
      if (data.location) formData.append('location', data.location)
      if (data.latitude) formData.append('latitude', data.latitude.toString())
      if (data.longitude) formData.append('longitude', data.longitude.toString())
      
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาด')
      }

      setSubmittedTicket(result.ticketNo)
    } catch (error) {
      console.error('Submission error:', error)
      showToast('error', 'เกิดข้อผิดพลาด', error instanceof Error ? error.message : 'ไม่สามารถส่งคำร้องได้')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ส่งคำร้องเรียบร้อย!</h2>
            <p className="text-gray-600 mb-4">เราได้รับคำร้องของท่านแล้ว</p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-600 font-medium">เลขที่คำร้อง</p>
              <p className="text-2xl font-bold text-primary-800">{submittedTicket}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              กรุณาบันทึกเลขที่คำร้องไว้เพื่อใช้ในการติดตามสถานะ
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => router.push('/portal')}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                กลับหน้าแรก
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
               แจ้งปัญหาใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ระบบแจ้งเหตุ อบต</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/portal" className="text-gray-600 hover:text-primary-600">
                หน้าแรก
              </a>
              <a href="/portal/news" className="text-gray-600 hover:text-primary-600">
                ข่าวสาร
              </a>
              <a href="/portal/complaint" className="text-primary-600 font-medium">
                แจ้งปัญหา
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">แจ้งปัญหา / ร้องเรียน</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  maxLength={FIELD_LIMITS.COMPLAINT_NAME}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getFieldBorderClass('name', !!errors.name)}`}
                  placeholder="สมชาย ใจดี"
                />
                {hasSubmitted && errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '')
                    }
                  })}
                  type="tel"
                  maxLength={FIELD_LIMITS.COMPLAINT_PHONE}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getFieldBorderClass('phone', !!errors.phone)}`}
                  placeholder="0812345678"
                />
                {hasSubmitted && errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Problem Type */}
            <div>
              <CustomDropdown
                value={watch('type') || ''}
                onChange={(value) => setValue('type', value as ComplaintFormData['type'])}
                options={complaintTypes}
                label="ประเภทปัญหา"
                required
                error={hasSubmitted ? errors.type?.message : undefined}
              />
            </div>

            {/* Village */}
            <div>
              <CustomDropdown
                value={watch('village') || ''}
                onChange={(value) => setValue('village', value as ComplaintFormData['village'])}
                options={villageOptions}
                label="หมู่บ้าน"
                required
                error={hasSubmitted ? errors.village?.message : undefined}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สถานที่ <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  {...register('location')}
                  type="text"
                  maxLength={FIELD_LIMITS.COMPLAINT_LOCATION}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 ${getFieldBorderClass('location', !!errors.location)}`}
                  placeholder="ระบุรายละเอียดสถานที่ที่เกิดปัญหา"
                />
                <button
                  type="button"
                  onClick={handleLocationClick}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  ปักหมุด
                </button>
              </div>
              {hasSubmitted && errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียดปัญหา <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                maxLength={FIELD_LIMITS.COMPLAINT_DESCRIPTION}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getFieldBorderClass('description', !!errors.description)}`}
                placeholder="กรุณาอธิบายปัญหาอย่างละเอียด..."
              />
              {hasSubmitted && errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รูปภาพ (สูงสุด 5 รูป)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center"
              >
                <Camera className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-gray-600">คลิกเพื่ออัปโหลดรูปภาพ</span>
              </button>
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation Error Message */}
            {hasSubmitted && Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
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
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  'กำลังส่งคำร้อง...'
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    ส่งคำร้อง
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
