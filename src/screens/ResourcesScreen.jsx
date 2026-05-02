import { useState } from 'react'

const overdoseSteps = [
  { num: '01', title: 'Call 911 immediately', detail: 'Tell them you think someone has overdosed. Stay on the line and follow their instructions.' },
  { num: '02', title: 'Try to wake them', detail: 'Shout their name, rub your knuckles firmly on their sternum. Check for breathing.' },
  { num: '03', title: 'Administer Naloxone', detail: 'Insert nozzle into one nostril. Press plunger firmly. Wait 2–3 min. Give second dose if no response.' },
  { num: '04', title: 'Recovery position', detail: 'If breathing, roll onto their side (recovery position) to prevent choking. Keep airway clear.' },
  { num: '05', title: 'Rescue breathing', detail: 'If not breathing normally, give one breath every 5 seconds. Tilt head, lift chin, seal their mouth.' },
  { num: '06', title: 'Stay until EMS arrives', detail: 'Do not leave them alone. Naloxone wears off in 30–90 minutes — a second overdose is possible.' },
]

export default function ResourcesScreen() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="screen-in" style={s.screen}>
      <div style={s.header}>
        <h1 style={s.title}>Resources</h1>
        <p style={s.sub}>Overdose response guide and emergency tools</p>
      </div>

      <div style={s.body}>
        <div style={s.section}>
          <p style={s.sectionLabel}>EMERGENCY ACTIONS</p>
          <div style={s.quickRow}>
            <a href="tel:911" style={{ ...s.quickCard, ...s.quickRed }}>
              <span style={s.quickIcon}>📞</span>
              <span style={s.quickTitle}>Call 911</span>
              <span style={s.quickSub}>Tap to dial</span>
            </a>
            <a href="tel:18006628684" style={{ ...s.quickCard, ...s.quickBlue }}>
              <span style={s.quickIcon}>💊</span>
              <span style={s.quickTitle}>SAMHSA</span>
              <span style={s.quickSub}>1-800-662-8684</span>
            </a>
          </div>
          <a href="https://nextdistro.org" target="_blank" rel="noreferrer" style={s.wideCard}>
            <div style={s.wideCardLeft}>
              <span style={s.wideCardIcon}>📍</span>
              <div>
                <div style={s.wideCardTitle}>Find Naloxone Near You</div>
                <div style={s.wideCardSub}>nextdistro.org — free naloxone locator</div>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="#52525B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>OVERDOSE RESPONSE GUIDE</p>
          {overdoseSteps.map((step, i) => (
            <div key={step.num} style={s.stepCard} onClick={() => setExpanded(expanded === i ? null : i)}>
              <div style={s.stepHeader}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={{ ...s.stepChevron, transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="#52525B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {expanded === i && (
                <p style={s.stepDetail}>{step.detail}</p>
              )}
            </div>
          ))}
        </div>

        <div style={s.naloxoneCard}>
          <div style={s.naloxoneHeader}>
            <span style={s.naloxoneTitle}>About Naloxone (Narcan)</span>
          </div>
          <p style={s.naloxoneText}>
            Naloxone is a life-saving medication that rapidly reverses opioid overdose. It is safe, fast-acting, and available at most pharmacies without a prescription in the US. It causes no harm if given to someone who has not taken opioids.
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  screen: { display: 'flex', flexDirection: 'column', flex: 1, background: '#0A0A0A', overflow: 'hidden' },
  header: { padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  title: { fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: '#52525B' },
  body: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 },
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '1px', marginBottom: 2 },
  quickRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  quickCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '18px 12px', borderRadius: 16, textDecoration: 'none', border: 'none', cursor: 'pointer', minHeight: 90 },
  quickRed: { background: 'rgba(232,0,13,0.12)', border: '1px solid rgba(232,0,13,0.2)' },
  quickBlue: { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' },
  quickIcon: { fontSize: 24 },
  quickTitle: { fontSize: 14, fontWeight: 700, color: '#fff' },
  quickSub: { fontSize: 11, color: '#A1A1AA' },
  wideCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#1A1A1A', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' },
  wideCardLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  wideCardIcon: { fontSize: 24 },
  wideCardTitle: { fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 },
  wideCardSub: { fontSize: 12, color: '#52525B' },
  stepCard: { background: '#1A1A1A', borderRadius: 12, padding: '13px 14px', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' },
  stepHeader: { display: 'flex', alignItems: 'center', gap: 10 },
  stepNum: { fontSize: 11, fontWeight: 800, color: '#E8000D', minWidth: 24, letterSpacing: '0.5px' },
  stepTitle: { flex: 1, fontSize: 14, fontWeight: 600, color: '#fff' },
  stepChevron: { transition: 'transform 0.2s', flexShrink: 0 },
  stepDetail: { fontSize: 13, color: '#A1A1AA', lineHeight: 1.6, marginTop: 10, paddingLeft: 34 },
  naloxoneCard: { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, padding: 16, marginBottom: 8 },
  naloxoneHeader: { marginBottom: 8 },
  naloxoneTitle: { fontSize: 14, fontWeight: 700, color: '#3B82F6' },
  naloxoneText: { fontSize: 13, color: '#A1A1AA', lineHeight: 1.65 },
}
