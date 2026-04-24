import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Dynamically import to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })

// Import L only on client side
let L: any = null;

// Fix for default markers in Leaflet with webpack - only run on client side
if (typeof window !== 'undefined') {
  L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface DraggableMarkerProps {
  position: [number, number]
  onPositionChange: (lat: number, lng: number) => void
}

function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position)
  const markerRef = useRef<any>(null)

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker != null) {
        const newPos = marker.getLatLng()
        setMarkerPosition([newPos.lat, newPos.lng])
        onPositionChange(newPos.lat, newPos.lng)
      }
    },
  }

  return (
    <Marker
      ref={markerRef}
      position={markerPosition}
      draggable={true}
      eventHandlers={eventHandlers}
    />
  )
}

interface LocationPickerProps {
  latitude?: number
  longitude?: number
  onLocationChange: (lat: number, lng: number) => void
  onAddressChange?: (address: string) => void
}

export default function LocationPicker({ 
  latitude = 19.1592, 
  longitude = 99.2153, 
  onLocationChange,
  onAddressChange 
}: LocationPickerProps) {
  const [mapCenter] = useState<[number, number]>([latitude, longitude])
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([latitude, longitude])
  const [map, setMap] = useState<any>(null)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    // Initialize map when component mounts
    const timer = setTimeout(() => {
      setMapLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleMarkerPositionChange = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng])
    onLocationChange(lat, lng)
    
    // Optional: Reverse geocoding to get address
    if (onAddressChange) {
      fetchAddress(lat, lng)
    }
  }

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=th`
      )
      const data = await response.json()
      if (data.display_name) {
        onAddressChange?.(data.display_name)
      }
    } catch (error) {
      console.error('Error fetching address:', error)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setMarkerPosition([lat, lng])
          onLocationChange(lat, lng)
          if (map) {
            map.setView([lat, lng], 15)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้')
        }
      )
    } else {
      alert('เบราว์เซอร์ไม่รองรับ Geolocation')
    }
  }

  const handleMapClick = (e: any) => {
    const lat = e.latlng.lat
    const lng = e.latlng.lng
    setMarkerPosition([lat, lng])
    onLocationChange(lat, lng)
  }

  if (typeof window === 'undefined') {
    return <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">กำลังโหลดแผนที่...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          เลือกตำแหน่งบนแผนที่
        </label>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
        >
          <span>ตำแหน่งปัจจุบัน</span>
        </button>
      </div>
      
      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
        {mapLoading ? (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">กำลังโหลดแผนที่...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            key={`map-${latitude}-${longitude}`}
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            ref={setMap}
            whenReady={() => {
              // Access map via ref instead
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker 
              position={markerPosition} 
              onPositionChange={handleMarkerPositionChange}
            />
          </MapContainer>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        📍 คลิกหรือลางหมุดเพื่อเปลี่ยนตำแหน่ง | ตำแหน่งปัจจุบัน: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
      </div>
    </div>
  )
}
