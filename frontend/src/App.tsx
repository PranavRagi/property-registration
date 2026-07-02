import { useState, useEffect } from 'react'
import AuthPage        from './pages/AuthPage'
import ModeSelect      from './pages/ModeSelect'
import SellerForm      from './pages/SellerForm'
import MyProperties    from './pages/MyProperties'
import PropertyDetail  from './pages/PropertyDetail'
import BuyerForm       from './pages/BuyerForm'
import MyBuyers        from './pages/MyBuyers'
import AdminLogin      from './pages/AdminLogin'
import AdminDashboard  from './pages/AdminDashboard'
import SellerDashboard from './pages/SellerDashboard'
import BuyerDashboard  from './pages/BuyerDashboard'
import Messages        from './pages/Messages'
import MapView         from './pages/MapView'
import Analytics       from './pages/Analytics'
import Sidebar         from './components/Sidebar'
import { Property, Buyer } from './types'
import { isLoggedIn, getUsername, getMode, isFirstLogin } from './utils/auth'
import { disconnectSocket } from './hooks/useSocket'

export default function App() {
  const [page,         setPage]         = useState('dashboard')
  const [loggedIn,     setLoggedIn]     = useState(isLoggedIn())
  const [firstLogin,   setFirstLogin]   = useState(isFirstLogin())
  const [editProperty, setEditProperty] = useState<Property | null>(null)
  const [editBuyer,    setEditBuyer]    = useState<Buyer | null>(null)
  const [chatRoom,     setChatRoom]     = useState<string | null>(null)
  const [mode,         setModeState]    = useState(getMode())

  // ── URL routing ──────────────────────────────────────────────────────
  const urlPath    = window.location.pathname
  const propMatch  = urlPath.match(/^\/property\/(.+)$/)
  const buyerMatch = urlPath.match(/^\/buyer\/(.+)$/)
  const isAdmin    = urlPath.startsWith('/admin')

  if (propMatch)  return <PropertyDetail id={propMatch[1]}/>
  if (buyerMatch) return <BuyerDetailPage id={buyerMatch[1]}/>

  // ── Admin route ──────────────────────────────────────────────────────
  if (isAdmin) {
    const adminLoggedIn = isLoggedIn() && localStorage.getItem('role') === 'admin'
    if (!adminLoggedIn) return <AdminLogin onLogin={() => window.location.reload()}/>
    return <AdminDashboard/>
  }

  // ── Not logged in ────────────────────────────────────────────────────
  if (!loggedIn) {
    return <AuthPage onLogin={() => { setLoggedIn(true); setFirstLogin(isFirstLogin()) }}/>
  }

  // ── First login — pick mode ──────────────────────────────────────────
  if (firstLogin) {
    return (
      <ModeSelect
        username={getUsername() || ''}
        onSelect={(m) => { setModeState(m); setFirstLogin(false) }}
      />
    )
  }

  const currentMode = getMode()

  function handleEditProperty(property: Property) { setEditProperty(property); setPage('seller-register') }
  function handleEditBuyer(buyer: Buyer)           { setEditBuyer(buyer);      setPage('buyer-register') }
  function handleNavigate(p: string) { setPage(p); setEditProperty(null); setEditBuyer(null) }
  function handleLogout()            { setLoggedIn(false); setModeState('buyer') }
  function openChatFromNotif(roomID: string) { setChatRoom(roomID); setPage('messages') }

  return (
    <div className="app-shell">

      {/* Sidebar */}
      <Sidebar
        page={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenChat={openChatFromNotif}
      />

      {/* Main content */}
      <div className="app-main">

        {/* Top bar */}
        <div style={s.topBar}>
          <span style={s.topTitle}>🏠 Property Registration</span>
          <span style={s.topUser}>👤 {getUsername()}</span>
        </div>

        {/* Pages */}
        <div className="page-content" style={s.pageContent}>
          {page === 'dashboard'       && currentMode === 'seller' && <SellerDashboard/>}
          {page === 'dashboard'       && currentMode === 'buyer'  && <BuyerDashboard/>}
          {page === 'seller-register' && <SellerForm   editProperty={editProperty} onSaved={() => { setEditProperty(null); setPage('my-properties') }}/>}
          {page === 'my-properties'   && <MyProperties onEdit={handleEditProperty} onNavigate={setPage}/>}
          {page === 'buyer-register'  && <BuyerForm    editBuyer={editBuyer}       onSaved={() => { setEditBuyer(null); setPage('my-buyers') }}/>}
          {page === 'my-buyers'       && <MyBuyers     onEdit={handleEditBuyer}    onNavigate={setPage}/>}
          {page === 'messages'        && <Messages initialRoom={chatRoom} onRoomOpened={() => setChatRoom(null)}/>}
          {page === 'map'             && <MapView/>}
          {page === 'analytics'       && <Analytics/>}
        </div>
      </div>
    </div>
  )
}

// ── Buyer Detail Page ─────────────────────────────────────────────────────────
function BuyerDetailPage({ id }: { id: string }) {
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
    const BACKEND = "https://property-registration-production.up.railway.app"
    fetch(`${BACKEND}/buyer/${id}`)
      .then(r => r.json())
      .then(d => d.error ? setError(d.error) : setBuyer(d))
      .catch(() => setError('Could not load buyer.'))
  }, [id])

  if (error)  return (
    <div style={s.standaloneCenter}>
      <div style={s.errorBox}>❌ {error}</div>
    </div>
  )
  if (!buyer) return (
    <div style={s.standaloneCenter}>
      <div style={s.loadingBox}>
        <div style={s.spinner}/>
        <p style={s.loadingText}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={s.standalonePage}>
      <div style={s.detailCard}>
        <div style={s.detailAvatar}>
          {buyer.fullName.charAt(0).toUpperCase()}
        </div>
        <h1 style={s.detailName}>{buyer.fullName}</h1>
        <p style={s.detailId}>{buyer.buyerID}</p>
        <div style={s.detailGrid}>
          {[['Mobile', buyer.mobile], ['Email', buyer.email], ['City', buyer.preferredCity],
            ['Type', buyer.preferredType],
            ['Budget Min', `₹${Number(buyer.budgetMin).toLocaleString()}`],
            ['Budget Max', `₹${Number(buyer.budgetMax).toLocaleString()}`]
          ].map(([l, v]) => (
            <div key={l} style={s.detailRow}>
              <p style={s.detailLabel}>{l}</p>
              <p style={s.detailValue}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  topBar:        { background: 'var(--color-surface)', padding: 'var(--space-3) var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)' },
  topTitle:      { fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' },
  topUser:       { fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 },
  pageContent:   { padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto' },
  standaloneCenter: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)', padding: 'var(--space-6)' },
  standalonePage:   { minHeight: '100vh', background: 'var(--color-bg)', padding: 'var(--space-6)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  errorBox:      { padding: 'var(--space-4) var(--space-5)', background: 'var(--color-danger-bg)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', fontSize: 14, fontWeight: 500 },
  loadingBox:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' },
  spinner:       { width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText:   { fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 },
  detailCard:    { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8) var(--space-6)', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  detailAvatar:  { width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, margin: '0 auto var(--space-4)' },
  detailName:    { fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 'var(--space-1)', color: 'var(--color-text)', letterSpacing: '-0.02em' },
  detailId:      { fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 'var(--space-5)', fontFamily: 'monospace' },
  detailGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-1)' },
  detailRow:     { padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' },
  detailLabel:   { fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 },
  detailValue:   { fontSize: 14, fontWeight: 500, color: 'var(--color-text)' },
}
