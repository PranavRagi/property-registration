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
              style={{ ...s.notifItem, background: n.read ? 'var(--color-surface)' : 'var(--color-success-bg)' }}
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
  bell:       { position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)', cursor: 'pointer', fontSize: 15, color: 'white' },
  badge:      { position: 'absolute', top: -6, right: -6, background: 'var(--color-danger)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(231,76,60,0.4)' },
  dropdown:   { position: 'absolute', top: 44, right: 0, width: 320, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden', border: '1px solid var(--color-border)' },
  dropHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' },
  dropTitle:  { fontSize: 14, fontWeight: 600, color: 'var(--color-text)' },
  clearBtn:   { background: 'none', border: 'none', fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 500 },
  notifItem:  { padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background var(--transition)' },
  notifMsg:   { fontSize: 13, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.4 },
  notifTime:  { fontSize: 11, color: 'var(--color-text-muted)' },
  unreadDot:  { width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0, marginTop: 4 },
  empty:      { padding: 'var(--space-8) var(--space-5)', textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' },
}