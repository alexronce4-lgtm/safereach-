import { useState } from 'react'
import { getSession, addFamilyMember } from '../utils/session'

export default function FamilyJoinScreen({ onBack, onJoin, initialCode = '', urlParams = {} }) {
  const fromLink = !!initialCode
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState(() => fromLink ? (localStorage.getItem('sr_userName') || 'Helper') : '')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const isReady = code.length === 6 && name.trim().length > 0

  async function handleJoin() {
    if (!isReady || loading) return
    setLoading(true)
    setError(null)

    if (!fromLink) {
      const session = getSession(code)
      if (!session) {
        setError('Session not found. Check the code and try again.')
        setLoading(false)
        return
      }
    }

    let loc = null
    try {
      loc = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          reject,
          { timeout: 6000 }
        )
      )
    } catch { /* location optional */ }

    addFamilyMember(code, { name: name.trim(), location: loc })
    setLoading(false)
    onJoin(code, name.trim(), urlParams)
  }

  return (
    <div className="screen-in" style={s.screen}>
      {!fromLink && (
        <div style={s.header}>
          <button style={s.backBtn} onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={s.headerTitle}>Join Emergency Session</span>
          <div style={{ width: 40 }} />
        </div>
      )}

      <div style={s.body}>
        {/* Alert icon */}
        <div style={s.alertBadge}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L2.5 23.5h23L14 3Z" fill="rgba(232,0,13,0.15)" stroke="#E8000D" strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="14" y1="11" x2="14" y2="17" stroke="#E8000D" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="20.5" r="1" fill="#E8000D" />
          </svg>
          <span style={s.alertBadgeText}>EMERGENCY SESSION</span>
        </div>

        {fromLink ? (
          <>
            <div style={s.titleBlock}>
              <h1 style={s.title}>Someone needs help</h1>
              <p style={s.subtitle}>
                {urlParams.name ? <><strong style={{ color: '#fff' }}>{urlParams.name}</strong> may be in danger.</> : 'An emergency session is active near you.'}
                {' '}Enter your name to join and see their live location.
              </p>
            </div>

            {urlParams.lat && (
              <div style={s.locationPreview}>
                <span style={s.locationDot} />
                <span style={s.locationText}>Live location available — visible after you join</span>
              </div>
            )}
          </>
        ) : (
          <div style={s.titleBlock}>
            <h1 style={s.title}>Enter Session Code</h1>
            <p style={s.subtitle}>Enter the 6-character code shared with you</p>
          </div>
        )}

        {/* Code entry — only when NOT from link */}
        {!fromLink && (
          <div style={s.codeRow}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && isReady && handleJoin()}
              maxLength={6}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="ABC123"
              autoFocus
              style={s.codeInput}
            />
          </div>
        )}

        {/* Name — editable but pre-filled when from link */}
        <div style={s.nameSection}>
          {fromLink && <label style={s.nameLabel}>Your name (optional)</label>}
          {!fromLink && <label style={s.nameLabel}>Your name</label>}
          <input
            style={s.nameInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mom, Alex, Jordan"
            onKeyDown={e => e.key === 'Enter' && isReady && handleJoin()}
            autoFocus={fromLink}
          />
          {fromLink && <p style={s.nameHint}>Change it or just tap Join →</p>}
          {!fromLink && <p style={s.nameHint}>Shown on the victim's screen when you join</p>}
        </div>

        {error && <div style={s.errorCard}><span>⚠️</span> {error}</div>}

        <button
          style={{ ...s.joinBtn, opacity: isReady ? 1 : 0.4 }}
          onClick={handleJoin}
          disabled={!isReady || loading}
        >
          {loading ? <div style={s.spinner} /> : fromLink ? 'Join & See Live Location →' : 'Join Session →'}
        </button>

        <p style={s.disclaimer}>By joining, you consent to sharing your location with this session.</p>
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', minHeight: '100svh', background: '#0A0A0A' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#fff' },
  body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 40px', gap: 24 },
  alertBadge: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.25)', borderRadius: 50, padding: '8px 18px' },
  alertBadgeText: { fontSize: 12, fontWeight: 800, color: '#E8000D', letterSpacing: '1.5px' },
  titleBlock: { textAlign: 'center', width: '100%' },
  title: { fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#71717A', lineHeight: 1.6 },
  locationPreview: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '10px 16px', width: '100%' },
  locationDot: { width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0, animation: 'pulse-dot 1.5s ease-in-out infinite', display: 'inline-block' },
  locationText: { fontSize: 13, color: '#22C55E', fontWeight: 600 },
  codeRow: { width: '100%' },
  codeInput: { width: '100%', background: '#161616', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px', fontSize: 28, fontWeight: 800, color: '#fff', outline: 'none', caretColor: '#E8000D', textAlign: 'center', letterSpacing: '8px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' },
  nameSection: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  nameLabel: { fontSize: 12, fontWeight: 700, color: '#52525B', letterSpacing: '0.5px', textTransform: 'uppercase' },
  nameInput: { width: '100%', background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px', fontSize: 16, color: '#fff', outline: 'none', caretColor: '#E8000D', boxSizing: 'border-box' },
  nameHint: { fontSize: 11, color: '#52525B' },
  errorCard: { display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(232,0,13,0.08)', border: '1px solid rgba(232,0,13,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E8000D', width: '100%' },
  joinBtn: { width: '100%', minHeight: 58, background: '#E8000D', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(232,0,13,0.35)', transition: 'opacity 0.15s', letterSpacing: '0.3px', WebkitTapHighlightColor: 'transparent' },
  spinner: { width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' },
  disclaimer: { fontSize: 11, color: '#3A3A3A', textAlign: 'center', lineHeight: 1.5, maxWidth: 280 },
}
