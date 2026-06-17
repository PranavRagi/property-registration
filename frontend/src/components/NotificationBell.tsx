import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../utils/api'
import { useSocket } from '../hooks/useSocket'
import { Notification } from '../types'

interface Props {
  onOpenChat: (roomID: string) => void
}

export default function NotificationBell({ onOpenChat }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open,          setOpen]          = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const socket      = useSocket()

  useEffect(() => { fetchNotifications() }, [])

  // ── Close dropdown when clicking outside ─────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Real-time new notification via socket ─────────────────────────────
  useEffect(() => {
    if (!socket) return
    socket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev])
    })
    return () => { socket.off('notification') }
  }, [socket])

  async function fetchNotifications() {
    const res = await apiFetch('/notifications')
    if (!res) return
    const data = await res.json()
    if (Array.isArray(data)) setNotifications(data)
  }

  // ── Mark ALL as read — only when user clicks "Mark all read" button ───
  async function markAllRead() {
    const res = await apiFetch('/notifications/read', { method: 'PATCH' })
    if (!res) return
    // Update local state only after server confirms
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // ── Mark SINGLE notification as read when clicked ─────────────────────
  async function handleNotifClick(notif: Notification) {
    // Mark single as read in local state immediately
    if (!notif.read) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      )
      // Tell backend to mark this one read
      await apiFetch(`/notifications/read/${notif.id}`, { method: 'PATCH' })
    }
    onOpenChat(notif.roomID)
    setOpen(false)
  }

  // ── Bell click — just toggles dropdown, does NOT auto-mark-read ───────
  function handleBellClick() {
    setOpen(prev => !prev)
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>

      {/* ── Bell Button ── */}
      <button style={s.bell} onClick={handleBellClick}>
        🔔
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={s.dropdown}>
          <div style={s.dropHeader}>
            <p style={s.dropTitle}>Notifications {unread > 0 && `(${unread} unread)`}</p>
            {unread > 0 && (
              <button style={s.clearBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p style={s.empty}>No notifications yet</p>
          )}

          {notifications.slice(0, 10).map(n => (
            <div
              key={n.id}
              style={{ ...s.notifItem, background: n.read ? 'white' : '#eef7f1' }}
              onClick={() => handleNotifClick(n)}
            >
              {/* Unread dot */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                {!n.read && <span style={s.unreadDot}/>}
                <div style={{ flex: 1 }}>
                  <p style={s.notifMsg}>{n.message}</p>
                  <p style={s.notifTime}>
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bell:       { position: 'relative', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 16, color: 'white' },
  badge:      { position: 'absolute', top: -6, right: -6, background: '#e74c3c', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown:   { position: 'absolute', top: 44, right: 0, width: 300, background: 'white', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' },
  dropHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f0f0f0' },
  dropTitle:  { fontSize: 14, fontWeight: 700, color: '#222' },
  clearBtn:   { background: 'none', border: 'none', fontSize: 12, color: '#2980b9', cursor: 'pointer', fontWeight: 500 },
  notifItem:  { padding: '10px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.15s' },
  notifMsg:   { fontSize: 13, color: '#333', marginBottom: 3 },
  notifTime:  { fontSize: 11, color: '#aaa' },
  unreadDot:  { width: 8, height: 8, borderRadius: '50%', background: '#27ae60', flexShrink: 0, marginTop: 4 },
  empty:      { padding: 20, textAlign: 'center', fontSize: 13, color: '#aaa' }
}