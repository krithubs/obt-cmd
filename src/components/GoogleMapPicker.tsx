'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Search, X, Navigation } from 'lucide-react'

declare global {
  interface Window {
    google: any
    initGoogleMap: () => void
  }
}

interface GoogleMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  onClear: () => void
  selectedCoords: { lat: number; lng: number } | null
  defaultLat?: number
  defaultLng?: number
  defaultZoom?: number
}

export default function GoogleMapPicker({
  onLocationSelect,
  onClear,
  selectedCoords,
  defaultLat = 13.7299,
  defaultLng = 100.5213,
  defaultZoom = 14,
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [loadingGps, setLoadingGps] = useState(false)

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return

    const center = selectedCoords
      ? { lat: selectedCoords.lat, lng: selectedCoords.lng }
      : { lat: defaultLat, lng: defaultLng }

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    })

    mapInstanceRef.current = map

    // Add marker if coords exist
    if (selectedCoords) {
      const marker = new window.google.maps.Marker({
        position: { lat: selectedCoords.lat, lng: selectedCoords.lng },
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      })
      markerRef.current = marker

      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        if (pos) {
          const lat = pos.lat()
          const lng = pos.lng()
          onLocationSelect(lat, lng)
        }
      })
    }

    // Click to place marker
    map.addListener('click', (e: any) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      placeMarker(map, lat, lng)
      onLocationSelect(lat, lng)
    })

    // Setup autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'TH' },
        }
      )
      autocompleteRef.current = autocomplete

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          map.setCenter({ lat, lng })
          map.setZoom(16)
          placeMarker(map, lat, lng)
          onLocationSelect(lat, lng, place.formatted_address)
          setSearchText(place.formatted_address || '')
        }
      })
    }

    setMapLoaded(true)
  }, [defaultLat, defaultLng, defaultZoom])

  const placeMarker = (map: any, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng })
    } else {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      })
      markerRef.current = marker

      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        if (pos) {
          onLocationSelect(pos.lat(), pos.lng())
        }
      })
    }
  }

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
      return
    }

    if (window.google?.maps) {
      initMap()
      return
    }

    window.initGoogleMap = () => {
      initMap()
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMap`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      delete (window as any).initGoogleMap
    }
  }, [initMap])

  const useGps = () => {
    if (!navigator.geolocation) return
    setLoadingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude })
          mapInstanceRef.current.setZoom(16)
          placeMarker(mapInstanceRef.current, latitude, longitude)
        }
        onLocationSelect(latitude, longitude)
        setLoadingGps(false)
      },
      () => {
        setLoadingGps(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="ค้นหาสถานที่..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <div ref={mapRef} className="w-full h-72" />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-500 text-sm">กำลังโหลดแผนที่...</div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={useGps}
          disabled={loadingGps}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
        >
          <Navigation className="w-4 h-4 mr-1.5" />
          {loadingGps ? 'กำลังค้นหา...' : 'ใช้ตำแหน่งปัจจุบัน'}
        </button>
        {selectedCoords && (
          <button
            type="button"
            onClick={() => {
              if (markerRef.current) {
                markerRef.current.setMap(null)
                markerRef.current = null
              }
              onClear()
            }}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            ล้างตำแหน่ง
          </button>
        )}
      </div>

      {/* Selected coordinates */}
      {selectedCoords && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-sm text-green-800">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>พิกัดที่เลือก: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}</span>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        💡 คลิกบนแผนที่เพื่อวางหมุด หรือลากหมุดเพื่อย้ายตำแหน่ง หรือค้นหาสถานที่ด้านบน
      </p>
    </div>
  )
}
