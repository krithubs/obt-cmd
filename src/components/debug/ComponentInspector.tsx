'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ComponentInfo {
  name: string
  props: Record<string, any>
  element: HTMLElement
  position: { x: number; y: number }
}

const ComponentInspector: React.FC = () => {
  const [isInspecting, setIsInspecting] = useState(false)
  const [hoveredComponent, setHoveredComponent] = useState<ComponentInfo | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null)

  useEffect(() => {
    if (!isInspecting) return

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const rect = target.getBoundingClientRect()
      
      // Find the nearest React component root
      let element = target
      let componentName = 'Unknown'
      
      // Try to find component name from various sources
      if (element.getAttribute('data-testid')) {
        componentName = element.getAttribute('data-testid')!
      } else if (element.className) {
        componentName = element.className.split(' ')[0] || 'Unknown'
      } else if (element.tagName) {
        componentName = element.tagName.toLowerCase()
      }

      setHoveredComponent({
        name: componentName,
        props: {},
        element,
        position: { x: rect.left, y: rect.top }
      })
    }

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      const target = e.target as HTMLElement
      const rect = target.getBoundingClientRect()
      
      let componentName = 'Unknown'
      if (target.getAttribute('data-testid')) {
        componentName = target.getAttribute('data-testid')!
      } else if (target.className) {
        componentName = target.className.split(' ')[0] || 'Unknown'
      } else if (target.tagName) {
        componentName = target.tagName.toLowerCase()
      }

      const componentInfo: ComponentInfo = {
        name: componentName,
        props: {},
        element: target,
        position: { x: rect.left, y: rect.top }
      }

      setSelectedComponent(componentInfo)
      
      // Log component info to console for Windsurf integration
      console.log('🔍 Component Inspector - Selected Component:', {
        name: componentName,
        element: target,
        className: target.className,
        id: target.id,
        tagName: target.tagName,
        innerHTML: target.innerHTML.substring(0, 200) + '...',
        rect: {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y
        }
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsInspecting(false)
        setHoveredComponent(null)
        setSelectedComponent(null)
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isInspecting])

  const highlightElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    return {
      position: 'fixed' as const,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      border: '2px solid #3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      pointerEvents: 'none' as const,
      zIndex: 9999
    }
  }

  return (
    <>
      {createPortal(
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          background: '#1f2937',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            🔍 Component Inspector
          </div>
          <button
            onClick={() => setIsInspecting(!isInspecting)}
            style={{
              background: isInspecting ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isInspecting ? 'Stop Inspecting' : 'Start Inspecting'}
          </button>
          {isInspecting && (
            <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              Click any component to inspect. Press ESC to stop.
            </div>
          )}
        </div>,
        document.body
      )}

      {hoveredComponent && isInspecting && createPortal(
        <div style={highlightElement(hoveredComponent.element)} />,
        document.body
      )}

      {selectedComponent && createPortal(
        <div style={{
          position: 'fixed',
          top: selectedComponent.position.y + 10,
          left: selectedComponent.position.x + 10,
          background: '#1f2937',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 10001,
          maxWidth: '300px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Component: {selectedComponent.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            <div>Tag: {selectedComponent.element.tagName}</div>
            <div>Class: {selectedComponent.element.className || 'none'}</div>
            <div>ID: {selectedComponent.element.id || 'none'}</div>
          </div>
          <button
            onClick={() => setSelectedComponent(null)}
            style={{
              marginTop: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Close
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

export default ComponentInspector
