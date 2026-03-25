'use client'

import React from 'react'

interface ButtonSpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export default function ButtonSpinner({ size = 'sm', className = '' }: ButtonSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4 border-2' : 'w-5 h-5 border-2'
  
  return (
    <div 
      className={`${sizeClass} border-white border-t-transparent rounded-full animate-spin inline-block ${className}`}
    ></div>
  )
}
