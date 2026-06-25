import { useState, useEffect, useRef, useMemo } from 'react'
import { apiFetch } from '../utils/api'
import { getUsername } from '../utils/auth'
import { useSocket } from '../hooks/useSocket'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id:         string
  from:       string
  to:         string
  type:       'text' | 'image' | 'audio' | 'video'
  content:    string
  propertyID: string | null
  timestamp:  string
  read:       boolean
}

interface Props {
  roomID:      string                  // e.g. "chat:alice-bob"
  onClose?:    () => void              // optional close button handler
  propertyID?: string | null           // optional — attach property context
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getOtherUser(roomID: string, me: string): string {
  const parts = roomID.replace('chat:', '').split('-')
  return parts[0] === me ? parts[1] : parts[0]
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWindow({ roomID, onClose, propertyID = null }: Props) {
  const [messages,    setMessages]    = useState<Message[]>([])
  const [text,        setText]        = useState('')
  const [typing,      setTyping]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string; type: Message['type'] } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const typingTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const socket = useSocket()

  // Use useMemo so me is always the trimmed, lowercase-safe username
  // This prevents isMine failing due to stale closure or case mismatch
  const me    = (getUsername() || '').trim()
  const other = getOtherUser(roomID, me)
  const BACKEND = "https://property-registration-production.up.railway.app"
  const API_URL = `${BACKEND}/api`

  // ── On mount — join room + load history ───────────────────────────────────
  useEffect(() => {
    socket?.emit('join_room', { roomID })
    loadMessages()

    return () => {
      // Mark messages as read when leaving
      socket?.emit('mark_read', { roomID })
    }
  }, [roomID])

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.on('receive_message', (msg: Message) => {
      const isThisRoom =
        (msg.from === me.trim()    && msg.to === other) ||
        (msg.from === other && msg.to === me.trim())

      if (isThisRoom) {
        // Skip own messages — already added optimistically on send
        if (msg.from.trim() === me) return
        setMessages(prev => [...prev, msg])
        scrollToBottom()
        socket.emit('mark_read', { roomID })
      }
    })

    socket.on('typing_status', ({ from, typing: isTyping }: { from: string; typing: boolean }) => {
      if (from === other) setTyping(isTyping)
    })

    socket.on('messages_read', ({ by }: { by: string }) => {
      if (by === other) {
        setMessages(prev => prev.map(m => m.from === me ? { ...m, read: true } : m))
      }
    })

    return () => {
      socket.off('receive_message')
      socket.off('typing_status')
      socket.off('messages_read')
    }
  }, [socket, roomID, me, other])

  // ── Scroll to bottom when messages update ─────────────────────────────────
  useEffect(() => { scrollToBottom() }, [messages])

  async function loadMessages() {
    setLoading(true)
    const res = await apiFetch(`/messages/${roomID}`)
    if (res) {
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    }
    setLoading(false)
    scrollToBottom()
    socket?.emit('mark_read', { roomID })
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  // ── Send text message ─────────────────────────────────────────────────────
  function sendMessage(type: Message['type'] = 'text', content?: string) {
    if (!socket) return
    const payload = content ?? text.trim()
    if (!payload) return

    // Optimistically add message to UI immediately — no reload needed
    const optimistic: Message = {
      id:         `OPT-${Date.now()}`,
      from:       me,
      to:         other,
      type,
      content:    payload,
      propertyID: propertyID || null,
      timestamp:  new Date().toISOString(),
      read:       false
    }
    setMessages(prev => [...prev, optimistic])
    scrollToBottom()

    socket.emit('send_message', { roomID, to: other, type, content: payload, propertyID })
    setText('')
  }

  // ── Typing indicator ──────────────────────────────────────────────────────
  function handleTyping() {
    if (!socket) return
    socket.emit('typing', { roomID, to: other })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', { roomID, to: other })
    }, 2000)
  }

  // ── File upload ───────────────────────────────────────────────────────────
  // Step 1 — show preview, don't send yet
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const type: Message['type'] = file.type.startsWith('image') ? 'image'
                                 : file.type.startsWith('audio') ? 'audio'
                                 : file.type.startsWith('video') ? 'video'
                                 : 'text'
    // For video, append #t=0.1 so browser loads first frame as thumbnail
    const objectURL = URL.createObjectURL(file)
    const preview   = type === 'video' ? `${objectURL}#t=0.1` : objectURL
    setPendingFile({ file, preview, type })
  }

  // Step 2 — user confirms → upload and send
  async function confirmSendFile() {
    if (!pendingFile) return
    const { file, type } = pendingFile
    setPendingFile(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('roomID', roomID)

    const res = await apiFetch('/upload-chat-file', { method: 'POST', body: fd })
    if (!res) return
    const data = await res.json()
    if (data.url) sendMessage(type, data.url)
  }

  // ── Render a single message bubble ────────────────────────────────────────
  function renderBubble(m: Message) {
    const isMine = m.from.trim() === me
    return (
      <div
        key={m.id}
        style={{
          display:        'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginBottom:   8,
          paddingLeft:    isMine ? 40 : 0,
          paddingRight:   isMine ? 0  : 40,
        }}
      >
        {/* Avatar — only for received messages */}
        {!isMine && (
          <div style={s.avatarSmall}>{other.charAt(0).toUpperCase()}</div>
        )}

        <div style={{
          ...s.bubble,
          background:   isMine ? '#2c3e50' : '#f0f0f0',
          color:        isMine ? 'white'   : '#333',
          borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        }}>
          {/* Property context pill */}
          {m.propertyID && (
            <p style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>
              🏠 {m.propertyID}
            </p>
          )}

          {m.type === 'text'  && <p style={{ fontSize: 14, lineHeight: 1.4 }}>{m.content}</p>}
          {m.type === 'image' && (
            <img
              src={m.content}
              alt="img"
              style={{ maxWidth: 200, borderRadius: 6, display: 'block', cursor: 'pointer' }}
              onClick={() => window.open(m.content, '_blank')}
            />
          )}
          {m.type === 'audio' && <audio controls src={m.content} style={{ maxWidth: 220 }}/>}
          {m.type === 'video' && (
            <video controls src={m.content} style={{ maxWidth: 220, borderRadius: 6 }}/>
          )}

          {/* Timestamp + read receipt */}
          <p style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMine && (
              <span style={{ marginLeft: 4 }}>
                {m.read ? '✓✓' : '✓'}
              </span>
            )}
          </p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.window}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.avatar}>{other.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={s.headerName}>{other}</p>
          {typing
            ? <p style={s.typingText}>typing...</p>
            : <p style={s.onlineText}>Active</p>
          }
        </div>
        {onClose && (
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        )}
      </div>

      {/* ── Property context banner ── */}
      {propertyID && (
        <div style={s.propBanner}>
          🏠 Chatting about property: <strong>{propertyID}</strong>
        </div>
      )}

      {/* ── Message list ── */}
      <div style={s.messageList}>
        {loading && (
          <div style={s.loadingWrap}>
            <p style={s.loadingText}>Loading messages...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={s.emptyWrap}>
            <p style={{ fontSize: 32 }}>👋</p>
            <p style={s.emptyText}>Say hello to <strong>{other}</strong></p>
          </div>
        )}

        {!loading && messages.map(renderBubble)}
        <div ref={messagesEndRef}/>
      </div>

      {/* ── File Preview Modal (WhatsApp style) ── */}
      {pendingFile && (
        <div style={s.previewOverlay}>
          <div style={s.previewBox}>
            <p style={{ fontWeight: 600, marginBottom: 12, color: '#222' }}>Send this {pendingFile.type}?</p>

            {pendingFile.type === 'image' && (
              <img
                src={pendingFile.preview}
                alt="preview"
                style={{ maxWidth: 280, maxHeight: 240, borderRadius: 8, objectFit: 'cover', display: 'block' }}
              />
            )}
            {pendingFile.type === 'video' && (
              <video
                src={pendingFile.preview}
                controls
                preload="metadata"
                style={{ maxWidth: 300, maxHeight: 220, borderRadius: 8, display: 'block', background: '#000' }}
              />
            )}
            {pendingFile.type === 'audio' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 40, marginBottom: 8 }}>🎵</p>
                <p style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>{pendingFile.file.name}</p>
                <audio src={pendingFile.preview} controls style={{ width: 260 }}/>
              </div>
            )}

            <p style={{ fontSize: 11, color: '#aaa', marginTop: 10, textAlign: 'center' }}>
              {pendingFile.file.name} · {(pendingFile.file.size / 1024).toFixed(0)} KB
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, width: '100%' }}>
              <button style={s.previewCancel} onClick={() => setPendingFile(null)}>Cancel</button>
              <button style={s.previewSend}   onClick={confirmSendFile}>Send ➤</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={s.inputBar}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Attach button */}
        <button
          style={s.attachBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          📎
        </button>

        {/* Text input */}
        <input
          style={s.textInput}
          placeholder={`Message ${other}...`}
          value={text}
          onChange={e => { setText(e.target.value); handleTyping() }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
        />

        {/* Send button */}
        <button
          style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.5 }}
          onClick={() => sendMessage()}
          disabled={!text.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  window:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#fafafa', borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative' },

  // Header
  header:      { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#2c3e50', flexShrink: 0 },
  avatar:      { width: 40, height: 40, borderRadius: '50%', background: '#27ae60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  avatarSmall: { width: 28, height: 28, borderRadius: '50%', background: '#7f8c8d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, marginRight: 6, flexShrink: 0, alignSelf: 'flex-end' },
  headerName:  { fontSize: 15, fontWeight: 700, color: 'white' },
  typingText:  { fontSize: 11, color: '#2ecc71', fontStyle: 'italic' },
  onlineText:  { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  closeBtn:    { background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },

  // Property banner
  propBanner:  { padding: '6px 16px', background: '#eef7f1', borderBottom: '1px solid #d5eedd', fontSize: 12, color: '#27ae60', flexShrink: 0 },

  // Messages
  messageList: { flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column' },
  loadingWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, color: '#aaa' },
  emptyWrap:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:   { fontSize: 14, color: '#888' },
  bubble:      { maxWidth: '70%', padding: '10px 14px', wordBreak: 'break-word' },

  // Input
  inputBar:    { display: 'flex', gap: 8, padding: '10px 12px', background: 'white', borderTop: '1px solid #eee', alignItems: 'center', flexShrink: 0 },
  attachBtn:   { padding: '8px 10px', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16, flexShrink: 0 },
  textInput:   { flex: 1, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 20, fontSize: 14, outline: 'none', background: '#f8f8f8' },
  sendBtn:       { padding: '9px 14px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 16, fontWeight: 700, flexShrink: 0, transition: 'opacity 0.2s' },

  // File preview modal
  previewOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: 8 },
  previewBox:     { background: 'white', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxWidth: 360, width: '90%' },
  previewCancel:  { flex: 1, padding: '9px 0', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#555' },
  previewSend:    { flex: 1, padding: '9px 0', background: '#2c3e50', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: 'white' },
}