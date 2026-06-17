import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../utils/api'
import { getUsername } from '../utils/auth'
import { useSocket } from '../hooks/useSocket'
import ChatWindow from '../components/Chatwindow'
// import { Message, Conversation } from '../types'

interface Message {
  id:         string
  from:       string
  to:         string
  type:       'text' | 'image' | 'audio' | 'video'
  content:    string
  timestamp:  string
  read:       boolean
}

interface Conversation {
  roomID:      string
  lastMessage: Message | null
  unread:      number
}

// ── Props — initialRoom comes from notification click in App.tsx ──────────────
interface Props {
  initialRoom?:  string | null
  onRoomOpened?: () => void
}

export default function Messages({ initialRoom, onRoomOpened }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeRoom,    setActiveRoom]    = useState<string | null>(null)
  const [newChat,       setNewChat]       = useState('')
  const socket = useSocket()
  const me     = getUsername() || ''

  // ── Load conversations on mount ───────────────────────────────────────────
  useEffect(() => { fetchConversations() }, [])

  // ── Auto-open room when coming from a notification click ──────────────────
  useEffect(() => {
    if (initialRoom) {
      openChat(initialRoom)
      onRoomOpened?.()       // clears chatRoom state in App.tsx
    }
  }, [initialRoom])

  // ── Listen for new messages — refresh conversation list only ─────────────
  useEffect(() => {
    if (!socket) return
    socket.on('receive_message', () => { fetchConversations() })
    return () => { socket.off('receive_message') }
  }, [socket])

  function getOtherUser(roomID: string): string {
    const parts = roomID.replace('chat:', '').split('-')
    return parts[0] === me ? parts[1] : parts[0]
  }

  function getRoomID(user1: string, user2: string): string {
    return `chat:${[user1, user2].sort().join('-')}`
  }

  async function fetchConversations() {
    const res = await apiFetch('/conversations')
    if (!res) return
    const data = await res.json()
    if (Array.isArray(data)) setConversations(data)
  }

  async function openChat(roomID: string) {
    setActiveRoom(roomID)
    fetchConversations()
  }

  async function startNewChat() {
    if (!newChat.trim()) return
    const roomID = getRoomID(me, newChat.trim())
    setNewChat('')
    await openChat(roomID)
  }

  return (
    <div style={s.page}>

      {/* ── Left — Conversations list ── */}
      <div style={s.sidebar}>
        <div style={s.sideHeader}>
          <p style={s.sideTitle}>💬 Messages</p>
        </div>

        {/* Start new chat */}
        <div style={s.newChat}>
          <input
            style={s.newChatInput}
            placeholder="Enter username to chat..."
            value={newChat}
            onChange={e => setNewChat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startNewChat()}
          />
          <button style={s.newChatBtn} onClick={startNewChat}>+</button>
        </div>

        {/* Conversation list */}
        {conversations.length === 0 && (
          <p style={s.empty}>No conversations yet</p>
        )}
        {conversations.map(c => (
          <div
            key={c.roomID}
            style={{ ...s.convItem, background: activeRoom === c.roomID ? '#eef7f1' : 'white' }}
            onClick={() => openChat(c.roomID)}
          >
            <div style={s.convAvatar}>{getOtherUser(c.roomID).charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={s.convName}>{getOtherUser(c.roomID)}</p>
                {c.unread > 0 && <span style={s.unreadBadge}>{c.unread}</span>}
              </div>
              <p style={s.convLast}>
                {c.lastMessage
                  ? c.lastMessage.type === 'text'
                    ? c.lastMessage.content.slice(0, 30)
                    : `📎 ${c.lastMessage.type}`
                  : 'No messages yet'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Right — ChatWindow component ── */}
      <div style={s.chatArea}>
        {!activeRoom ? (
          <div style={s.noChat}>
            <p style={{ fontSize: 40 }}>💬</p>
            <p style={{ fontSize: 16, color: '#888', marginTop: 12 }}>
              Select a conversation or start a new one
            </p>
          </div>
        ) : (
          <ChatWindow
            roomID={activeRoom}
            onClose={() => setActiveRoom(null)}
          />
        )}
      </div>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', height: 'calc(100vh - 56px)', background: '#f5f5f5' },
  sidebar:      { width: 300, background: 'white', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideHeader:   { padding: '16px 14px', borderBottom: '1px solid #eee' },
  sideTitle:    { fontSize: 16, fontWeight: 700, color: '#222' },
  newChat:      { display: 'flex', gap: 8, padding: '10px 14px', borderBottom: '1px solid #eee' },
  newChatInput: { flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, outline: 'none' },
  newChatBtn:   { padding: '7px 12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
  convItem:     { display: 'flex', gap: 10, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', alignItems: 'center' },
  convAvatar:   { width: 40, height: 40, borderRadius: '50%', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  convName:     { fontSize: 14, fontWeight: 600, color: '#222' },
  convLast:     { fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  unreadBadge:  { background: '#27ae60', color: 'white', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
  empty:        { padding: 20, fontSize: 13, color: '#aaa', textAlign: 'center' },
  chatArea:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  noChat:       { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
}