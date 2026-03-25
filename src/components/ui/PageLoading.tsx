'use client'

import React from 'react'
import LoadingSpinner from './LoadingSpinner'

interface PageLoadingProps {
  text?: string
  subText?: string
  bgClass?: string
}

export default function PageLoading({ 
  text = 'กำลังโหลดข้อมูล...', 
  subText,
  bgClass = 'bg-gray-100'
}: PageLoadingProps) {
  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
      <LoadingSpinner size="lg" text={text} subText={subText} />
    </div>
  )
}
