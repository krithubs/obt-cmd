import { NextRequest, NextResponse } from 'next/server'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dsir7quqv'
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'obt-uploads'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 8
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function endpointFor(_type: string) {
  // Use /image/upload for both PDF and images. Cloudinary handles PDF natively
  // here — keeping the original .pdf and serving it with application/pdf so
  // browsers display it inline instead of forcing a download.
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const docKey = (formData.get('docKey') as string | null) || ''

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `อัปโหลดได้สูงสุด ${MAX_FILES} ไฟล์` },
        { status: 400 }
      )
    }

    const uploaded: Array<{
      key: string
      name: string
      url: string
      type: string
      size: number
      uploadedAt: string
    }> = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} ไม่รองรับ (รองรับ PDF, JPG, PNG)` },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} เกิน 10MB` },
          { status: 400 }
        )
      }

      const cloudForm = new FormData()
      cloudForm.append('file', file)
      cloudForm.append('upload_preset', UPLOAD_PRESET)

      const res = await fetch(endpointFor(file.type), {
        method: 'POST',
        body: cloudForm,
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('Cloudinary upload error:', err)
        return NextResponse.json(
          { error: `อัปโหลดไม่สำเร็จ: ${err.slice(0, 200)}` },
          { status: 500 }
        )
      }

      const data = await res.json()
      if (!data.secure_url) {
        console.error('Cloudinary returned no secure_url:', data)
        return NextResponse.json(
          { error: 'อัปโหลดไม่สำเร็จ: Cloudinary ไม่ได้คืน URL' },
          { status: 500 }
        )
      }
      uploaded.push({
        key: docKey,
        name: file.name,
        url: data.secure_url as string,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({ files: uploaded }, { status: 201 })
  } catch (error) {
    console.error('Error uploading permit files:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' },
      { status: 500 }
    )
  }
}
