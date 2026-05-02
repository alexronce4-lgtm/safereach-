import { useState, useEffect, useRef } from 'react'
import { haversineDistance } from '../utils/session'
import LiveMap from '../components/LiveMap'

const DEMO_PLACES = [
  { id: 'h', name: 'Nearest Hospital',      icon: '🏥', color: '#E8000D', dlat:  0.0080, dlng:  0.0060 },
  { id: 'n', name: 'Naloxone Access Point', icon: '💊', color: '#22C55E', dlat: -0.0050, dlng:  0.0090 },
  { id: 'p', name: 'Pharmacy',              icon: '🏪', color: '#F59E0B', dlat:  0.0030, dlng: -0.0070 },
]

function buildStaticMapUrl(loc, apiKey) {
  if (!apiKey || !loc) return null
  const { lat, lng } = loc
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '15',
    size: '800x400',
    scale: '2',
    maptype: 'roadmap',
    key: apiKey,
  })
  const styles = [
    'element:geometry|color:0x1a1a1a',
    'element:labels.text.stroke|color:0x000000',
    'element:labels.text.fill|color:0x746855',
    'feature:road|element:geometry|color:0x2d2d2d',
    'feature:road|element:geometry.stroke|color:0x111111',
    'feature:water|element:geometry|color:0x0d0d0d',
    'feature:poi|visibility:off',
  ]
  styles.forEach(st => params.append('style', st))
  params.append('markers', `color:0x3B82F6|size:small|${lat},${lng}`)
  DEMO_PLACES.forEach(p => {
    const c = p.color.replace('#', '0x')
    params.append('markers', `color:${c}|label:${p.id.toUpperCase()}|${(lat + p.dlat).toFixed(6)},${(lng + p.dlng).toFixed(6)}`)
  })
  return `https://maps.googleapis.com/maps/api/staticmap?${params}`
}

function FallbackMap({ location, places }) {
  const W = 360, H = 260, cx = W / 2, cy = H / 2
  const scale = 5500
  const pts = places.map(p => ({
    ...p,
    px: cx + (p.dlng || 0) * scale,
    py: cy - (p.dlat || 0) * scale,
  }))

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <rect width={W} height={H} fill="#0d0d0d" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * (H / 11)} x2={W} y2={i * (H / 11)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <line key={`v${i}`} x1={i * (W / 15)} y1={0} x2={i * (W / 15)} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <line x1={0} y1={cy + 10} x2={W} y2={cy - 5} stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
      <line x1={cx - 20} y1={0} x2={cx + 30} y2={H} stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
      <line x1={0} y1={cy - 70} x2={W} y2={cy - 80} stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      {pts.map(p => (
        <line key={`l${p.id}`} x1={cx} y1={cy} x2={p.px} y2={p.py}
          stroke={p.color} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.35" />
      ))}
      {pts.map(p => (
        <g key={`g${p.id}`}>
          <circle cx={p.px} cy={p.py} r={16} fill={p.color} opacity="0.12" />
          <circle cx={p.px} cy={p.py} r={9} fill={p.color} />
          <text x={p.px} y={p.py + 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">
            {p.id.toUpperCase()}
          </text>
          <text x={p.px} y={p.py - 20} textAnchor="middle" fontSize="9" fill={p.color} fontWeight="600">
            {p.name.split(' ')[0]}
          </text>
          {p.dist != null && (
            <text x={p.px} y={p.py + 26} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)">{p.dist}mi</text>
          )}
        </g>
      ))}
      <circle cx={cx} cy={cy} r={30} fill="rgba(59,130,246,0.07)" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={11} fill="#3B82F6" />
      <circle cx={cx} cy={cy} r={5} fill="#fff" />
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="9" fill="#3B82F6" fontWeight="700" letterSpacing="1">YOU</text>
      {!location && (
        <g>
          <rect width={W} height={H} fill="rgba(0,0,0,0.55)" />
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fill="#52525B" fontWeight="600">Acquiring location...</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#3A3A3A">Allow location access</text>
        </g>
      )}
    </svg>
  )
}

