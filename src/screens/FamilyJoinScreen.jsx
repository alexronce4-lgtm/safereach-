import { useState, useRef } from 'react'
import { getSession, addFamilyMember } from '../utils/session'

export default function FamilyJoinScreen({ onBack, onJoin, initialCode = '', urlParams = {} }) {
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const hiddenRef = useRef(null)

  const codeDisplay = (code + '      ').slice(0, 6).split('')
  const isReady = code.length === 6 && name.trim().length > 0

  function handleCodeInput(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(val)
    setError(null)
  }

  async function handleJoin() {
    if (!isReady || loading) return
    setLoading(true)
    setError(null)

    await new Promise(r => setTimeout(r, 300))

    // Skip localStorage check if joining via URL link (cross-device)
    const fromUrl = !!initialCode
    if (!fromUrl) {
      const session = getSession(code)
      if (!session) {
        setError('Session not found. Check the code and try again.')
        setLoading(false)
        return
      }
    }

    let loc = null
    try {
      loc = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          reject,
          { timeout: 6000 }
        )
      })
    } catch { /* location optional */ }

    addFamilyMember(code, { name: name.trim(), location: loc })
    setLoading(false)
    onJoin(code, name.trim(), urlParams)
  }

  return (
    <div className="screen-in" style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={s.headerTitle}>Join Emergency Session</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={s.body}>
        <div style={s.iconWrap}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(232,0,13,0.1)" />
            <circle cx="18" cy="20" r="5" stroke="#E8000D" strokeWidth="1.8" />
            <path d="M8 36c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#E8000D" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M33 22l4 4 6-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={s.titleBlock}>
          <h1 style={s.title}>Enter Session Code</h1>
          <p style={s.subtitle}>Someone shared a 6-character code with you</p>
        </div>

        {/* Code display + hidden input */}
        <div style={s.codeSection} onClick={() => hiddenRef.current?.focus()}>
          <div style={s.codeBoxes}>
            {codeDisplay.map((char, i) => (
              <div
                key={i}
                style={{
                  ...s.codeBox,
                  ...(code.length === i ? s.codeBoxActive : {}),
                  ...(char.trim() ? s.codeBoxFilled : {}),
                }}
              >
                {char.trim()}
                {code.length === i && <span style={s.cursor} />}
              </div>
            ))}
          </div>
          <input
            ref={hiddenRef}
            value={code}
            onChange={handleCodeInput}
            onKeyDown={e => e.key === 'Enter' && isReady && handleJoin()}
            maxLength={6}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            style={s.hiddenInput}
            autoFocus
          />
        </div>

        {/* Name input */}
        <div style={s.nameSection}>
          <label style={s.nameLabel}>Your name</label>
          <input
            style={s.nameInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mom, Alex, Jordan"
            onKeyDown={e => e.key === 'Enter' && isReady && handleJoin()}
          />
          <p style={s.nameHint}>This shows on the victim's screen when you join</p>
        </div>

        {error && (
          <div style={s.errorCard}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          style={{ ...s.joinBtn, opacity: isReady ? 1 : 0.4 }}
          onClick={handleJoin}
          disabled={!isReady || loading}
        >
          {loading ? (
            <div style={s.spinner} />
          ) : (
            'Join Session →'
          )}
        </button>

        <p style={s.disclaimer}>
          By joining, you consent to sharing your location with this emergency session.
        </p>
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', minHeight: '100svh', background: '#0A0A0A' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#fff' },
  body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 40px', gap: 24 },
  iconWrap: { marginBottom: 4 },
  titleBlock: { textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#52525B', lineHeight: 1.5 },
  codeSection: { position: 'relative', cursor: 'text', width: '100%' },
  codeBoxes: { display: 'flex', gap: 8, justifyContent: 'center' },
  codeBox: { width: 46, height: 58, background: '#161616', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 24, fontWeight: 800, color: '#fff', position: 'relative', transition: 'border-color 0.15s' },
  codeBoxActive: { borderColor: '#E8000D', boxShadow: '0 0 0 2px rgba(232,0,13,0.2)' },
  codeBoxFilled: { borderColor: 'rgba(232,0,13,0.4)', background: 'rgba(232,0,13,0.06)' },
  cursor: { position: 'absolute', width: 2, height: 28, background: '#E8000D', borderRadius: 1, animation: 'pulse-dot 1s ease-in-out infinite' },
  hiddenInput: { position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', fontSize: 16, pointerEvents: 'none' },
  nameSection: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  nameLabel: { fontSize: 12, fontWeight: 700, color: '#52525B', letterSpacing: '0.5px', textTransform: 'uppercase' },
  nameInput: { width: '100%', background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px', fontSize: 16, color: '#fff', outline: 'none', caretColor: '#E8000D' },
  nameHint: { fontSize: 11, color: '#52525B' },
  errorCard: { display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(232,0,13,0.08)', border: '1px solid rgba(232,0,13,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E8000D', width: '100%' },
  joinBtn: { width: '100%', minHeight: 56, background: '#E8000D', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(232,0,13,0.35)', transition: 'opacity 0.15s', letterSpacing: '0.3px', WebkitTapHighlightColor: 'transparent' },
  spinner: { width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' },
  disclaimer: { fontSize: 11, color: '#3A3A3A', textAlign: 'center', lineHeight: 1.5, maxWidth: 260 },
}
