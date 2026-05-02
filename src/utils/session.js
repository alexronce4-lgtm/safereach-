const SESSION_TTL = 4 * 60 * 60 * 1000 // 4 hours

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function storageKey(code) {
  return `sr_session_${code.toUpperCase()}`
}

export function createSession(code, victimName) {
  const session = {
    code: code.toUpperCase(),
    victimName: victimName || 'Unknown',
    createdAt: Date.now(),
    victimLocation: null,
    victimLastSeen: Date.now(),
    familyMembers: [],
    chatHistory: [],
    naloxoneGiven: false,
    voiceMessages: [],
    familyMessages: [],
  }
  localStorage.setItem(storageKey(code), JSON.stringify(session))
  return session
}

export function getSession(code) {
  if (!code) return null
  const raw = localStorage.getItem(storageKey(code))
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    if (Date.now() - session.createdAt > SESSION_TTL) {
      localStorage.removeItem(storageKey(code))
      return null
    }
    return session
  } catch {
    return null
  }
}

export function updateSession(code, updates) {
  const session = getSession(code)
  if (!session) return null
  const updated = { ...session, ...updates }
  localStorage.setItem(storageKey(code), JSON.stringify(updated))
  return updated
}

export function addFamilyMember(code, member) {
  const session = getSession(code)
  if (!session) return null
  const existing = (session.familyMembers || []).findIndex(m => m.name === member.name)
  let members
  if (existing >= 0) {
    members = session.familyMembers.map((m, i) => i === existing ? { ...m, ...member } : m)
  } else {
    members = [...(session.familyMembers || []), { ...member, joinedAt: Date.now() }]
  }
  return updateSession(code, { familyMembers: members })
}

export function updateFamilyLocation(code, memberName, location) {
  const session = getSession(code)
  if (!session) return null
  const members = (session.familyMembers || []).map(m =>
    m.name === memberName ? { ...m, location, lastSeen: Date.now() } : m
  )
  return updateSession(code, { familyMembers: members })
}

export function addVoiceMessage(code, audioDataUrl, from) {
  const session = getSession(code)
  if (!session) return null
  const msgs = session.voiceMessages || []
  return updateSession(code, {
    voiceMessages: [...msgs, { audio: audioDataUrl, from, timestamp: Date.now(), played: false }],
  })
}

export function markVoicePlayed(code, timestamp) {
  const session = getSession(code)
  if (!session) return null
  const msgs = (session.voiceMessages || []).map(m =>
    m.timestamp === timestamp ? { ...m, played: true } : m
  )
  return updateSession(code, { voiceMessages: msgs })
}

export function addFamilyMessage(code, from, text) {
  const session = getSession(code)
  if (!session) return null
  const msgs = session.familyMessages || []
  return updateSession(code, {
    familyMessages: [...msgs, { from, text, timestamp: Date.now() }],
  })
}

// Haversine distance in miles
export function haversineDistance(a, b) {
  const R = 3959
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function calculateETA(victimLoc, familyLoc) {
  const dist = haversineDistance(victimLoc, familyLoc)
  const eta = Math.max(1, Math.round(dist / 0.5)) // assumes ~30 mph average
  return { distance: dist.toFixed(1), eta }
}

export function buildDarkMapUrl(victimLoc, familyLoc, apiKey, width = 358, height = 180) {
  const styles = [
    'feature:all|element:geometry|color:0x1a1a2e',
    'feature:all|element:labels.text.fill|color:0x8b9eb5',
    'feature:all|element:labels.text.stroke|color:0x1a1a2e',
    'feature:road|element:geometry|color:0x2d3561',
    'feature:road.highway|element:geometry|color:0x3d4e7a',
    'feature:road.highway|element:geometry.stroke|color:0x1a1a2e',
    'feature:water|element:geometry|color:0x0d1117',
    'feature:poi|visibility:off',
    'feature:transit|visibility:off',
  ].map(s => `style=${s}`).join('&')

  const victimMarker = `markers=color:0xE8000D|label:V|${victimLoc.lat},${victimLoc.lng}`
  const familyMarker = familyLoc
    ? `&markers=color:0x3B82F6|label:F|${familyLoc.lat},${familyLoc.lng}`
    : ''

  return (
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${victimLoc.lat},${victimLoc.lng}&zoom=14&size=${width}x${height}&scale=2&` +
    `${styles}&${victimMarker}${familyMarker}&key=${apiKey}`
  )
}
