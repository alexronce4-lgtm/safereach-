import { useState } from 'react'

const STORE_KEY = 'sr_contacts'

function loadContacts() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch { return [] }
}
function saveContacts(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list))
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState(loadContacts)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relation: '' })

  function addContact() {
    if (!form.name.trim()) return
    const updated = [...contacts, { ...form, id: Date.now() }]
    setContacts(updated)
    saveContacts(updated)
    setForm({ name: '', phone: '', relation: '' })
    setAdding(false)
  }

  function removeContact(id) {
    const updated = contacts.filter(c => c.id !== id)
    setContacts(updated)
    saveContacts(updated)
  }

  return (
    <div className="screen-in" style={s.screen}>
      <div style={s.header}>
        <h1 style={s.title}>Emergency Contacts</h1>
        <p style={s.sub}>These people will be alerted when you press SOS</p>
      </div>

      <div style={s.body}>
        {contacts.length === 0 && !adding && (
          <div style={s.empty}>
            <div style={s.emptyIcon}>👥</div>
            <p style={s.emptyText}>No contacts yet</p>
            <p style={s.emptySub}>Add family and friends who should be notified in an emergency</p>
          </div>
        )}

        {contacts.map(c => (
          <div key={c.id} style={s.card}>
            <div style={s.avatar}>
              <span style={s.avatarLetter}>{c.name[0].toUpperCase()}</span>
            </div>
            <div style={s.cardInfo}>
              <div style={s.cardName}>{c.name}</div>
              <div style={s.cardMeta}>{c.relation && `${c.relation} · `}{c.phone}</div>
            </div>
            <button style={s.callBtn} onClick={() => window.open(`tel:${c.phone}`)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 1.5c0-.276.224-.5.5-.5h2.618c.238 0 .444.166.49.4l.666 3.334a.5.5 0 01-.276.548L5.3 6.066a8.5 8.5 0 004.634 4.634l.784-1.698a.5.5 0 01.548-.276l3.334.666c.234.046.4.252.4.49V12.5a.5.5 0 01-.5.5C6.82 13 3 9.18 3 4.5V1.5z"
                  fill="#22C55E" />
              </svg>
            </button>
            <button style={s.removeBtn} onClick={() => removeContact(c.id)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="#52525B" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}

        {adding ? (
          <div style={s.formCard}>
            <input style={s.input} placeholder="Name *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <input style={s.input} placeholder="Phone number" value={form.phone} type="tel"
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <input style={s.input} placeholder="Relation (e.g. Mom, Partner)" value={form.relation}
              onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button style={{ ...s.btn, ...s.btnGhost, flex: 1 }} onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button style={{ ...s.btn, ...s.btnPrimary, flex: 2 }} onClick={addContact}>
                Save Contact
              </button>
            </div>
          </div>
        ) : (
          <button style={s.addBtn} onClick={() => setAdding(true)}>
            <span style={s.addBtnPlus}>+</span> Add Contact
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', flex: 1, background: '#0A0A0A', overflow: 'hidden' },
  header: { padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  title: { fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: '#52525B' },
  body: { flex: 1, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40, textAlign: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontSize: 16, fontWeight: 600, color: '#A1A1AA' },
  emptySub: { fontSize: 13, color: '#52525B', lineHeight: 1.5 },
  card: { background: '#1A1A1A', borderRadius: 14, padding: '14px 14px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: '50%', background: 'rgba(232,0,13,0.15)', border: '1px solid rgba(232,0,13,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarLetter: { fontSize: 18, fontWeight: 700, color: '#E8000D' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#52525B' },
  callBtn: { width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formCard: { background: '#1A1A1A', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 },
  input: { background: '#222', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', fontSize: 15, color: '#fff', outline: 'none', width: '100%' },
  btn: { borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', textAlign: 'center' },
  btnPrimary: { background: '#E8000D', color: '#fff' },
  btnGhost: { background: 'rgba(255,255,255,0.06)', color: '#A1A1AA', border: '1px solid rgba(255,255,255,0.1)' },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#A1A1AA', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' },
  addBtnPlus: { fontSize: 20, color: '#E8000D', fontWeight: 700, lineHeight: 1 },
}
