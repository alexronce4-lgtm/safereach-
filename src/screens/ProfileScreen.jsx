import { useState } from 'react'

export default function ProfileScreen({ userName, onSaveUserName }) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(userName)
  const [saved, setSaved] = useState(false)

  function save() {
    onSaveUserName(nameInput.trim())
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const version = '1.0.0'
  const initials = userName ? userName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <div className="screen-in" style={s.screen}>
      <div style={s.header}>
        <h1 style={s.title}>Profile</h1>
      </div>

      <div style={s.body}>
        <div style={s.avatarCard}>
          <div style={s.bigAvatar}>
            <span style={s.bigAvatarText}>{initials}</span>
          </div>
          {userName ? (
            <div style={s.nameDisplay}>{userName}</div>
          ) : (
            <div style={s.nameDisplay}>Set your name</div>
          )}
          <div style={s.nameSub}>Used in emergency alerts sent to your contacts</div>
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>IDENTITY</p>
          <div style={s.card}>
            <div style={s.cardRow}>
              <div style={s.cardLabel}>Your name</div>
              {editing ? (
                <div style={s.editRow}>
                  <input style={s.input} value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && save()}
                    autoFocus placeholder="Enter your name" />
                  <button style={s.saveBtn} onClick={save}>Save</button>
                </div>
              ) : (
                <button style={s.editTrigger} onClick={() => { setNameInput(userName); setEditing(true) }}>
                  <span style={{ color: userName ? '#fff' : '#52525B' }}>{userName || 'Not set'}</span>
                  <span style={s.editIcon}>✎</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>ABOUT</p>
          <div style={s.card}>
            {[
              ['Version', version],
              ['Model', 'claude-haiku-4-5'],
              ['Session storage', 'Device only (localStorage)'],
              ['Location access', 'On demand only'],
            ].map(([label, value]) => (
              <div key={label} style={s.infoRow}>
                <span style={s.infoLabel}>{label}</span>
                <span style={s.infoValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.disclaimerCard}>
          <p style={s.disclaimerTitle}>⚠️ Medical Disclaimer</p>
          <p style={s.disclaimerText}>
            SafeReach is not a substitute for emergency medical services. Always call 911 in any life-threatening situation. AI responses are for guidance only and do not constitute medical advice.
          </p>
        </div>

        {saved && (
          <div style={s.savedBanner}>✓ Profile saved</div>
        )}
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', flex: 1, background: '#0A0A0A', overflow: 'hidden' },
  header: { padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  title: { fontSize: 22, fontWeight: 700, color: '#fff' },
  body: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 },
  avatarCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px', background: '#1A1A1A', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' },
  bigAvatar: { width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(232,0,13,0.3), rgba(180,0,10,0.5))', border: '2px solid rgba(232,0,13,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bigAvatarText: { fontSize: 28, fontWeight: 800, color: '#E8000D' },
  nameDisplay: { fontSize: 18, fontWeight: 700, color: '#fff' },
  nameSub: { fontSize: 12, color: '#52525B', textAlign: 'center', maxWidth: 200 },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '1px' },
  card: { background: '#1A1A1A', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' },
  cardRow: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  cardLabel: { fontSize: 12, color: '#52525B', fontWeight: 600 },
  editRow: { display: 'flex', gap: 8 },
  input: { flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 15, color: '#fff', outline: 'none' },
  saveBtn: { background: '#E8000D', color: '#fff', borderRadius: 8, padding: '9px 14px', fontSize: 14, fontWeight: 600 },
  editTrigger: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', width: '100%', fontSize: 15, cursor: 'pointer' },
  editIcon: { color: '#52525B', fontSize: 15 },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  infoLabel: { fontSize: 14, color: '#A1A1AA' },
  infoValue: { fontSize: 13, color: '#52525B', maxWidth: '55%', textAlign: 'right' },
  disclaimerCard: { background: 'rgba(232,0,13,0.06)', border: '1px solid rgba(232,0,13,0.15)', borderRadius: 14, padding: 14 },
  disclaimerTitle: { fontSize: 13, fontWeight: 700, color: '#E8000D', marginBottom: 6 },
  disclaimerText: { fontSize: 12, color: '#A1A1AA', lineHeight: 1.6 },
  savedBanner: { textAlign: 'center', color: '#22C55E', fontSize: 14, fontWeight: 600, padding: '10px', background: 'rgba(34,197,94,0.1)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)', animation: 'fade-up 0.25s ease' },
}
