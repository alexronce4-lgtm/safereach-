export default function BottomNav({ activeTab, onTabChange, emergencyActive }) {
  const tabs = [
    {
      id: 'emergency',
      label: 'Emergency',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 2L2 19h18L11 2Z" stroke={active ? '#E8000D' : '#52525B'}
            strokeWidth="1.8" strokeLinejoin="round" fill={active ? 'rgba(232,0,13,0.15)' : 'none'} />
          <line x1="11" y1="9" x2="11" y2="13" stroke={active ? '#E8000D' : '#52525B'}
            strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="11" cy="16" r="0.9" fill={active ? '#E8000D' : '#52525B'} />
        </svg>
      ),
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="9" cy="7" r="3.5" stroke={active ? '#E8000D' : '#52525B'} strokeWidth="1.7" />
          <path d="M2 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={active ? '#E8000D' : '#52525B'}
            strokeWidth="1.7" strokeLinecap="round" />
          <path d="M17 10l2 2 3-3" stroke={active ? '#E8000D' : '#52525B'}
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'map',
      label: 'Map',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 2C7.134 2 4 5.134 4 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.866-3.134-7-7-7z"
            stroke={active ? '#E8000D' : '#52525B'} strokeWidth="1.7"
            fill={active ? 'rgba(232,0,13,0.12)' : 'none'} />
          <circle cx="11" cy="9" r="2.5" stroke={active ? '#E8000D' : '#52525B'} strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="8" r="4" stroke={active ? '#E8000D' : '#52525B'} strokeWidth="1.7" />
          <path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke={active ? '#E8000D' : '#52525B'}
            strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <div style={s.nav}>
      {tabs.map(tab => {
        const active = activeTab === tab.id
        return (
          <button key={tab.id} style={s.tab} onClick={() => onTabChange(tab.id)}>
            <div style={s.iconWrap}>
              {tab.id === 'emergency' && emergencyActive && (
                <span style={s.emergencyDot} />
              )}
              {tab.icon(active)}
            </div>
            <span style={{ ...s.label, color: active ? '#E8000D' : '#52525B' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const s = {
  nav: {
    display: 'flex',
    background: '#111111',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    flexShrink: 0,
    zIndex: 50,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    paddingTop: 10,
    paddingBottom: 4,
    background: 'none',
    border: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
  },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#E8000D',
    border: '1.5px solid #111111',
    animation: 'pulse-dot 1.2s ease-in-out infinite',
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.3px',
  },
}
