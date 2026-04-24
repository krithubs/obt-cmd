'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Info } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Dynamically import to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Import L only on client side
let L: any = null;

if (typeof window !== 'undefined') {
  L = require('leaflet');
  // Fix for default markers in Leaflet with webpack
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface ComplaintPoint {
  lat: number
  lng: number
  intensity: number
  status: string
  type: string
  description: string
  location: string
  date: string
}

interface HeatMapProps {
  complaints: Array<{
    latitude?: number
    longitude?: number
    status: string
    type: string
    description?: string
    location?: string
    createdAt?: string
  }>
  height?: string
}

export default function HeatMap({ complaints, height = '400px' }: HeatMapProps) {
  const [heatmapData, setHeatmapData] = useState<ComplaintPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'clustered' | 'markers'>('clustered')

  useEffect(() => {
    // Process complaints data for heatmap
    const points: ComplaintPoint[] = complaints
      .filter(complaint => complaint.latitude && complaint.longitude)
      .filter(complaint => selectedStatus === 'ALL' || complaint.status === selectedStatus)
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
          type: complaint.type,
          description: complaint.description || '',
          location: complaint.location || '',
          date: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('th-TH') : ''
        }
      })

    setHeatmapData(points)
    setLoading(false)
  }, [complaints, selectedStatus])

  if (typeof window === 'undefined' || loading) {
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
          <p className="text-gray-600 font-medium">ไม่มีข้อมูลสำหรับสถานะนี้</p>
          <p className="text-sm text-gray-500">ลองเลือกสถานะอื่นหรือตรวจสอบข้อมูล</p>
        </div>
      </div>
    )
  }

  // Calculate bounds for all points
  const bounds = L.latLngBounds(heatmapData.map(p => [p.lat, p.lng]))

  // Create custom icon based on status and intensity
  const createCustomIcon = (status: string, intensity: number, count?: number) => {
    const color = status === 'PENDING' ? '#ef4444' : 
                 status === 'IN_PROGRESS' ? '#f59e0b' : 
                 '#10b981'
    
    const size = 16 + (intensity * 12) // Size based on intensity
    
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 2px solid white;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          opacity: ${0.6 + (intensity * 0.4)};
          transform: translate(-50%, -50%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${count ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: #1f2937;
              color: white;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 4px;
              border-radius: 10px;
              border: 1px solid white;
            ">${count}</div>
          ` : `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 3px;
              height: 3px;
              background: white;
              border-radius: 1px;
            "></div>
          `}
        </div>
      `,
      className: 'custom-heat-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    })
  }

  // Group nearby points into clusters
  const clusterPoints = (points: ComplaintPoint[], threshold: number = 0.002) => {
    const clusters: Array<{
      lat: number
      lng: number
      points: ComplaintPoint[]
      status: string
      intensity: number
    }> = []
    
    const used = new Set<number>()
    
    points.forEach((point, i) => {
      if (used.has(i)) return
      
      const cluster = {
        lat: point.lat,
        lng: point.lng,
        points: [point],
        status: point.status,
        intensity: point.intensity
      }
      
      used.add(i)
      
      // Find nearby points
      points.forEach((otherPoint, j) => {
        if (i !== j && !used.has(j)) {
          const distance = Math.sqrt(
            Math.pow(point.lat - otherPoint.lat, 2) + 
            Math.pow(point.lng - otherPoint.lng, 2)
          )
          
          if (distance < threshold) {
            cluster.points.push(otherPoint)
            cluster.lat = (cluster.lat * cluster.points.length + otherPoint.lat) / (cluster.points.length + 1)
            cluster.lng = (cluster.lng * cluster.points.length + otherPoint.lng) / (cluster.points.length + 1)
            cluster.intensity = Math.max(cluster.intensity, otherPoint.intensity)
            used.add(j)
          }
        }
      })
      
      clusters.push(cluster)
    })
    
    return clusters
  }

  return (
    <div className="relative">
      {/* Status Filter */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="RESOLVED">ดำเร็จ</option>
            </select>
          </div>
          <div className="bg-gray-100 rounded-lg p-1">
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode('clustered')}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'clustered' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🗂️ Clustering
              </button>
              <button
                onClick={() => setViewMode('markers')}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'markers' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📍 Markers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Point Counter */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">{heatmapData.length} จุด</span>
        </div>
      </div>

      <MapContainer
        key={`heatmap-${viewMode}-${selectedStatus}-${heatmapData.length}`}
        bounds={bounds}
        style={{ height, width: '100%' }}
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render based on view mode */}
        {viewMode === 'clustered' ? (
          /* Clustered Heat Points as Markers */
          clusterPoints(heatmapData).map((cluster: any, index: any) => (
            <Marker
              key={index}
              position={[cluster.lat, cluster.lng]}
              icon={createCustomIcon(cluster.status, cluster.intensity, cluster.points.length > 1 ? cluster.points.length : undefined)}
            >
              <Popup>
                <div className="p-2 text-sm">
                  <div className="font-semibold text-gray-900">
                    {cluster.points.length > 1 ? `${cluster.points.length} คำร้อง` : cluster.points[0].type}
                  </div>
                  {cluster.points.length > 1 ? (
                    <div className="text-gray-600 mt-1">
                      {cluster.points.map((p: any) => `• ${p.type}`).join('<br>')}
                    </div>
                  ) : (
                    <div className="text-gray-600 mt-1">{cluster.points[0].description}</div>
                  )}
                  <div className="text-gray-500 mt-1">
                    <div>📍 {cluster.points.length > 1 ? 'หลายสถานที่' : cluster.points[0].location}</div>
                    <div>📅 {cluster.points[0].date}</div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      cluster.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                      cluster.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {cluster.status === 'PENDING' ? 'รอดำเนินการ' :
                       cluster.status === 'IN_PROGRESS' ? 'กำลังดำเนินการ' :
                       'ดำเร็จ'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        ) : (
          /* Individual Markers */
          heatmapData.map((point, index) => (
            <Marker
              key={index}
              position={[point.lat, point.lng]}
              icon={createCustomIcon(point.status, point.intensity)}
            >
              <Popup>
                <div className="p-2 text-sm">
                  <div className="font-semibold text-gray-900">{point.type}</div>
                  <div className="text-gray-600 mt-1">{point.description}</div>
                  <div className="text-gray-500 mt-1">
                    <div>📍 {point.location}</div>
                    <div>📅 {point.date}</div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      point.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                      point.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {point.status === 'PENDING' ? 'รอดำเนินการ' :
                       point.status === 'IN_PROGRESS' ? 'กำลังดำเนินการ' :
                       'ดำเร็จ'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2 flex items-center space-x-1">
          <Info className="w-3 h-3" />
          <span>ความหนาแน่นคำร้อง</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
            <span>สูง (รอดำเนินการ)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded-sm"></div>
            <span>กลาง (กำลังดำเนินการ)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            <span>ต่ำ (ดำเร็จ)</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t text-gray-500">
          <div>💡 คลิกที่จุดเพื่อดูรายละเอียด</div>
          <div>🔍 {viewMode === 'clustered' ? 'ตัวเลข = จำนวนคำร้องในพื้นที่' : 'แสดงทุกจุดแยกกัน'}</div>
        </div>
      </div>
    </div>
  )
}
