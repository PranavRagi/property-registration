import { useState, useEffect } from 'react'
import { getToken, logout } from '../utils/auth'

type Tab = 'overview' | 'properties' | 'buyers' | 'users' | 'settings'

const BACKEND = "https://property-registration-production.up.railway.app"

async function adminFetch(url: string, options: RequestInit = {}) {
  const token = getToken()
  return fetch(`${BACKEND}${url}`, {
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

  // Settings state
  const [settings,      setSettings]      = useState({ contactName: '', contactPhone: '', contactEmail: '' })
  const [settingsMsg,   setSettingsMsg]   = useState('')
  const [settingsOk,    setSettingsOk]    = useState<boolean | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => { fetchStats(); fetchAll(); fetchSettings() }, [])

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
        adminFetch('/admin/users'),
      ])
      if (pRes.ok) setProperties(await pRes.json())
      if (bRes.ok) setBuyers(await bRes.json())
      if (uRes.ok) setUsers(await uRes.json())
    } catch (err) { console.error('fetchAll error:', err) }
  }

  async function fetchSettings() {
    try {
      const res = await fetch(`${BACKEND}/admin/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings({
          contactName:  data.contactName  || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
        })
      }
    } catch (err) { console.error('fetchSettings error:', err) }
  }

  async function saveSettings() {
    setSettingsLoading(true)
    setSettingsMsg('')
    try {
      const res  = await adminFetch('/admin/settings', {
        method: 'POST',
        body:   JSON.stringify(settings)
      })
      const data = await res.json()
      setSettingsOk(data.success)
      setSettingsMsg(data.message)
    } catch {
      setSettingsOk(false)
      setSettingsMsg('Could not save settings.')
    } finally {
      setSettingsLoading(false)
    }
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
          {(['overview','properties','buyers','users','settings'] as Tab[]).map(t => (
            <button key={t} style={{ ...s.navBtn, ...(tab === t ? s.navActive : {}) }} onClick={() => setTab(t)}>
              {t === 'overview'    ? '📊 Overview'    :
               t === 'properties' ? '🏠 Properties'  :
               t === 'buyers'     ? '👤 Buyers'      :
               t === 'users'      ? '👥 Users'       :
                                    '⚙️ Settings'    }
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
                    {p.floorNumber && <p style={s.sub}>Floor {p.floorNumber}/{p.totalFloors}</p>}
                    <p style={s.id}>{p.propertyID}</p>
                    <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {verifiedBadge(p.verified)}
                      {p.isNegotiable && <span style={{ ...s.badge, background: '#2980b9' }}>💬 Negotiable</span>}
                    </div>
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

        {/* ── Buyers ── */}
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

        {/* ── Users ── */}
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

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <div>
            <h2 style={s.heading}>⚙️ Admin Settings</h2>
            <p style={s.subNote}>
              These contact details will be shown to buyers in Agent Mode instead of the seller's details.
            </p>

            <div style={s.settingsCard}>
              <h3 style={s.settingsSection}>📞 Agent Contact Details</h3>

              <div style={s.settingsField}>
                <label style={s.settingsLabel}>Contact Name</label>
                <input
                  style={s.settingsInput}
                  placeholder="e.g. Pranav — Property Registration"
                  value={settings.contactName}
                  onChange={e => setSettings(p => ({ ...p, contactName: e.target.value }))}
                />
              </div>

              <div style={s.settingsField}>
                <label style={s.settingsLabel}>Contact Phone</label>
                <input
                  style={s.settingsInput}
                  placeholder="e.g. +91 9876543210"
                  value={settings.contactPhone}
                  onChange={e => setSettings(p => ({ ...p, contactPhone: e.target.value }))}
                />
              </div>

              <div style={s.settingsField}>
                <label style={s.settingsLabel}>Contact Email</label>
                <input
                  style={s.settingsInput}
                  type="email"
                  placeholder="e.g. contact@propertyregistration.in"
                  value={settings.contactEmail}
                  onChange={e => setSettings(p => ({ ...p, contactEmail: e.target.value }))}
                />
              </div>

              {settingsMsg && (
                <div style={{
                  ...s.settingsMsg,
                  background: settingsOk ? '#eef7f1' : '#fdf3f2',
                  color:      settingsOk ? '#27ae60' : '#c0392b',
                  border:     `1px solid ${settingsOk ? '#27ae60' : '#e74c3c'}`
                }}>
                  {settingsMsg}
                </div>
              )}

              <button
                style={s.settingsSaveBtn}
                onClick={saveSettings}
                disabled={settingsLoading}
              >
                {settingsLoading ? 'Saving...' : '💾 Save Settings'}
              </button>
            </div>

            {/* Preview */}
            {(settings.contactName || settings.contactPhone || settings.contactEmail) && (
              <div style={s.settingsPreview}>
                <p style={s.settingsPreviewTitle}>👁️ Preview — How buyers will see it in Agent Mode</p>
                <div style={s.previewCard}>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📞 Agent Contact</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#222', marginBottom: 4 }}>{settings.contactName || '—'}</p>
                  <p style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>{settings.contactPhone || '—'}</p>
                  <p style={{ fontSize: 13, color: '#2980b9' }}>{settings.contactEmail || '—'}</p>
                </div>
              </div>
            )}
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
  page:              { minHeight: '100vh', background: 'var(--color-bg)' },
  nav:               { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-6)', background: 'var(--color-primary-dark)', color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-md)' },
  brand:             { fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' },
  navLinks:          { display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' },
  navBtn:            { padding: '8px var(--space-3)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  navActive:         { background: 'var(--color-surface)', color: 'var(--color-primary-dark)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  btnLogout:         { padding: '8px var(--space-3)', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  content:           { maxWidth: 900, margin: '0 auto', padding: 'var(--space-6)' },
  heading:           { fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' },
  subNote:           { fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' },
  statsGrid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' },
  item:              { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' },
  itemLeft:          { display: 'flex', gap: 'var(--space-3)', alignItems: 'center' },
  thumb:             { width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', flexShrink: 0 },
  avatar:            { width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  name:              { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 },
  sub:               { fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 },
  id:                { fontSize: 11, color: 'var(--color-text-placeholder)', fontFamily: 'monospace' },
  actions:           { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btn2:              { padding: '6px var(--space-3)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  badge:             { padding: '2px var(--space-2)', borderRadius: 20, fontSize: 11, color: 'white', fontWeight: 600 },
  empty:             { color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', padding: 'var(--space-8) 0', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' },
  settingsCard:      { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-5)', border: '1px solid var(--color-border)' },
  settingsSection:   { fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' },
  settingsField:     { marginBottom: 'var(--space-4)' },
  settingsLabel:     { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' },
  settingsInput:     { width: '100%', padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--color-surface)' },
  settingsMsg:       { padding: '10px var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)', textAlign: 'center', fontWeight: 500 },
  settingsSaveBtn:   { padding: '11px var(--space-6)', background: 'var(--color-primary-dark)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' },
  settingsPreview:   { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5) var(--space-6)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' },
  settingsPreviewTitle: { fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' },
  previewCard:       { background: '#f0f7ff', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', display: 'inline-block', minWidth: 240, border: '1px solid rgba(41,128,185,0.15)' },
}