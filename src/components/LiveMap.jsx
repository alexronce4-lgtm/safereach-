import { useEffect, useRef } from 'react'

// Leaflet is loaded lazily to avoid SSR issues
let L = null
async function getL() {
  if (L) return L
  const mod = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  L = mod.default
  return L
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a>'

function makeIcon(leaflet, color, label) {
  return leaflet.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:800;color:#fff;
      box-shadow:0 2px 12px rgba(0,0,0,0.5);
      font-family:system-ui,sans-serif;
    ">${label}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

export default function LiveMap({ myLocation, victimLocation, style = {} }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const myMarkerRef = useRef(null)
  const victimMarkerRef = useRef(null)
  const lineRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    getL().then((leaflet) => {
      if (!containerRef.current) return

      const center = victimLocation || myLocation || { lat: 34.0522, lng: -118.2437 }
      const map = leaflet.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      })
      leaflet.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)

      if (victimLocation) {
        victimMarkerRef.current = leaflet.marker(
          [victimLocation.lat, victimLocation.lng],
          { icon: makeIcon(leaflet, '#E8000D', '🚨') }
        ).addTo(map).bindPopup('Victim last seen here')
      }

      if (myLocation) {
        myMarkerRef.current = leaflet.marker(
          [myLocation.lat, myLocation.lng],
          { icon: makeIcon(leaflet, '#3B82F6', 'ME') }
        ).addTo(map)
      }

      if (myLocation && victimLocation) {
        lineRef.current = leaflet.polyline(
          [[victimLocation.lat, victimLocation.lng], [myLocation.lat, myLocation.lng]],
          { color: '#E8000D', weight: 2, dashArray: '6,6', opacity: 0.7 }
        ).addTo(map)
        map.fitBounds(leaflet.latLngBounds(
          [victimLocation.lat, victimLocation.lng],
          [myLocation.lat, myLocation.lng]
        ), { padding: [40, 40] })
      }

      mapRef.current = { map, leaflet }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove()
        mapRef.current = null
        initializedRef.current = false
      }
    }
  }, []) // eslint-disable-line

  // Update my marker when position changes
  useEffect(() => {
    if (!mapRef.current || !myLocation) return
    const { map, leaflet } = mapRef.current

    if (myMarkerRef.current) {
      myMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng])
    } else {
      myMarkerRef.current = leaflet.marker(
        [myLocation.lat, myLocation.lng],
        { icon: makeIcon(leaflet, '#3B82F6', 'ME') }
      ).addTo(map)
    }

    if (victimLocation) {
      if (lineRef.current) {
        lineRef.current.setLatLngs([
          [victimLocation.lat, victimLocation.lng],
          [myLocation.lat, myLocation.lng],
        ])
      } else {
        lineRef.current = leaflet.polyline(
          [[victimLocation.lat, victimLocation.lng], [myLocation.lat, myLocation.lng]],
          { color: '#E8000D', weight: 2, dashArray: '6,6', opacity: 0.7 }
        ).addTo(map)
      }
    }
  }, [myLocation]) // eslint-disable-line

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#0d0d0d', ...style }}
    />
  )
}
