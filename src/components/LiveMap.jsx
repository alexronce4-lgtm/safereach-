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
  hospital:    { emoji: '🏥', color: '#E8000D', letter: 'H' },
  pharmacy:    { emoji: '💊', color: '#22C55E', letter: 'Rx' },
  clinic:      { emoji: '🩺', color: '#3B82F6', letter: 'C' },
  urgent_care: { emoji: '🚑', color: '#F59E0B', letter: 'UC' },
  doctors:     { emoji: '🩺', color: '#3B82F6', letter: 'Dr' },
}

async function fetchNearbyPOIs(lat, lng) {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|pharmacy|clinic|urgent_care|doctors"](around:2500,${lat},${lng});
      way["amenity"~"hospital|pharmacy|clinic|urgent_care|doctors"](around:2500,${lat},${lng});
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
    name: el.tags?.name || POI_CONFIG[el.tags?.amenity]?.letter || '?',
    amenity: el.tags?.amenity || 'clinic',
  })).filter(p => p.lat && p.lng)
}

function makeDiv(html, size) {
  return (leaflet) => leaflet.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function poiMarkerHtml(cfg) {
  // Use letter fallback — emoji can fail silently on some Android phones
  return `<div style="
    width:30px;height:30px;border-radius:50%;
    background:${cfg.color};border:2px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:10px;font-weight:900;color:#fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.6);
    font-family:system-ui,sans-serif;line-height:1;
  ">${cfg.letter}</div>`
}

function userMarkerHtml(color, label) {
  return `<div style="
    width:38px;height:38px;border-radius:50%;
    background:${color};border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:800;color:#fff;
    box-shadow:0 2px 14px rgba(0,0,0,0.7);
    font-family:system-ui,sans-serif;line-height:1;
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
  const myLocationRef = useRef(myLocation)

  useEffect(() => { myLocationRef.current = myLocation }, [myLocation])

  function addPOIs(leaflet, layer, lat, lng) {
    if (poiFetchedRef.current) return
    poiFetchedRef.current = true
    fetchNearbyPOIs(lat, lng).then(pois => {
      if (!layer) return
      layer.clearLayers()
      pois.forEach(poi => {
        const cfg = POI_CONFIG[poi.amenity] || POI_CONFIG.clinic
        const icon = leaflet.divIcon({
          className: '',
          html: poiMarkerHtml(cfg),
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -20],
        })
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`
        leaflet.marker([poi.lat, poi.lng], { icon })
          .bindPopup(`
            <div style="font-family:system-ui;min-width:150px;padding:2px">
              <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#111">
                ${cfg.emoji} ${poi.name}
              </div>
              <a href="${mapsUrl}" target="_blank" style="
                display:block;background:#E8000D;color:#fff;text-align:center;
                padding:7px;border-radius:8px;text-decoration:none;
                font-weight:700;font-size:12px">Navigate →</a>
            </div>
          `)
          .addTo(layer)
      })
    }).catch(() => {})
  }

  // Init map once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    getL().then((leaflet) => {
      if (!containerRef.current) return

      const center = victimLocation || myLocationRef.current || { lat: 34.0522, lng: -118.2437 }
      const map = leaflet.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      })
      leaflet.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map)
      leaflet.control.zoom({ position: 'bottomright' }).addTo(map)

      if (victimLocation) {
        const icon = leaflet.divIcon({ className: '', html: userMarkerHtml('#E8000D', '🚨'), iconSize: [38, 38], iconAnchor: [19, 19] })
        leaflet.marker([victimLocation.lat, victimLocation.lng], { icon })
          .addTo(map).bindPopup('<b>Victim last seen here</b>')
      }

      if (myLocationRef.current) {
        const icon = leaflet.divIcon({ className: '', html: userMarkerHtml('#3B82F6', 'ME'), iconSize: [38, 38], iconAnchor: [19, 19] })
        myMarkerRef.current = leaflet.marker([myLocationRef.current.lat, myLocationRef.current.lng], { icon }).addTo(map)
      }

      if (myLocationRef.current && victimLocation) {
        lineRef.current = leaflet.polyline(
          [[victimLocation.lat, victimLocation.lng], [myLocationRef.current.lat, myLocationRef.current.lng]],
          { color: '#E8000D', weight: 2, dashArray: '6,6', opacity: 0.7 }
        ).addTo(map)
        map.fitBounds(
          leaflet.latLngBounds([victimLocation.lat, victimLocation.lng], [myLocationRef.current.lat, myLocationRef.current.lng]),
          { padding: [50, 50] }
        )
      }

      const layer = leaflet.layerGroup().addTo(map)
      poiLayerRef.current = layer
      mapRef.current = { map, leaflet }

      // If location was already available before map init, fetch POIs now
      if (showNearby && myLocationRef.current) {
        addPOIs(leaflet, layer, myLocationRef.current.lat, myLocationRef.current.lng)
      }
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

  // Update my marker when GPS changes
  useEffect(() => {
    if (!mapRef.current || !myLocation) return
    const { map, leaflet } = mapRef.current

    if (myMarkerRef.current) {
      myMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng])
    } else {
      const icon = leaflet.divIcon({ className: '', html: userMarkerHtml('#3B82F6', 'ME'), iconSize: [38, 38], iconAnchor: [19, 19] })
      myMarkerRef.current = leaflet.marker([myLocation.lat, myLocation.lng], { icon }).addTo(map)
    }

    if (victimLocation && lineRef.current) {
      lineRef.current.setLatLngs([
        [victimLocation.lat, victimLocation.lng],
        [myLocation.lat, myLocation.lng],
      ])
    }

    // Fetch POIs once map is ready and location arrives
    if (showNearby && poiLayerRef.current) {
      addPOIs(leaflet, poiLayerRef.current, myLocation.lat, myLocation.lng)
    }
  }, [myLocation]) // eslint-disable-line

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0d0d0d', ...style }} />
  )
}
