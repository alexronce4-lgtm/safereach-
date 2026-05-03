import { useEffect, useRef } from 'react'

let L = null
async function getL() {
  if (L) return L
  const mod = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  L = mod.default
  return L
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

const POI_CONFIG = {
  hospital:    { icon: '🏥', color: '#E8000D', label: 'Hospital' },
  pharmacy:    { icon: '💊', color: '#22C55E', label: 'Pharmacy' },
  clinic:      { icon: '🩺', color: '#3B82F6', label: 'Clinic' },
  urgent_care: { icon: '🚑', color: '#F59E0B', label: 'Urgent Care' },
  doctors:     { icon: '🩺', color: '#3B82F6', label: 'Doctor' },
}

async function fetchNearbyPOIs(lat, lng) {
  const r = 2500 // 2.5km radius
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|pharmacy|clinic|urgent_care|doctors"](around:${r},${lat},${lng});
      way["amenity"~"hospital|pharmacy|clinic|urgent_care|doctors"](around:${r},${lat},${lng});
    );
    out center 30;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  const data = await res.json()
  return data.elements.map(el => ({
    id: el.id,
    lat: el.lat ?? el.center?.lat,
    lng: el.lon ?? el.center?.lon,
    name: el.tags?.name || POI_CONFIG[el.tags?.amenity]?.label || 'Unknown',
    amenity: el.tags?.amenity,
  })).filter(p => p.lat && p.lng)
}

function makeIcon(leaflet, html, size = 36) {
  return leaflet.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function poiIconHtml(cfg) {
  return `<div style="
    width:32px;height:32px;border-radius:50%;
    background:${cfg.color};border:2.5px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.5);
  ">${cfg.icon}</div>`
}

function userIconHtml(color, label) {
  return `<div style="
    width:36px;height:36px;border-radius:50%;
    background:${color};border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:800;color:#fff;
    box-shadow:0 2px 14px rgba(0,0,0,0.6);
    font-family:system-ui,sans-serif;
  ">${label}</div>`
}

export default function LiveMap({ myLocation, victimLocation, showNearby = false, style = {} }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const myMarkerRef = useRef(null)
  const lineRef = useRef(null)
  const poiLayerRef = useRef(null)
  const initializedRef = useRef(false)
  const poiFetchedRef = useRef(false)

  // Init map
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
      leaflet.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map)

      // Zoom controls bottom-right
      leaflet.control.zoom({ position: 'bottomright' }).addTo(map)

      if (victimLocation) {
        leaflet.marker(
          [victimLocation.lat, victimLocation.lng],
          { icon: makeIcon(leaflet, userIconHtml('#E8000D', '🚨')) }
        ).addTo(map).bindPopup('<b>Victim last seen here</b>')
      }

      if (myLocation) {
        myMarkerRef.current = leaflet.marker(
          [myLocation.lat, myLocation.lng],
          { icon: makeIcon(leaflet, userIconHtml('#3B82F6', 'ME')) }
        ).addTo(map)
      }

      if (myLocation && victimLocation) {
        lineRef.current = leaflet.polyline(
          [[victimLocation.lat, victimLocation.lng], [myLocation.lat, myLocation.lng]],
          { color: '#E8000D', weight: 2, dashArray: '6,6', opacity: 0.7 }
        ).addTo(map)
        map.fitBounds(
          leaflet.latLngBounds([victimLocation.lat, victimLocation.lng], [myLocation.lat, myLocation.lng]),
          { padding: [50, 50] }
        )
      }

      poiLayerRef.current = leaflet.layerGroup().addTo(map)
      mapRef.current = { map, leaflet }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove()
        mapRef.current = null
        initializedRef.current = false
        poiFetchedRef.current = false
      }
    }
  }, []) // eslint-disable-line

  // Update my position marker
  useEffect(() => {
    if (!mapRef.current || !myLocation) return
    const { map, leaflet } = mapRef.current

    if (myMarkerRef.current) {
      myMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng])
    } else {
      myMarkerRef.current = leaflet.marker(
        [myLocation.lat, myLocation.lng],
        { icon: makeIcon(leaflet, userIconHtml('#3B82F6', 'ME')) }
      ).addTo(map)
    }

    if (victimLocation && lineRef.current) {
      lineRef.current.setLatLngs([
        [victimLocation.lat, victimLocation.lng],
        [myLocation.lat, myLocation.lng],
      ])
    }
  }, [myLocation]) // eslint-disable-line

  // Fetch & display nearby POIs (only once per mount when showNearby + location ready)
  useEffect(() => {
    if (!showNearby || !myLocation || poiFetchedRef.current) return
    if (!mapRef.current) return
    poiFetchedRef.current = true

    const { leaflet } = mapRef.current

    fetchNearbyPOIs(myLocation.lat, myLocation.lng).then(pois => {
      if (!poiLayerRef.current) return
      poiLayerRef.current.clearLayers()

      pois.forEach(poi => {
        const cfg = POI_CONFIG[poi.amenity] || POI_CONFIG.clinic
        const marker = leaflet.marker(
          [poi.lat, poi.lng],
          { icon: makeIcon(leaflet, poiIconHtml(cfg), 32) }
        )
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:140px">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${cfg.icon} ${poi.name}</div>
            <a href="${mapsUrl}" target="_blank"
              style="display:block;background:#E8000D;color:#fff;text-align:center;
                     padding:6px 10px;border-radius:8px;text-decoration:none;
                     font-weight:700;font-size:12px">
              Navigate →
            </a>
          </div>
        `)
        poiLayerRef.current.addLayer(marker)
      })
    }).catch(() => { /* network unavailable, silently skip */ })
  }, [myLocation, showNearby]) // eslint-disable-line

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#0d0d0d', ...style }}
    />
  )
}
