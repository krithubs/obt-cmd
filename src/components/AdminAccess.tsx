'use client'

import { useEffect } from 'react'

export default function AdminAccess() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Secret key combination: Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        window.location.href = '/admin/login'
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  return null
}
