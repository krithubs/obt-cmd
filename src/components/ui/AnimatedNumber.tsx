'use client'

import React, { useState, useEffect } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export default function AnimatedNumber({ value, duration = 1000, className = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }

    let start = 0
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span className={className}>{display.toLocaleString('en-US')}</span>
}
