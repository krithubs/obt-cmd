'use client'

import React, { useRef, useCallback, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Undo, Redo, Type, Heading1, Heading2 } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  error?: string
  rows?: number
}

export default function RichTextEditor({ value, onChange, placeholder, error }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalEdit = useRef(false)
  const lastValue = useRef(value)

  // Sync DOM only when value changes from outside (not from user typing)
  useEffect(() => {
    if (isInternalEdit.current) {
      isInternalEdit.current = false
      lastValue.current = value
      return
    }
    if (editorRef.current && value !== lastValue.current) {
      editorRef.current.innerHTML = value
      lastValue.current = value
    }
  }, [value])

  // Initial set on mount
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value
      lastValue.current = value
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const notifyChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      isInternalEdit.current = true
      lastValue.current = html
      onChange(html)
    }
  }, [onChange])

  const execCmd = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
    notifyChange()
  }, [notifyChange])

  const handleInput = useCallback(() => {
    notifyChange()
  }, [notifyChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
    document.execCommand('insertHTML', false, text)
    notifyChange()
  }, [notifyChange])

  const handleInsertLink = useCallback(() => {
    const url = prompt('ใส่ URL:', 'https://')
    if (url) execCmd('createLink', url)
  }, [execCmd])

  const handleInsertImage = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
    input.multiple = false
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const formData = new FormData()
      formData.append('files', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) return
        const data = await res.json()
        const urls: string[] = data.urls || []
        if (urls.length > 0) execCmd('insertImage', urls[0])
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    input.click()
  }, [execCmd])

  return (
    <div className={`border rounded-md overflow-hidden ${error ? 'border-red-500' : 'border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        <ToolBtn onClick={() => execCmd('undo')} title="เลิกทำ"><Undo className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('redo')} title="ทำซ้ำ"><Redo className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => execCmd('formatBlock', '<h1>')} title="หัวข้อใหญ่"><Heading1 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('formatBlock', '<h2>')} title="หัวข้อรอง"><Heading2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('formatBlock', '<p>')} title="ย่อหน้าปกติ"><Type className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => execCmd('bold')} title="ตัวหนา (Ctrl+B)"><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('italic')} title="ตัวเอียง (Ctrl+I)"><Italic className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('underline')} title="ขีดเส้นใต้ (Ctrl+U)"><Underline className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => execCmd('justifyLeft')} title="ชิดซ้าย"><AlignLeft className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('justifyCenter')} title="กลาง"><AlignCenter className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('justifyRight')} title="ชิดขวา"><AlignRight className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => execCmd('insertUnorderedList')} title="รายการ"><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => execCmd('insertOrderedList')} title="ลำดับ"><ListOrdered className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={handleInsertImage} title="อัปโหลดรูป"><ImageIcon className="w-4 h-4" /></ToolBtn>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="px-4 py-3 min-h-[200px] max-h-[400px] overflow-y-auto focus:outline-none text-sm text-gray-900 leading-relaxed [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:mt-3 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-1 [&>h2]:mt-2 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2 [&>img]:rounded-lg [&>img]:max-w-full [&>img]:my-2"
        suppressContentEditableWarning
      />
    </div>
  )
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
      title={title}
    >
      {children}
    </button>
  )
}
