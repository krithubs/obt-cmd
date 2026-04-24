import { NextRequest, NextResponse } from 'next/server'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dsir7quqv'
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'obt-uploads'
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file
const MAX_FILES = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `อัปโหลดได้สูงสุด ${MAX_FILES} ไฟล์` },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ (jpeg, png, gif, webp)` },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} มีขนาดเกิน 5MB` },
          { status: 400 }
        )
      }

      // Upload to Cloudinary via unsigned upload
      const cloudForm = new FormData()
      cloudForm.append('file', file)
      cloudForm.append('upload_preset', UPLOAD_PRESET)

      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: cloudForm,
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('Cloudinary upload error:', err)
        return NextResponse.json(
          { error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' },
          { status: 500 }
        )
      }

      const data = await res.json()
      uploadedUrls.push(data.secure_url as string)
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 201 })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' },
      { status: 500 }
    )
  }
}
