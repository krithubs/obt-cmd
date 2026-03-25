'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'

interface CustomDatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
  error?: string
  format?: 'dd/mm/yyyy' | 'yyyy-mm-dd'
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  className = '',
  label,
  required = false,
  error,
  format = 'dd/mm/yyyy'
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    if (format === 'dd/mm/yyyy') {
      return `${day}/${month}/${year}`
    } else {
      return `${year}-${month}-${day}`
    }
  }

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null
    
    try {
      if (format === 'dd/mm/yyyy') {
        const [day, month, year] = dateString.split('/').map(Number)
        return new Date(year, month - 1, day)
      } else {
        return new Date(dateString)
      }
    } catch {
      return null
    }
  }

  const selectedDate = parseDate(value)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onChange(formatDate(newDate))
    setIsOpen(false)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleToday = () => {
    const today = new Date()
    onChange(formatDate(today))
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    )
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const calendarDays = generateCalendarDays()

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 text-thai">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-10 bg-white border rounded-lg 
            focus:outline-none focus:ring-2 transition-all text-thai text-xs
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'cursor-pointer'}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}
            ${className}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
        
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <Calendar size={16} />
        </button>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 text-thai">{error}</p>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 text-thai">
              {thaiMonthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
              <div
                key={index}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                className={`
                  py-2 text-sm rounded-lg transition-colors
                  ${!day ? 'invisible' : 'hover:bg-blue-50'}
                  ${isSelected(day || 0) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${isToday(day || 0) && !isSelected(day || 0) ? 'bg-blue-100 text-blue-600 font-medium' : ''}
                  ${!isSelected(day || 0) && !isToday(day || 0) ? 'text-gray-700' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-thai"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-thai"
            >
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
