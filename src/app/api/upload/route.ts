import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
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

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    const uploadedUrls: string[] = []

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ (jpeg, png, gif, webp)` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} มีขนาดเกิน 5MB` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const ext = path.extname(file.name) || '.jpg'
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const filePath = path.join(UPLOAD_DIR, safeName)

      // Write file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      uploadedUrls.push(`/uploads/${safeName}`)
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
