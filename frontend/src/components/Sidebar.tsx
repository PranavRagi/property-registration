import { useState } from 'react'
import { getUsername, getMode, setMode, logout } from '../utils/auth'
import { disconnectSocket } from '../hooks/useSocket'
import NotificationBell from './NotificationBell'

interface Props {
  page:       string
  onNavigate: (page: string) => void
  onLogout:   () => void
  onOpenChat: (roomID: string) => void
}

export default function Sidebar({ page, onNavigate, onLogout, onOpenChat }: Props) {
  const [collapsed, setCollapsed]   = useState(false)
  const [mode,      setModeState]   = useState<'seller' | 'buyer'>(getMode())

  const username = getUsername() || ''

  function handleModeSwitch(newMode: 'seller' | 'buyer') {
    setMode(newMode)
    setModeState(newMode)
    onNavigate('dashboard')
  }

  function handleLogout() {
    disconnectSocket()
    logout()
    onLogout()
  }

  const sellerLinks = [
    { id: 'dashboard',       icon: '📊', label: 'Dashboard'     },
    { id: 'seller-register', icon: '🏠', label: 'Register Property' },
    { id: 'my-properties',   icon: '📋', label: 'My Properties'  },
    { id: 'map',             icon: '🗺️', label: 'Map'            },
    { id: 'analytics',       icon: '📈', label: 'Analytics'      },
    { id: 'messages',        icon: '💬', label: 'Messages'        },
  ]

  const buyerLinks = [
    { id: 'dashboard',      icon: '📊', label: 'Dashboard'        },
    { id: 'buyer-register', icon: '👤', label: 'My Profile'       },
    { id: 'my-buyers',      icon: '📋', label: 'My Registrations' },
    { id: 'map',            icon: '🗺️', label: 'Map'              },
    { id: 'analytics',      icon: '📈', label: 'Analytics'        },
    { id: 'messages',       icon: '💬', label: 'Messages'          },
  ]

  const links = mode === 'seller' ? sellerLinks : buyerLinks

  return (
    <div style={{ ...s.sidebar, width: collapsed ? 60 : 240 }}>

      {/* Toggle button */}
      <button style={s.toggleBtn} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '→' : '←'}
      </button>

      {!collapsed && (
        <>
          {/* User info */}
          <div style={s.userInfo}>
            <div style={s.avatar}>{username.charAt(0).toUpperCase()}</div>
            <div>
              <p style={s.username}>{username}</p>
              <p style={s.userSub}>Member</p>
            </div>
          </div>

          {/* Mode Switch */}
          <div style={s.modeSection}>
            <p style={s.modeLabel}>MODE</p>
            <div style={s.modeToggle}>
              <button
                style={{ ...s.modeBtn, ...(mode === 'seller' ? s.modeBtnActive : {}) }}
                onClick={() => handleModeSwitch('seller')}
              >
                🏢 Seller
              </button>
              <button
                style={{ ...s.modeBtn, ...(mode === 'buyer' ? s.modeBtnActive : {}) }}
                onClick={() => handleModeSwitch('buyer')}
              >
                👤 Buyer
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={s.nav}>
            {links.map(link => (
              <button
                key={link.id}
                style={{ ...s.navLink, ...(page === link.id ? s.navLinkActive : {}) }}
                onClick={() => onNavigate(link.id)}
              >
                <span style={s.navIcon}>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Notification Bell */}
          <div style={s.notifWrap}>
            <NotificationBell onOpenChat={onOpenChat}/>
          </div>

          {/* Logout */}
          <button style={s.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </>
      )}

      {/* Collapsed — icons only */}
      {collapsed && (
        <div style={s.collapsedIcons}>
          {links.map(link => (
            <button
              key={link.id}
              style={{ ...s.iconBtn, ...(page === link.id ? s.iconBtnActive : {}) }}
              onClick={() => onNavigate(link.id)}
              title={link.label}
            >
              {link.icon}
            </button>
          ))}
          <button style={s.iconBtn} onClick={handleLogout} title="Logout">🚪</button>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  sidebar:       { background: 'var(--color-primary-dark)', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', zIndex: 200, overflowY: 'auto', overflowX: 'hidden', boxShadow: '2px 0 12px rgba(0,0,0,0.15)' },
  toggleBtn:     { alignSelf: 'flex-end', margin: 'var(--space-3) var(--space-2) var(--space-1)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer', fontSize: 13 },
  userInfo:      { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--space-4) var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  avatar:        { width: 40, height: 40, borderRadius: '50%', background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15, flexShrink: 0, boxShadow: '0 2px 8px rgba(39,174,96,0.3)' },
  username:      { fontSize: 14, fontWeight: 600, color: 'white', letterSpacing: '-0.01em' },
  userSub:       { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 },
  modeSection:   { padding: 'var(--space-4) var(--space-4) var(--space-2)' },
  modeLabel:     { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' },
  modeToggle:    { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  modeBtn:       { padding: 'var(--space-2) var(--space-3)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: 500 },
  modeBtnActive: { background: 'var(--color-success)', border: '1px solid var(--color-success)', color: 'white', fontWeight: 600, boxShadow: '0 2px 8px rgba(39,174,96,0.25)' },
  nav:           { flex: 1, padding: 'var(--space-3) var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 },
  navLink:       { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px var(--space-3)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 13, cursor: 'pointer', borderRadius: 'var(--radius-sm)', textAlign: 'left', width: '100%', fontWeight: 500 },
  navLinkActive: { background: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 600 },
  navIcon:       { fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 },
  notifWrap:     { padding: 'var(--space-2) var(--space-4)', borderTop: '1px solid rgba(255,255,255,0.08)' },
  logoutBtn:     { margin: 'var(--space-2)', padding: '10px var(--space-3)', background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 'var(--radius-sm)', color: '#ff8a7a', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: 500 },
  collapsedIcons:{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-1)', flex: 1 },
  iconBtn:       { padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 17, cursor: 'pointer', borderRadius: 'var(--radius-sm)', textAlign: 'center' },
  iconBtnActive: { background: 'rgba(255,255,255,0.12)', color: 'white' },
}