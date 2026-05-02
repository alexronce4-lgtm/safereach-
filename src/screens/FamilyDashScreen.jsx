import { useState, useEffect, useRef } from 'react'
import {
  getSession, updateFamilyLocation, addVoiceMessage,
  addFamilyMessage, calculateETA,
} from '../utils/session'
import LiveMap from '../components/LiveMap'

export default function FamilyDashScreen({ sessionCode, memberName, onBack, urlParams = {} }) {
  const victimLocFromUrl = urlParams.lat ? { lat: parseFloat(urlParams.lat), lng: parseFloat(urlParams.lng) } : null
  const victimNameFromUrl = urlParams.name || 'Someone'
  const [session, setSession] = useState(victimLocFromUrl ? {
    victimName: victimNameFromUrl,
    victimLocation: victimLocFromUrl,
    familyMembers: [], chatHistory: [], voiceMessages: [],
  } : null)
  const [familyLoc, setFamilyLoc] = useState(null)
  const [eta, setEta] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recorderChunks, setRecorderChunks] = useState([])
  const [sending, setSending] = useState(false)
  const [sentVoice, setSentVoice] = useState(false)
  const [sentMsg, setSentMsg] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const familyLocRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chatEndRef = useRef(null)

  // Track own location live with watchPosition
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      p => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude }
        setFamilyLoc(loc)
        familyLocRef.current = loc
        updateFamilyLocation(sessionCode, memberName, loc)
      },
      () => { /* location optional */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [sessionCode, memberName])

  // Poll session every 5 seconds
  useEffect(() => {
    const tick = () => {
      const s = getSession(sessionCode)
      if (!s) { if (!victimLocFromUrl) setNotFound(true); return }
      setSession(s)

      // Update our location in session
      if (familyLocRef.current) {
        updateFamilyLocation(sessionCode, memberName, familyLocRef.current)
      }

      // Calculate ETA if we have both locations
      if (s.victimLocation && familyLocRef.current) {
        setEta(calculateETA(s.victimLocation, familyLocRef.current))
      }
    }

    tick()
    const interval = setInterval(tick, 5000)
    return () => clearInterval(interval)
  }, [sessionCode, memberName])

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.chatHistory?.length])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          setSending(true)
          addVoiceMessage(sessionCode, reader.result, memberName)
          setSending(false)
          setSentVoice(true)
          setTimeout(() => setSentVoice(false), 3000)
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      alert('Microphone access required to send voice messages.')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(false)
  }

  function sendOnMyWay() {
    addFamilyMessage(sessionCode, memberName, "I'm on my way! Stay with me.")
    setSentMsg(true)
    setTimeout(() => setSentMsg(false), 3000)
  }

  if (notFound) {
    return (
      <div style={{ ...s.screen, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Session expired or not found</p>
        <p style={{ color: '#52525B', fontSize: 14, textAlign: 'center' }}>The session code may have expired (sessions last 4 hours).</p>
        <button style={s.backBtnLg} onClick={onBack}>Go Back</button>
      </div>
    )
  }

  const victimLoc = session?.victimLocation
  const chatMsgs = session?.chatHistory || []

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={s.headerCenter}>
          <div style={s.headerTitle}>Family Dashboard</div>
          <div style={s.headerCode}>
            Session <span style={{ color: '#E8000D', fontFamily: 'monospace' }}>{sessionCode}</span>
          </div>
        </div>
        <div style={s.liveTag}>
          <span style={s.liveDot} />
          LIVE
        </div>
      </div>

      <div style={s.body}>
        {/* Map */}
        <div style={s.mapCard}>
          <div style={s.mapCardHeader}>
            <span style={s.mapCardTitle}>
              {session?.victimName ? `${session.victimName}'s Location` : 'Victim Location'}
            </span>
            {eta && (
              <div style={s.etaBadge}>
                <span style={s.etaDist}>{eta.distance} mi</span>
                <span style={s.etaTime}>~{eta.eta} min</span>
              </div>
            )}
          </div>

          <div style={s.mapWrap}>
            {victimLoc ? (
              <LiveMap
                myLocation={familyLoc}
                victimLocation={victimLoc}
                style={{ height: 220 }}
              />
            ) : (
              <div style={s.mapWaiting}>
                <div style={s.spinner} />
                <span style={{ color: '#52525B', fontSize: 13 }}>Waiting for victim's location...</span>
              </div>
            )}
            <div style={s.mapOverlay}>
              <span style={s.mapLegendItem}>
                <span style={{ ...s.mapLegendDot, background: '#E8000D' }} /> Victim
              </span>
              {familyLoc && (
                <span style={s.mapLegendItem}>
                  <span style={{ ...s.mapLegendDot, background: '#3B82F6' }} /> You
                </span>
              )}
            </div>
          </div>

          {eta && (
            <div style={s.etaRow}>
              <div style={s.etaCard}>
                <span style={s.etaLabel}>Distance</span>
                <span style={s.etaValue}>{eta.distance} miles</span>
              </div>
              <div style={s.etaCard}>
                <span style={s.etaLabel}>ETA</span>
                <span style={s.etaValue}>~{eta.eta} min</span>
              </div>
              <div style={s.etaCard}>
                <span style={s.etaLabel}>You</span>
                <span style={s.etaValue}>{familyLoc ? '📍 Located' : '⚠️ No GPS'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={s.actionsRow}>
          <button style={{ ...s.actionBtn, background: sentMsg ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)', borderColor: sentMsg ? '#22C55E' : 'rgba(34,197,94,0.25)' }} onClick={sendOnMyWay}>
            <span style={{ fontSize: 16 }}>{sentMsg ? '✓' : '🚗'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: sentMsg ? '#22C55E' : '#22C55E' }}>
              {sentMsg ? 'Sent!' : "I'm on my way"}
            </span>
          </button>

          <button
            style={{ ...s.actionBtn, background: recording ? 'rgba(232,0,13,0.15)' : 'rgba(59,130,246,0.1)', borderColor: recording ? '#E8000D' : 'rgba(59,130,246,0.25)' }}
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
          >
            <span style={{ fontSize: 16 }}>{sentVoice ? '✓' : '🎤'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: recording ? '#E8000D' : '#3B82F6' }}>
              {recording ? 'Recording...' : sentVoice ? 'Voice sent!' : 'Hold to speak'}
            </span>
          </button>

          <a href="tel:911" style={{ ...s.actionBtn, textDecoration: 'none', background: 'rgba(232,0,13,0.1)', borderColor: 'rgba(232,0,13,0.25)' }}>
            <span style={{ fontSize: 16 }}>📞</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#E8000D' }}>Call 911</span>
          </a>
        </div>

        {/* Live chat transcript */}
        <div style={s.chatCard}>
          <div style={s.chatHeader}>
            <span style={s.chatTitle}>Live Chat Transcript</span>
            <div style={s.chatLive}>
              <span style={s.liveDot} /> Live
            </div>
          </div>

          <div style={s.chatScroll}>
            {chatMsgs.length === 0 ? (
              <p style={s.chatEmpty}>Chat will appear here as Reach talks with the victim</p>
            ) : (
              chatMsgs.map((msg, i) => (
                <div key={msg.id || i} style={{ ...s.chatRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ ...s.chatBubble, ...(msg.role === 'user' ? s.chatUser : s.chatAI) }}>
                    <div style={s.chatBubbleFrom}>{msg.role === 'user' ? session?.victimName || 'Victim' : 'Reach AI'}</div>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', height: '100svh', background: '#0A0A0A', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', paddingTop: 'max(12px, env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#111', flexShrink: 0 },
  backBtn: { width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 },
  headerCode: { fontSize: 11, color: '#52525B', marginTop: 1 },
  liveTag: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(232,0,13,0.12)', border: '1px solid rgba(232,0,13,0.25)', borderRadius: 20, padding: '4px 10px', flexShrink: 0 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#E8000D', animation: 'pulse-dot 1s ease-in-out infinite', display: 'inline-block' },
  body: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12, WebkitOverflowScrolling: 'touch' },
  mapCard: { background: '#161616', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' },
  mapCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 10px' },
  mapCardTitle: { fontSize: 13, fontWeight: 700, color: '#A1A1AA' },
  etaBadge: { display: 'flex', gap: 8, alignItems: 'center' },
  etaDist: { fontSize: 12, fontWeight: 700, color: '#E8000D' },
  etaTime: { fontSize: 12, fontWeight: 600, color: '#A1A1AA' },
  mapWrap: { position: 'relative' },
  mapImg: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  mapOverlay: { position: 'absolute', bottom: 8, left: 10, display: 'flex', gap: 10 },
  mapLegendItem: { display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#fff', fontWeight: 600 },
  mapLegendDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  mapFallback: { padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  mapCoords: { fontSize: 13, color: '#A1A1AA', fontFamily: 'monospace' },
  mapsLink: { fontSize: 13, color: '#3B82F6', fontWeight: 600, textDecoration: 'none' },
  mapWaiting: { height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spinner: { width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#E8000D', animation: 'spin 0.8s linear infinite' },
  etaRow: { display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.07)' },
  etaCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.06)' },
  etaLabel: { fontSize: 10, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  etaValue: { fontSize: 14, fontWeight: 700, color: '#fff' },
  actionsRow: { display: 'flex', gap: 8 },
  actionBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '12px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none', textDecoration: 'none' },
  chatCard: { background: '#161616', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', minHeight: 200, flex: 1 },
  chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  chatTitle: { fontSize: 13, fontWeight: 700, color: '#A1A1AA' },
  chatLive: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#E8000D', fontWeight: 600 },
  chatScroll: { flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, WebkitOverflowScrolling: 'touch' },
  chatEmpty: { fontSize: 13, color: '#3A3A3A', textAlign: 'center', padding: '20px 0' },
  chatRow: { display: 'flex' },
  chatBubble: { maxWidth: '82%', padding: '8px 12px', borderRadius: 14, fontSize: 13, lineHeight: 1.45 },
  chatUser: { background: 'rgba(232,0,13,0.15)', color: '#E5E5E5', borderBottomRightRadius: 4 },
  chatAI: { background: '#222', color: '#E5E5E5', borderBottomLeftRadius: 4 },
  chatBubbleFrom: { fontSize: 10, fontWeight: 700, color: '#52525B', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' },
  backBtnLg: { padding: '14px 28px', background: '#E8000D', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' },
}
