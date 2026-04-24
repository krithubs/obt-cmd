'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Simple heatmap using circles instead of complex library
interface ComplaintPoint {
  lat: number
  lng: number
  intensity: number
  status: string
  type: string
}

interface HeatMapProps {
  complaints: Array<{
    latitude?: number
    longitude?: number
    status: string
    type: string
  }>
  height?: string
}

export default function HeatMap({ complaints, height = '400px' }: HeatMapProps) {
  const [heatmapData, setHeatmapData] = useState<ComplaintPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Process complaints data for heatmap
    const points: ComplaintPoint[] = complaints
      .filter(complaint => complaint.latitude && complaint.longitude)
      .map(complaint => {
        // Calculate intensity based on status
        let intensity = 0.5 // base intensity
        
        if (complaint.status === 'PENDING') {
          intensity = 0.9
        } else if (complaint.status === 'IN_PROGRESS') {
          intensity = 0.7
        } else if (complaint.status === 'RESOLVED') {
          intensity = 0.3
        }

        return {
          lat: complaint.latitude!,
          lng: complaint.longitude!,
          intensity,
          status: complaint.status,
          type: complaint.type
        }
      })

    setHeatmapData(points)
    setLoading(false)
  }, [complaints])

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">กำลังโหลด Heat Map...</p>
        </div>
      </div>
    )
  }

  // Show message if no data
  if (heatmapData.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">ยังไม่มีข้อมูลพิกัด</p>
          <p className="text-sm text-gray-500">คำร้องที่มีพิกัดจะแสดงบน Heat Map</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Simple Static Map with Heat Points */}
      <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="absolute inset-0 opacity-20">
            {/* Grid pattern to simulate map */}
            <div className="grid grid-cols-8 grid-rows-8 h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Heat Points */}
        {heatmapData.map((point, index) => {
          // Convert lat/lng to x/y for visualization
          const x = ((point.lng - 99.2) / 0.05) * 100 // Normalize to 0-100%
          const y = ((19.17 - point.lat) / 0.02) * 100 // Normalize to 0-100%
          
          const size = 20 + (point.intensity * 30) // Size based on intensity
          const color = point.status === 'PENDING' ? 'rgba(239, 68, 68, ' : 
                       point.status === 'IN_PROGRESS' ? 'rgba(245, 158, 11, ' : 
                       'rgba(16, 185, 129, '
          
          return (
            <div
              key={index}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${Math.max(0, Math.min(100, x))}%`,
                top: `${Math.max(0, Math.min(100, y))}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color + (0.6 * point.intensity) + ')',
                border: `2px solid ${color + '0.8'}`,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 ${size}px ${color + '0.3'}`
              }}
              title={`${point.type} - ${point.status}`}
            />
          )
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
          <div className="font-semibold mb-2">ความหนาแน่นคำร้อง</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>สูง (รอดำเนินการ)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
              <span>กลาง (กำลังดำเนินการ)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>ต่ำ (ดำเร็จ)</span>
            </div>
          </div>
        </div>

        {/* Point Counter */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{heatmapData.length} จุด</span>
          </div>
        </div>
      </div>
    </div>
  )
}
