import { useState, useEffect } from 'react'

export default function HomeScreen({ onSOS, onJoinSession, userName, onSaveUserName }) {
  const [time, setTime] = useState(new Date())
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userName)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function saveName() {
    onSaveUserName(nameInput.trim())
    setEditingName(false)
  }

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="screen-in" style={s.screen}>
      {/* Status bar */}
      <div style={s.statusBar}>
        <span style={s.statusTime}>{timeStr}</span>
        <div style={s.logoMark}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#E8000D" />
            <path d="M9 4v10M4 9h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={s.logoLabel}>SafeReach</span>
        </div>
        <span style={s.statusDate}>{dateStr.split(',')[0]}</span>
      </div>

      {/* Main content */}
      <div style={s.main}>
        <div style={s.greeting}>
          {userName ? (
            <p style={s.greetText}>Ready, <strong style={{ color: '#fff' }}>{userName}</strong></p>
          ) : (
            <p style={s.greetText}>Stay Ready. Always.</p>
          )}
        </div>

        {/* SOS button */}
        <div style={s.sosContainer}>
          <div style={s.ring3} />
          <div style={s.ring2} />
          <div style={s.ring1} />
          <button style={s.sosBtn} onClick={onSOS} aria-label="Activate SOS emergency response">
            <span style={s.sosText}>SOS</span>
            <span style={s.sosSub}>EMERGENCY</span>
          </button>
        </div>

        <p style={s.sosHint}>Tap to activate • AI companion connects instantly</p>

        {/* Join session */}
        <button style={s.joinBtn} onClick={onJoinSession}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="5" r="2.5" stroke="#A1A1AA" strokeWidth="1.4" />
            <path d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M12 7l2 2 2-2" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="14" y1="9" x2="14" y2="4" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span style={s.joinBtnText}>Join a family emergency session</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Name card */}
      {!userName && (
        <div style={s.namePrompt}>
          <div style={s.namePromptIcon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="2.5" stroke="#E8000D" strokeWidth="1.4" />
              <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#E8000D" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          {editingName ? (
            <div style={s.nameInputRow}>
              <input style={s.nameInput} value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()} placeholder="Your name" autoFocus />
              <button style={s.nameSaveBtn} onClick={saveName}>Save</button>
            </div>
          ) : (
            <button style={s.namePromptBtn} onClick={() => { setNameInput(''); setEditingName(true) }}>
              <span style={{ color: '#A1A1AA', fontSize: 13 }}>Add your name for emergency alerts</span>
              <span style={{ color: '#E8000D', fontSize: 13, fontWeight: 600 }}>Set →</span>
            </button>
          )}
        </div>
      )}

      {/* Quick tips */}
      <div style={s.tipsRow}>
        {[
          { icon: '📞', label: '911', sub: 'Call first' },
          { icon: '💊', label: 'Narcan', sub: 'If available' },
          { icon: '↩️', label: 'Recovery', sub: 'On their side' },
          { icon: '⏱', label: 'Stay', sub: 'Until EMS' },
        ].map(tip => (
          <div key={tip.label} style={s.tip}>
            <span style={s.tipIcon}>{tip.icon}</span>
            <span style={s.tipLabel}>{tip.label}</span>
            <span style={s.tipSub}>{tip.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const RING_BASE = {
  position: 'absolute',
  borderRadius: '50%',
  border: '2px solid rgba(232,0,13,0.5)',
  pointerEvents: 'none',
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', flex: 1, background: '#0A0A0A' },
  statusBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px', paddingTop: 'max(14px, env(safe-area-inset-top))' },
  statusTime: { fontSize: 13, fontWeight: 600, color: '#52525B', minWidth: 44 },
  logoMark: { display: 'flex', alignItems: 'center', gap: 6 },
  logoLabel: { fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' },
  statusDate: { fontSize: 12, color: '#52525B', minWidth: 44, textAlign: 'right' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 16px', gap: 20 },
  greeting: { textAlign: 'center' },
  greetText: { fontSize: 16, color: '#52525B', fontWeight: 500 },
  sosContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: { ...RING_BASE, width: 200, height: 200, animation: 'ring-expand 2.4s 0s ease-out infinite' },
  ring2: { ...RING_BASE, width: 200, height: 200, animation: 'ring-expand 2.4s 0.8s ease-out infinite' },
  ring3: { ...RING_BASE, width: 200, height: 200, animation: 'ring-expand 2.4s 1.6s ease-out infinite' },
  sosBtn: {
    position: 'relative',
    zIndex: 2,
    width: 160,
    height: 160,
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #FF1A1A 0%, #E8000D 55%, #B30009 100%)',
    border: '3px solid rgba(255,255,255,0.12)',
    boxShadow: '0 0 60px rgba(232,0,13,0.5), 0 0 120px rgba(232,0,13,0.18), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    cursor: 'pointer',
    animation: 'glow-pulse 3s ease-in-out infinite',
    WebkitTapHighlightColor: 'transparent',
  },
  sosText: { fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '3px', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  sosSub: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '2.5px' },
  sosHint: { fontSize: 13, color: '#52525B', textAlign: 'center', maxWidth: 230, lineHeight: 1.5 },
  joinBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', width: '100%', maxWidth: 340 },
  joinBtnText: { flex: 1, fontSize: 13, color: '#A1A1AA', textAlign: 'left' },
  namePrompt: { margin: '0 16px 12px', padding: '12px 14px', background: 'rgba(232,0,13,0.07)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 },
  namePromptIcon: { flexShrink: 0 },
  nameInputRow: { flex: 1, display: 'flex', gap: 8 },
  nameInput: { flex: 1, background: '#222', border: '1px solid rgba(232,0,13,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#fff', outline: 'none' },
  nameSaveBtn: { background: '#E8000D', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' },
  namePromptBtn: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' },
  tipsRow: { display: 'flex', gap: 1, margin: '0 0 8px', padding: '12px 16px', background: '#111111', borderTop: '1px solid rgba(255,255,255,0.05)' },
  tip: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  tipIcon: { fontSize: 18 },
  tipLabel: { fontSize: 11, fontWeight: 700, color: '#A1A1AA' },
  tipSub: { fontSize: 10, color: '#52525B' },
}
