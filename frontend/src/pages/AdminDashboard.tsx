import { useState, useEffect } from 'react'
import { getToken, logout } from '../utils/auth'

type Tab = 'overview' | 'properties' | 'buyers' | 'users'

async function adminFetch(url: string, options: RequestInit = {}) {
  const token = getToken()
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  })
}

export default function AdminDashboard() {
  const [tab,        setTab]        = useState<Tab>('overview')
  const [stats,      setStats]      = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [buyers,     setBuyers]     = useState<any[]>([])
  const [users,      setUsers]      = useState<any[]>([])

  useEffect(() => { fetchStats(); fetchAll() }, [])

  async function fetchStats() {
    try {
      const res = await adminFetch('/admin/stats')
      if (res.ok) setStats(await res.json())
    } catch (err) { console.error('Stats error:', err) }
  }

  async function fetchAll() {
    try {
      const [pRes, bRes, uRes] = await Promise.all([
        adminFetch('/admin/properties'),
        adminFetch('/admin/buyers'),
        adminFetch('/admin/users'),        // ← unified users
      ])
      if (pRes.ok) setProperties(await pRes.json())
      if (bRes.ok) setBuyers(await bRes.json())
      if (uRes.ok) setUsers(await uRes.json())
    } catch (err) { console.error('fetchAll error:', err) }
  }

  async function approveProperty(id: string) {
    const res = await adminFetch(`/admin/property/${id}/approve`, { method: 'PATCH' })
    if (res.ok) { alert('✅ Property approved!'); fetchAll(); fetchStats() }
  }

  async function rejectProperty(id: string) {
    const res = await adminFetch(`/admin/property/${id}/reject`, { method: 'PATCH' })
    if (res.ok) { alert('❌ Property rejected!'); fetchAll(); fetchStats() }
  }

  async function deleteProperty(id: string) {
    if (!window.confirm('Delete this property?')) return
    const res = await adminFetch(`/admin/property/${id}`, { method: 'DELETE' })
    if (res.ok) { alert('🗑️ Deleted!'); fetchAll(); fetchStats() }
  }

  async function deactivateBuyer(id: string) {
    const res = await adminFetch(`/admin/buyer/${id}/deactivate`, { method: 'PATCH' })
    if (res.ok) { alert('🔒 Buyer deactivated!'); fetchAll() }
  }

  async function deactivateUser(id: string) {
    const res = await adminFetch(`/admin/user/${id}/deactivate`, { method: 'PATCH' })
    if (res.ok) { alert('🔒 User deactivated!'); fetchAll() }
  }

  async function reactivateUser(id: string) {
    const res = await adminFetch(`/admin/user/${id}/reactivate`, { method: 'PATCH' })
    if (res.ok) { alert('✅ User reactivated!'); fetchAll() }
  }

  function handleLogout() { logout(); window.location.href = '/admin' }

  const verifiedBadge = (v: any) =>
    v === true  ? <span style={{ ...s.badge, background: '#27ae60' }}>✅ Verified</span> :
    v === false ? <span style={{ ...s.badge, background: '#e74c3c' }}>❌ Rejected</span> :
                  <span style={{ ...s.badge, background: '#f39c12' }}>🟡 Pending</span>

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.brand}>🔐 Admin Panel</span>
        <div style={s.navLinks}>
          {(['overview','properties','buyers','users'] as Tab[]).map(t => (
            <button key={t} style={{ ...s.navBtn, ...(tab === t ? s.navActive : {}) }} onClick={() => setTab(t)}>
              {t === 'users' ? '👥 Users' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button style={s.btnLogout} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.content}>

        {/* ── Overview ── */}
        {tab === 'overview' && stats && (
          <div>
            <h2 style={s.heading}>📊 Overview</h2>
            <div style={s.statsGrid}>
              <StatCard label="Total Users"       value={stats.totalUsers       ?? stats.totalSellers ?? 0} color="#8e44ad"/>
              <StatCard label="Total Properties"  value={stats.totalProperties  ?? 0} color="#2980b9"/>
              <StatCard label="Buyer Profiles"    value={stats.totalBuyers      ?? 0} color="#27ae60"/>
              <StatCard label="Pending"           value={stats.pending          ?? 0} color="#f39c12"/>
              <StatCard label="Verified"          value={stats.verified         ?? 0} color="#27ae60"/>
              <StatCard label="Rejected"          value={stats.rejected         ?? 0} color="#e74c3c"/>
            </div>
          </div>
        )}

        {/* ── Properties ── */}
        {tab === 'properties' && (
          <div>
            <h2 style={s.heading}>🏠 All Properties ({properties.length})</h2>
            {properties.length === 0 && <p style={s.empty}>No properties registered yet.</p>}
            {properties.map(p => (
              <div key={p.propertyID} style={s.item}>
                <div style={s.itemLeft}>
                  {p.images?.[0] && <img src={p.images[0]} alt="" style={s.thumb}/>}
                  <div>
                    <p style={s.name}>{p.propertyName}</p>
                    <p style={s.sub}>{p.geoLocation} | {p.bedroomType} | {p.ownerUsername || 'Unknown'}</p>
                    <p style={s.id}>{p.propertyID}</p>
                    <div style={{ marginTop: 4 }}>{verifiedBadge(p.verified)}</div>
                  </div>
                </div>
                <div style={s.actions}>
                  <button style={{ ...s.btn2, background: '#27ae60' }} onClick={() => approveProperty(p.propertyID)}>✅ Approve</button>
                  <button style={{ ...s.btn2, background: '#f39c12' }} onClick={() => rejectProperty(p.propertyID)}>❌ Reject</button>
                  <button style={{ ...s.btn2, background: '#e74c3c' }} onClick={() => deleteProperty(p.propertyID)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Buyers (registrations) ── */}
        {tab === 'buyers' && (
          <div>
            <h2 style={s.heading}>👤 Buyer Registrations ({buyers.length})</h2>
            {buyers.length === 0 && <p style={s.empty}>No buyer registrations yet.</p>}
            {buyers.map(b => (
              <div key={b.buyerID} style={s.item}>
                <div style={s.itemLeft}>
                  <div style={s.avatar}>{b.fullName?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.name}>{b.fullName}</p>
                    <p style={s.sub}>{b.email} | {b.preferredCity} | {b.preferredType}</p>
                    <p style={s.sub}>Budget: ₹{Number(b.budgetMin).toLocaleString()} – ₹{Number(b.budgetMax).toLocaleString()}</p>
                    <p style={s.id}>{b.buyerID}</p>
                    {b.active === false && <span style={{ ...s.badge, background: '#e74c3c' }}>🔒 Deactivated</span>}
                  </div>
                </div>
                <div style={s.actions}>
                  <button style={{ ...s.btn2, background: '#e74c3c' }} onClick={() => deactivateBuyer(b.buyerID)}>🔒 Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Users (unified accounts) ── */}
        {tab === 'users' && (
          <div>
            <h2 style={s.heading}>👥 All Users ({users.length})</h2>
            <p style={s.subNote}>All registered accounts — can switch between Buyer and Seller mode</p>
            {users.length === 0 && <p style={s.empty}>No users registered yet.</p>}
            {users.map(u => (
              <div key={u.id} style={s.item}>
                <div style={s.itemLeft}>
                  <div style={{ ...s.avatar, background: '#8e44ad' }}>{u.username?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.name}>{u.username}</p>
                    <p style={s.sub}>{u.email}</p>
                    <p style={s.id}>{u.id}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {u.migratedFrom?.includes('seller') && <span style={{ ...s.badge, background: '#2980b9' }}>🏢 Seller</span>}
                      {u.migratedFrom?.includes('buyer')  && <span style={{ ...s.badge, background: '#27ae60' }}>👤 Buyer</span>}
                      {!u.migratedFrom?.length            && <span style={{ ...s.badge, background: '#8e44ad' }}>🔄 Seller & Buyer</span>}
                      {u.active === false && <span style={{ ...s.badge, background: '#e74c3c' }}>🔒 Deactivated</span>}
                    </div>
                  </div>
                </div>
                <div style={s.actions}>
                  {u.active === false
                    ? <button style={{ ...s.btn2, background: '#27ae60' }} onClick={() => reactivateUser(u.id)}>✅ Reactivate</button>
                    : <button style={{ ...s.btn2, background: '#e74c3c' }} onClick={() => deactivateUser(u.id)}>🔒 Deactivate</button>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: '20px 24px', borderLeft: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', background: '#f0f4f8' },
  nav:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', background: '#1a252f', color: 'white', position: 'sticky', top: 0, zIndex: 100 },
  brand:     { fontSize: 18, fontWeight: 700, color: 'white' },
  navLinks:  { display: 'flex', gap: 8, alignItems: 'center' },
  navBtn:    { padding: '7px 14px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  navActive: { background: 'white', color: '#1a252f', fontWeight: 700 },
  btnLogout: { padding: '7px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  content:   { maxWidth: 900, margin: '0 auto', padding: 24 },
  heading:   { fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 4 },
  subNote:   { fontSize: 12, color: '#888', marginBottom: 16 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 },
  item:      { background: 'white', borderRadius: 8, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  itemLeft:  { display: 'flex', gap: 12, alignItems: 'center' },
  thumb:     { width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee', flexShrink: 0 },
  avatar:    { width: 40, height: 40, borderRadius: '50%', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  name:      { fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 2 },
  sub:       { fontSize: 12, color: '#888', marginBottom: 2 },
  id:        { fontSize: 11, color: '#bbb' },
  actions:   { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btn2:      { padding: '6px 12px', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  badge:     { padding: '2px 8px', borderRadius: 20, fontSize: 11, color: 'white', fontWeight: 600 },
  empty:     { color: '#aaa', fontSize: 14, textAlign: 'center', padding: '40px 0' },
}