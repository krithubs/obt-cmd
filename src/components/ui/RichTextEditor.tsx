'use client'

import React, { useRef, useCallback } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Image as ImageIcon, Undo, Redo, Type, Heading1, Heading2 } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  error?: string
  rows?: number
}

export default function RichTextEditor({ value, onChange, placeholder, error }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const execCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    // Trigger onChange after command
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
    document.execCommand('insertHTML', false, text)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInsertLink = useCallback(() => {
    const url = prompt('ใส่ URL:', 'https://')
    if (url) {
      execCmd('createLink', url)
    }
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
        if (urls.length > 0) {
          execCmd('insertImage', urls[0])
        }
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    input.click()
  }, [execCmd])

  const ToolbarButton = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
      title={title}
    >
      {children}
    </button>
  )

  return (
    <div className={`border rounded-md overflow-hidden ${error ? 'border-red-500' : 'border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        <ToolbarButton onClick={() => execCmd('undo')} title="เลิกทำ">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('redo')} title="ทำซ้ำ">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => execCmd('formatBlock', '<h1>')} title="หัวข้อใหญ่">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('formatBlock', '<h2>')} title="หัวข้อรอง">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('formatBlock', '<p>')} title="ย่อหน้าปกติ">
          <Type className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => execCmd('bold')} title="ตัวหนา (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('italic')} title="ตัวเอียง (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('underline')} title="ขีดเส้นใต้ (Ctrl+U)">
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => execCmd('justifyLeft')} title="ชิดซ้าย">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('justifyCenter')} title="กลาง">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('justifyRight')} title="ชิดขวา">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => execCmd('insertUnorderedList')} title="รายการแบบไม่มีลำดับ">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('insertOrderedList')} title="รายการแบบมีลำดับ">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={handleInsertImage} title="อัปโหลดรูปภาพ">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="px-3 py-2 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none focus:outline-none text-sm text-gray-900 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400"
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}