export default function MapScreen({ location, onUpdateLocation, onGoToEmergency }) {
  const [age, setAge] = useState(0)
  const [gpsStatus, setGpsStatus] = useState('getting')
  const lastUpdateRef = useRef(Date.now())

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return }
    const id = navigator.geolocation.watchPosition(
      pos => {
        onUpdateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        lastUpdateRef.current = Date.now()
        setGpsStatus('ok')
      },
      () => setGpsStatus(s => s === 'getting' ? 'denied' : s),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, []) // eslint-disable-line

  useEffect(() => {
    const t = setInterval(() => setAge(Math.floor((Date.now() - lastUpdateRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const places = DEMO_PLACES.map(p => {
    const loc = location ? { lat: location.lat + p.dlat, lng: location.lng + p.dlng } : null
    return { ...p, loc, dist: location && loc ? haversineDistance(location, loc) : null }
  })

  async function shareLocation() {
    if (!location) return
    const text = `My live location: https://maps.google.com/?q=${location.lat},${location.lng}`
    if (navigator.share) {
      try { await navigator.share({ title: 'My live location', text }) } catch { /* cancelled */ }
    } else {
      window.location.href = `sms:?&body=${encodeURIComponent(text)}`
    }
  }

  const isGpsOk = gpsStatus === 'ok'

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={s.headerTitle}>Live Response Map</span>
        <div style={{
          ...s.gpsBadge,
          background: isGpsOk ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${isGpsOk ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          <span style={{
            ...s.gpsDot,
            background: isGpsOk ? '#22C55E' : '#F59E0B',
            animation: isGpsOk ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ ...s.gpsText, color: isGpsOk ? '#22C55E' : '#F59E0B' }}>
            {gpsStatus === 'ok' ? 'GPS Active' : gpsStatus === 'getting' ? 'Locating...' : 'No GPS'}
          </span>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.mapCard}>
          <LiveMap myLocation={location} style={{ height: 260 }} />
        </div>

        <div style={s.coordsRow}>
          <span style={s.coordsIcon}>📍</span>
          {location ? (
            <>
              <span style={s.coords}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
              <span style={s.coordsAge}>{age < 5 ? 'just now' : `${age}s ago`}</span>
            </>
          ) : (
            <span style={s.coordsPlaceholder}>Acquiring location...</span>
          )}
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>NEARBY HELP</div>
          <div style={s.placesList}>
            {places.map(p => (
              <button
                key={p.id}
                style={s.placeRow}
                onClick={() => {
                  const dest = p.loc
                  if (dest) window.open(`https://maps.google.com/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank')
                }}
              >
                <div style={{ ...s.placeIconWrap, background: p.color + '18', border: `1px solid ${p.color}40` }}>
                  <span style={s.placeIcon}>{p.icon}</span>
                </div>
                <div style={s.placeInfo}>
                  <span style={s.placeName}>{p.name}</span>
                  <span style={s.placeDist}>{p.dist != null ? `${p.dist} mi away` : 'Tap to navigate'}</span>
                </div>
                <span style={s.placeArrow}>→</span>
              </button>
            ))}
          </div>
        </div>

        <div style={s.actions}>
          <button
            style={{ ...s.actionBtn, opacity: location ? 1 : 0.4 }}
            onClick={() => location && window.open(`https://maps.google.com/?q=${location.lat},${location.lng}`, '_blank')}
            disabled={!location}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1C4.462 1 2 3.462 2 6.5c0 4.125 5.5 7.5 5.5 7.5S13 10.625 13 6.5C13 3.462 10.538 1 7.5 1z" stroke="#fff" strokeWidth="1.4" />
              <circle cx="7.5" cy="6.5" r="2" stroke="#fff" strokeWidth="1.3" />
            </svg>
            Open in Maps
          </button>
          <button
            style={{ ...s.actionBtn, ...s.actionBtnOutline, opacity: location ? 1 : 0.4 }}
            onClick={shareLocation}
            disabled={!location}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="11.5" cy="2.5" r="1.8" stroke="#E8000D" strokeWidth="1.3" />
              <circle cx="3.5" cy="7.5" r="1.8" stroke="#E8000D" strokeWidth="1.3" />
              <circle cx="11.5" cy="12.5" r="1.8" stroke="#E8000D" strokeWidth="1.3" />
              <path d="M5.2 6.6l4.4-2.6M5.2 8.4l4.4 2.6" stroke="#E8000D" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Share Location
          </button>
          <button style={{ ...s.actionBtn, ...s.actionBtnAlert }} onClick={onGoToEmergency}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5L1 13.5h13L7.5 1.5Z" stroke="#fff" strokeWidth="1.5" fill="rgba(255,255,255,0.1)" strokeLinejoin="round" />
              <line x1="7.5" y1="6.5" x2="7.5" y2="9.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7.5" cy="11.5" r="0.7" fill="#fff" />
            </svg>
            Alert Contacts
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', flex: 1, background: '#0A0A0A', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#fff' },
  gpsBadge: { display: 'flex', alignItems: 'center', gap: 5, borderRadius: 20, padding: '4px 10px' },
  gpsDot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  gpsText: { fontSize: 11, fontWeight: 600 },
  body: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 12px 24px' },
  mapCard: { borderRadius: 16, overflow: 'hidden', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  mapImg: { width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' },
  coordsRow: { display: 'flex', alignItems: 'center', gap: 6, background: '#161616', borderRadius: 10, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.06)' },
  coordsIcon: { fontSize: 13, flexShrink: 0 },
  coords: { flex: 1, fontSize: 12, color: '#A1A1AA', fontFamily: 'ui-monospace, monospace' },
  coordsAge: { fontSize: 11, color: '#52525B', flexShrink: 0 },
  coordsPlaceholder: { flex: 1, fontSize: 12, color: '#52525B' },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: 800, color: '#52525B', letterSpacing: '1.5px', paddingLeft: 2 },
  placesList: { display: 'flex', flexDirection: 'column', gap: 6 },
  placeRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#161616', borderRadius: 13, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', width: '100%', textAlign: 'left' },
  placeIconWrap: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  placeIcon: { fontSize: 18 },
  placeInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  placeName: { fontSize: 14, fontWeight: 600, color: '#E5E5E5' },
  placeDist: { fontSize: 11, color: '#52525B' },
  placeArrow: { fontSize: 15, color: '#52525B', flexShrink: 0 },
  actions: { display: 'flex', gap: 8 },
  actionBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '11px 6px', background: '#1D4ED8', border: 'none', borderRadius: 13, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, color: '#fff', WebkitTapHighlightColor: 'transparent' },
  actionBtnOutline: { background: '#161616', border: '1px solid rgba(232,0,13,0.3)', color: '#E8000D' },
  actionBtnAlert: { background: '#E8000D', border: 'none', color: '#fff' },
}
