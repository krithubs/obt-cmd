'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
  error?: string
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'เลือก...',
  disabled = false,
  className = '',
  label,
  required = false,
  error
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 text-thai">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-xl 
          focus:outline-none focus:ring-2 transition-all text-thai text-xs
          flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}
          ${className}
        `}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600 text-thai">{error}</p>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-3 py-2 text-thai transition-colors text-xs
                  hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                  ${option.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
