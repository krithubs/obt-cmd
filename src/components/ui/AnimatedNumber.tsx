'use client'

import React, { useState, useEffect, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export default function AnimatedNumber({ value, duration = 300, className = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    // Skip animation for small values or first render
    if (value === 0 || prevValue.current === 0) {
      setDisplay(value)
      prevValue.current = value
      return
    }

    const start = prevValue.current
    const diff = value - start
    if (diff === 0) return

    const startTime = performance.now()
    const timer = requestAnimationFrame(function animate(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(start + diff * progress))
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = value
      }
    })

    return () => cancelAnimationFrame(timer)
  }, [value, duration])

  return <span className={className}>{display.toLocaleString('en-US')}</span>
}
