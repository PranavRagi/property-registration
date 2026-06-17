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
  sidebar:       { background: '#1a252f', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', zIndex: 200, overflowY: 'auto', overflowX: 'hidden' },
  toggleBtn:     { alignSelf: 'flex-end', margin: '12px 8px 4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  userInfo:      { display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  avatar:        { width: 38, height: 38, borderRadius: '50%', background: '#27ae60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  username:      { fontSize: 14, fontWeight: 600, color: 'white' },
  userSub:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  modeSection:   { padding: '16px 16px 8px' },
  modeLabel:     { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 8 },
  modeToggle:    { display: 'flex', flexDirection: 'column', gap: 4 },
  modeBtn:       { padding: '8px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', textAlign: 'left' },
  modeBtnActive: { background: '#27ae60', border: '1px solid #27ae60', color: 'white', fontWeight: 600 },
  nav:           { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navLink:       { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left', width: '100%' },
  navLinkActive: { background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 },
  navIcon:       { fontSize: 16, width: 20, textAlign: 'center' },
  notifWrap:     { padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn:     { margin: '8px', padding: '10px 12px', background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 6, color: '#e74c3c', fontSize: 13, cursor: 'pointer', textAlign: 'left' },
  collapsedIcons:{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 4px', flex: 1 },
  iconBtn:       { padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', borderRadius: 6, textAlign: 'center' },
  iconBtnActive: { background: 'rgba(255,255,255,0.15)', color: 'white' },
}