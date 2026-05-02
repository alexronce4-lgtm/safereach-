import { useState, useEffect, useRef, useCallback } from 'react'
import { CLAUDE_MODEL, REACH_SYSTEM_PROMPT } from '../config'

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hey, I'm here with you. Can you hear me? Tell me how you feel.",
  id: 'init',
}

function speak(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.88
  utterance.pitch = 1.05
  utterance.volume = 1
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find(v => ['Samantha', 'Karen', 'Victoria', 'Moira', 'Serena'].some(n => v.name.includes(n))) ||
      voices.find(v => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }
  window.speechSynthesis.getVoices().length === 0
    ? (window.speechSynthesis.onvoiceschanged = trySpeak)
    : trySpeak()
}

async function callReach(messages) {
  const resp = await fetch('/api/claude/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 220,
      system: REACH_SYSTEM_PROMPT,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    console.error('Reach API', resp.status, body)
    throw new Error(`API ${resp.status}`)
  }
  const data = await resp.json()
  return data.content[0].text
}

export default function ChatInterface({ chatHistory, onUpdateChatHistory }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [micStatus, setMicStatus] = useState(null) // null | 'listening' | 'blocked' | 'no-speech' | 'error'
  const [error, setError] = useState(null)
  const endRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)
  const sendMessageRef = useRef(null)

  const messages = chatHistory.length > 0 ? chatHistory : [INITIAL_MESSAGE]

  useEffect(() => {
    if (chatHistory.length === 0) {
      onUpdateChatHistory([INITIAL_MESSAGE])
      setTimeout(() => speak(INITIAL_MESSAGE.content), 350)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return
    setError(null)
    const base = chatHistory.length > 0 ? chatHistory : [INITIAL_MESSAGE]
    const userMsg = { role: 'user', content: text.trim(), id: Date.now() }
    const next = [...base, userMsg]
    onUpdateChatHistory(next)
    setInput('')
    setLoading(true)
    try {
      const reply = await callReach(next.map(({ role, content }) => ({ role, content })))
      const aiMsg = { role: 'assistant', content: reply, id: Date.now() + 1 }
      onUpdateChatHistory([...next, aiMsg])
      speak(reply)
    } catch (err) {
      console.error('Reach API error:', err)
      // Demo fallback — never show a broken state to the audience
      const fallback = "Stay with me. Help is on the way. Try to stay awake."
      const fallbackMsg = { role: 'assistant', content: fallback, id: Date.now() + 1 }
      onUpdateChatHistory([...next, fallbackMsg])
      speak(fallback)
    } finally {
      setLoading(false)
    }
  }, [chatHistory, loading, onUpdateChatHistory])

  // Keep a live ref so recognition callbacks always see the latest sendMessage
  sendMessageRef.current = sendMessage

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Voice input not supported — type your message instead')
      return
    }
    window.speechSynthesis.cancel()
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = true
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    rec.continuous = !isSafari

    rec.onresult = (e) => {
      // Rebuild full transcript from all results (finals + current interim)
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setInput(transcript.trim())
    }

    rec.onerror = (e) => {
      setListening(false)
      setMicStatus(null)
      if (e.error !== 'aborted') {
        setError('Voice paused — tap mic again or type.')
      }
    }

    rec.onend = () => {
      setListening(false)
      setMicStatus(null)
    }

    try {
      rec.start()
      recognitionRef.current = rec
      setListening(true)
      setMicStatus('listening')
      setError(null)
    } catch (e) {
      setError('Could not start mic — type your message instead')
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
    setMicStatus(null)
  }

  function stopAndSend() {
    recognitionRef.current?.stop()
    setListening(false)
    setMicStatus(null)
    sendMessageRef.current(input)
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.avatar}>R</div>
        <div>
          <div style={s.name}>Reach</div>
          <div style={s.status}>
            <span style={s.dot} /> AI Companion · Active
          </div>
        </div>
      </div>

      <div style={s.messages}>
        {messages.map(msg => (
          <div key={msg.id || msg.content.slice(0, 20)}
            style={{ ...s.row, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fade-up 0.22s ease' }}>
            {msg.role === 'assistant' && <div style={s.avatarSm}>R</div>}
            <div style={{ ...s.bubble, ...(msg.role === 'user' ? s.bubbleUser : s.bubbleAI) }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...s.row, justifyContent: 'flex-start' }}>
            <div style={s.avatarSm}>R</div>
            <div style={{ ...s.bubble, ...s.bubbleAI }}>
              <div style={s.dots}>
                {[0, 160, 320].map(d => (
                  <span key={d} style={{ ...s.dot2, animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={s.error} onClick={() => setError(null)}>{error} ✕</div>
        )}
        <div ref={endRef} />
      </div>

      <div style={s.inputBar}>
        <button
          style={{ ...s.micBtn, ...(listening ? s.micActive : {}) }}
          onClick={listening ? stopListening : startListening}
          aria-label={listening ? 'Stop listening' : 'Start voice input'}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="7" y="1" width="6" height="11" rx="3" fill={listening ? '#fff' : '#E8000D'} />
            <path d="M3.5 9.5a6.5 6.5 0 0013 0" stroke={listening ? '#fff' : '#E8000D'}
              strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="16" x2="10" y2="19" stroke={listening ? '#fff' : '#E8000D'}
              strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <input
          ref={inputRef}
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (listening ? stopAndSend() : sendMessage(input))}
          placeholder={listening ? '🎤 Listening...' : 'Message Reach...'}
          disabled={loading}
        />

        {listening ? (
          <button style={s.stopSendBtn} onClick={stopAndSend}>
            Send
          </button>
        ) : (
          <button
            style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.35 : 1 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9L16 2L11 16L9.5 9.5L2 9Z" fill="#fff" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#0A0A0A' },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FF1A1A, #8B0000)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0, boxShadow: '0 0 12px rgba(232,0,13,0.3)' },
  name: { fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 },
  status: { fontSize: 11, color: '#52525B', display: 'flex', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' },
  messages: { flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, WebkitOverflowScrolling: 'touch' },
  row: { display: 'flex', alignItems: 'flex-end', gap: 7 },
  avatarSm: { width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #FF1A1A, #8B0000)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', padding: '10px 14px', borderRadius: 18, fontSize: 15, lineHeight: 1.5 },
  bubbleUser: { background: '#E8000D', color: '#fff', borderBottomRightRadius: 4 },
  bubbleAI: { background: '#1A1A1A', color: '#E5E5E5', borderBottomLeftRadius: 4, border: '1px solid rgba(255,255,255,0.07)' },
  dots: { display: 'flex', gap: 4, padding: '3px 2px' },
  dot2: { width: 7, height: 7, borderRadius: '50%', background: '#52525B', animation: 'bounce-dot 1.2s ease-in-out infinite' },
  error: { fontSize: 12, color: '#E8000D', textAlign: 'center', padding: '8px 14px', background: 'rgba(232,0,13,0.1)', borderRadius: 8, border: '1px solid rgba(232,0,13,0.2)', cursor: 'pointer' },
  inputBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#111', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  micBtn: { width: 42, height: 42, borderRadius: '50%', background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' },
  micActive: { background: '#E8000D', border: '1px solid #E8000D', boxShadow: '0 0 16px rgba(232,0,13,0.4)' },
  input: { flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: '10px 14px', fontSize: 15, background: '#1A1A1A', color: '#fff', outline: 'none', caretColor: '#E8000D' },
  sendBtn: { width: 42, height: 42, borderRadius: '50%', background: '#E8000D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 0.15s', boxShadow: '0 4px 12px rgba(232,0,13,0.3)', WebkitTapHighlightColor: 'transparent' },
  stopSendBtn: { height: 42, padding: '0 16px', borderRadius: 21, background: '#E8000D', border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(232,0,13,0.4)', WebkitTapHighlightColor: 'transparent' },
}
