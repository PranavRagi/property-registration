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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Sidebar */}
      <Sidebar
        page={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenChat={openChatFromNotif}
      />

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, minHeight: '100vh', transition: 'margin 0.3s ease' }}>

        {/* Top bar */}
        <div style={s.topBar}>
          <span style={s.topTitle}>🏠 Property Registration</span>
          <span style={s.topUser}>👤 {getUsername()}</span>
        </div>

        {/* Pages */}
        <div>
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
    const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
    fetch(`${BACKEND}/buyer/${id}`)
      .then(r => r.json())
      .then(d => d.error ? setError(d.error) : setBuyer(d))
      .catch(() => setError('Could not load buyer.'))
  }, [id])

  if (error)  return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}><p style={{ color:'#c0392b' }}>❌ {error}</p></div>
  if (!buyer) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}><p>Loading...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', padding:24, display:'flex', justifyContent:'center', alignItems:'center' }}>
      <div style={{ background:'white', borderRadius:8, padding:28, width:'100%', maxWidth:480, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#2c3e50', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, margin:'0 auto 16px' }}>
          {buyer.fullName.charAt(0).toUpperCase()}
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, textAlign:'center', marginBottom:4 }}>{buyer.fullName}</h1>
        <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginBottom:20 }}>{buyer.buyerID}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          {[['Mobile', buyer.mobile], ['Email', buyer.email], ['City', buyer.preferredCity],
            ['Type', buyer.preferredType],
            ['Budget Min', `₹${Number(buyer.budgetMin).toLocaleString()}`],
            ['Budget Max', `₹${Number(buyer.budgetMax).toLocaleString()}`]
          ].map(([l, v]) => (
            <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f0f0f0' }}>
              <p style={{ fontSize:11, color:'#aaa' }}>{l}</p>
              <p style={{ fontSize:13, fontWeight:500 }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  topBar:   { background: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 },
  topTitle: { fontSize: 16, fontWeight: 700, color: '#222' },
  topUser:  { fontSize: 13, color: '#888' },
}