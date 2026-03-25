'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  subText?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  subText,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: { outer: 'w-8 h-8', inner: 'inset-1.5', borderOuter: 'border-[3px]', borderInner: 'border-2' },
    md: { outer: 'w-14 h-14', inner: 'inset-2', borderOuter: 'border-4', borderInner: 'border-[3px]' },
    lg: { outer: 'w-20 h-20', inner: 'inset-3', borderOuter: 'border-4', borderInner: 'border-4' },
  }

  const s = sizeMap[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className={`relative ${s.outer} mx-auto ${text ? 'mb-3' : ''}`}>
          <div className={`absolute inset-0 ${s.borderOuter} border-blue-200 rounded-full`}></div>
          <div className={`absolute inset-0 ${s.borderOuter} border-blue-600 border-t-transparent rounded-full animate-spin`}></div>
          <div 
            className={`absolute ${s.inner} ${s.borderInner} border-emerald-400 border-b-transparent rounded-full animate-spin`} 
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
          ></div>
        </div>
        {text && <p className="text-gray-600 font-medium text-thai">{text}</p>}
        {subText && <p className="text-gray-400 text-sm mt-1 text-thai">{subText}</p>}
      </div>
    </div>
  )
}
