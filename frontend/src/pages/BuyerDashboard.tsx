import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { Property } from '../types'

interface AdminSettings {
  contactName:  string
  contactPhone: string
  contactEmail: string
}

export default function BuyerDashboard() {
  const [dashMode,    setDashMode]    = useState<'dashboard' | 'agent'>('dashboard')
  const [stats,       setStats]       = useState<any>(null)
  const [properties,  setProperties]  = useState<Property[]>([])
  const [search,      setSearch]      = useState('')
  const [searchType,  setSearchType]  = useState<'id' | 'city'>('city')
  const [results,     setResults]     = useState<Property[]>([])
  const [view,        setView]        = useState<'cards' | 'table'>('cards')
  const [searched,    setSearched]    = useState(false)
  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({})
  const [viewProp,    setViewProp]    = useState<Property | null>(null)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({ contactName: '', contactPhone: '', contactEmail: '' })

  const BACKEND = "https://property-registration-production.up.railway.app"

  useEffect(() => { fetchStats(); fetchProperties(); fetchAdminSettings() }, [])

  async function fetchStats() {
    const res = await apiFetch('/dashboard/buyer/stats')
    if (res) setStats(await res.json())
  }

  async function fetchProperties() {
    const res = await apiFetch('/dashboard/properties')
    if (!res) return
    const data = await res.json()
    const arr  = Array.isArray(data) ? data : []
    setProperties(arr)
    const map: Record<string, Property> = {}
    arr.forEach((p: Property) => { map[p.propertyID] = p })
    setPropertyMap(map)
  }

  async function fetchAdminSettings() {
    try {
      const res = await fetch(`${BACKEND}/admin/settings`)
      if (res.ok) {
        const data = await res.json()
        setAdminSettings({
          contactName:  data.contactName  || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
        })
      }
    } catch { /* silent fail */ }
  }

  function handleSearch() {
    if (!search.trim()) return
    setSearched(true)
    if (searchType === 'id') {
      const found = propertyMap[search.trim()]
      setResults(found ? [found] : [])
    } else {
      setResults(properties.filter(p =>
        p.geoLocation.toLowerCase().includes(search.toLowerCase()) ||
        p.neighbourhood.toLowerCase().includes(search.toLowerCase()) ||
        p.propertyName.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }

  function clearSearch() { setSearch(''); setResults([]); setSearched(false) }

  const displayList = searched ? results : properties

  return (
    <div style={s.page}>

      {/* ── Mode Toggle ── */}
      <div style={s.modeToggleWrap}>
        <button
          style={{ ...s.modeBtn, ...(dashMode === 'dashboard' ? s.modeBtnActive : {}) }}
          onClick={() => setDashMode('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          style={{ ...s.modeBtn, ...(dashMode === 'agent' ? s.modeBtnActiveAgent : {}) }}
          onClick={() => setDashMode('agent')}
        >
          🤝 Agent Mode
        </button>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* DASHBOARD MODE                             */}
      {/* ══════════════════════════════════════════ */}
      {dashMode === 'dashboard' && (
        <>
          <h2 style={s.heading}>🏠 Property Search Dashboard</h2>

          {/* Stats */}
          {stats && (
            <div style={s.statsGrid}>
              <StatCard label="Total Properties" value={stats.totalProperties} color="#2980b9"/>
              <StatCard label="Available"        value={stats.available}       color="#27ae60"/>
              <StatCard label="Verified"         value={stats.verified}        color="#8e44ad"/>
              <StatCard label="Cities"           value={stats.totalCities}     color="#f39c12"/>
            </div>
          )}

          {/* Search */}
          <div style={s.searchBox}>
            <h3 style={s.subHeading}>🔍 Find Your Property</h3>
            <div style={s.searchRow}>
              <select
                style={s.select}
                value={searchType}
                onChange={e => { setSearchType(e.target.value as 'id' | 'city'); clearSearch() }}
              >
                <option value="city">By City / Location</option>
                <option value="id">By Property ID</option>
              </select>
              <input
                style={s.input}
                placeholder={searchType === 'id' ? 'Enter Property ID e.g. PROP-2026-...' : 'Enter city, location or property name'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button style={s.btnSearch} onClick={handleSearch}>Search</button>
              {searched && <button style={s.btnClear} onClick={clearSearch}>Clear</button>}
            </div>
            {searchType === 'id'   && <p style={s.hint}>⚡ HashMap O(1) — instant lookup by Property ID</p>}
            {searchType === 'city' && <p style={s.hint}>🔎 Searches by city, location and property name</p>}
          </div>

          {searched && (
            <p style={s.resultInfo}>
              {results.length > 0 ? `✅ Found ${results.length} result(s)` : '❌ No properties found'}
            </p>
          )}

          {/* View Toggle */}
          <div style={s.viewToggle}>
            <button style={{ ...s.toggleBtn, ...(view === 'cards' ? s.toggleActive : {}) }} onClick={() => setView('cards')}>🃏 Cards</button>
            <button style={{ ...s.toggleBtn, ...(view === 'table' ? s.toggleActive : {}) }} onClick={() => setView('table')}>📋 Table</button>
          </div>

          {/* Cards */}
          {view === 'cards' && (
            <div style={s.cardsGrid}>
              {displayList.map(p => (
                <div key={p.propertyID} style={s.card} onClick={() => setViewProp(p)}>
                  {p.images?.[0] && <img src={p.images[0]} alt="thumb" style={s.cardImg}/>}
                  <div style={s.cardBody}>
                    <p style={s.cardTitle}>{p.propertyName}</p>
                    <p style={s.cardSub}>📍 {p.geoLocation}</p>
                    <p style={s.cardSub}>🛏 {p.bedroomType}</p>
                    <div style={s.lockedPrice}>
                      <span style={s.lockIcon}>🔒</span>
                      <span style={s.lockText}>Price hidden · Unlock details</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <StatusBadge status={p.status}/>
                      <span style={{ fontSize: 11 }}>{(p as any).verified === true ? '✅ Verified' : (p as any).verified === false ? '❌ Rejected' : '🟡 Pending'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {displayList.length === 0 && !searched && <p style={s.empty}>No properties available.</p>}
            </div>
          )}

          {/* Table */}
          {view === 'table' && (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>Property</th>
                    <th style={s.th}>Location</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Price</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((p, i) => (
                    <tr key={p.propertyID} style={{ background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={s.td}>{p.propertyName}</td>
                      <td style={s.td}>{p.geoLocation}</td>
                      <td style={s.td}>{p.bedroomType}</td>
                      <td style={s.td}><span style={s.tableLocked}>🔒 Hidden</span></td>
                      <td style={s.td}><StatusBadge status={p.status}/></td>
                      <td style={s.td}>
                        <button style={s.btnView} onClick={() => setViewProp(p)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayList.length === 0 && <p style={s.empty}>No properties found.</p>}
            </div>
          )}

          {/* Modal */}
          {viewProp && (
            <div style={s.overlay} onClick={() => setViewProp(null)}>
              <div style={s.modal} onClick={e => e.stopPropagation()}>
                <button style={s.close} onClick={() => setViewProp(null)}>✕</button>
                {viewProp.images?.[0] && (
                  <img src={viewProp.images[0]} alt="property" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px 12px 0 0' }}/>
                )}
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#222', marginBottom: 4 }}>{viewProp.propertyName}</p>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>📍 {viewProp.geoLocation} | {viewProp.bedroomType}</p>
                  {viewProp.qrCode && (
                    <>
                      <div style={s.qrWrap}>
                        <img src={viewProp.qrCode} alt="QR" style={{ width: 160, height: 160, display: 'block' }}/>
                      </div>
                      <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 16 }}>📱 Scan to view full property details</p>
                    </>
                  )}
                  <div style={s.ctaStack}>
                    <button style={s.ctaUnlock} onClick={() => alert('Our team will contact you shortly!')}>
                      🔒 Contact Us — Get Full Details
                    </button>
                    <button style={s.ctaTour} onClick={() => alert('Tour booked! We\'ll confirm your slot within 24 hours.')}>
                      🏠 Schedule Tour — ₹2,000
                    </button>
                  </div>
                  <p style={s.ctaNote}>Details exclusively shared with verified buyers · Tour fee adjustable against purchase price</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* AGENT MODE                                 */}
      {/* ══════════════════════════════════════════ */}
      {dashMode === 'agent' && (
        <AgentMode
          properties={properties}
          adminSettings={adminSettings}
        />
      )}
    </div>
  )
}

// ── Agent Mode Component ──────────────────────────────────────────────────────
function AgentMode({ properties, adminSettings }: { properties: Property[]; adminSettings: AdminSettings }) {
  const [current,    setCurrent]    = useState(0)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const p = properties[current]

  function toggleCompare(id: string) {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const compareList = properties.filter(pr => compareIds.includes(pr.propertyID))

  if (properties.length === 0) return (
    <div style={s.agentEmpty}>
      <p style={{ fontSize: 32 }}>🏠</p>
      <p style={{ fontSize: 15, color: '#888', marginTop: 8 }}>No properties available for Agent Mode</p>
    </div>
  )

  return (
    <div>
      <div style={s.agentHeader}>
        <h2 style={s.agentTitle}> Agent Mode</h2>
        <p style={s.agentSub}>Present properties to your client. Select up to 4 to compare.</p>
      </div>

      {/* ── Slideshow ── */}
      <div style={s.slideWrap}>

        {/* Left Arrow */}
        <button
          style={{ ...s.arrow, opacity: current === 0 ? 0.3 : 1 }}
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ‹
        </button>

        {/* Property Card */}
        <div style={s.slideCard}>

          {/* Image */}
          {p.images?.[0] && (
            <img src={p.images[0]} alt="property" style={s.slideImg}/>
          )}

          {/* Badge row */}
          <div style={s.slideBadgeRow}>
            <StatusBadge status={p.status}/>
            {(p as any).verified === true && <span style={s.verifiedBadge}>✅ Verified</span>}
            {(p as any).isNegotiable && <span style={s.negoBadge}>💬 Negotiable</span>}
          </div>

          {/* Property name & location */}
          <h3 style={s.slideName}>{p.propertyName}</h3>
          <p style={s.slideLoc}>📍 {p.neighbourhood}, {p.geoLocation}</p>

          {/* Details grid */}
          <div style={s.slideGrid}>
            <SlideDetail label="Size"    value={`${p.size} sq ft`}/>
            <SlideDetail label="Bedroom" value={p.bedroomType}/>
            <SlideDetail label="Type"    value={p.propertyType}/>
            <SlideDetail
              label="Floor"
              value={(p as any).floorNumber && (p as any).totalFloors
                ? `${(p as any).floorNumber} / ${(p as any).totalFloors}`
                : 'N/A'}
            />
            <SlideDetail
              label="Price"
              value={(p as any).isNegotiable
                ? 'Negotiable'
                : p.sqftPrice ? `₹${Number(p.sqftPrice).toLocaleString()}/sqft` : 'Contact us'}
              highlight={(p as any).isNegotiable}
            />
            {p.propertyType === 'Under Construction' && (p as any).positionDate && (
              <SlideDetail label="Position Date" value={(p as any).positionDate}/>
            )}
            {p.propertyType === 'Immediate Available' && (p as any).propertyAge && (
              <SlideDetail label="Property Age" value={`${(p as any).propertyAge} yrs`}/>
            )}
          </div>

          {/* Admin Contact */}
          <div style={s.slideContact}>
            <p style={s.slideContactTitle}>📞 Contact Agent</p>
            {adminSettings.contactName  && <p style={s.slideContactName}>{adminSettings.contactName}</p>}
            {adminSettings.contactPhone && <p style={s.slideContactDetail}>{adminSettings.contactPhone}</p>}
            {adminSettings.contactEmail && <p style={s.slideContactDetail}>{adminSettings.contactEmail}</p>}
            {!adminSettings.contactName && !adminSettings.contactPhone && !adminSettings.contactEmail && (
              <p style={{ fontSize: 12, color: '#aaa' }}>Admin contact not set — go to Admin Panel → Settings</p>
            )}
          </div>

          {/* Compare checkbox */}
          <button
            style={{
              ...s.compareBtn,
              ...(compareIds.includes(p.propertyID) ? s.compareBtnOn : s.compareBtnOff)
            }}
            onClick={() => toggleCompare(p.propertyID)}
          >
            {compareIds.includes(p.propertyID) ? '✅ Added to Compare' : '+ Add to Compare'}
          </button>
        </div>

        {/* Right Arrow */}
        <button
          style={{ ...s.arrow, opacity: current === properties.length - 1 ? 0.3 : 1 }}
          onClick={() => setCurrent(c => Math.min(properties.length - 1, c + 1))}
          disabled={current === properties.length - 1}
        >
          ›
        </button>
      </div>

      {/* Dot Navigation */}
      <div style={s.dots}>
        {properties.map((_, i) => (
          <button
            key={i}
            style={{ ...s.dot, ...(i === current ? s.dotActive : {}) }}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
      <p style={s.slideCount}>{current + 1} of {properties.length}</p>

      {/* ── Comparison Table ── */}
      {compareList.length > 0 && (
        <div style={s.compareSection}>
          <div style={s.compareHeader}>
            <h3 style={s.compareTitle}>📊 Comparing {compareList.length} {compareList.length === 1 ? 'Property' : 'Properties'}</h3>
            <button style={s.clearCompare} onClick={() => setCompareIds([])}>✕ Clear All</button>
          </div>

          <div style={s.compareTableWrap}>
            <table style={s.compareTable}>
              <thead>
                <tr>
                  <th style={s.cth}>Feature</th>
                  {compareList.map(cp => (
                    <th key={cp.propertyID} style={s.cth}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>{cp.propertyName.length > 16 ? cp.propertyName.slice(0, 16) + '…' : cp.propertyName}</span>
                        <button style={s.removeCompare} onClick={() => toggleCompare(cp.propertyID)}>✕ Remove</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '📐 Size',       key: 'size',         render: (pr: any) => `${pr.size} sq ft` },
                  { label: '🛏 Bedroom',    key: 'bedroomType',  render: (pr: any) => pr.bedroomType },
                  { label: '🏗 Type',       key: 'propertyType', render: (pr: any) => pr.propertyType === 'Under Construction' ? 'Under Const.' : 'Immediate' },
                  { label: '🏢 Floor',      key: 'floor',        render: (pr: any) => pr.floorNumber && pr.totalFloors ? `${pr.floorNumber}/${pr.totalFloors}` : '—' },
                  { label: '📍 Location',   key: 'geoLocation',  render: (pr: any) => pr.geoLocation.split(',')[0] },
                  { label: '🏘 Area',       key: 'neighbourhood',render: (pr: any) => pr.neighbourhood },
                  { label: '💰 Price',      key: 'price',        render: (pr: any) => (
                    <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                      {pr.isNegotiable && <div style={{ color: '#27ae60', fontWeight: 600 }}>Negotiable</div>}
                      {pr.boxPrice && <div>₹{Number(pr.boxPrice).toLocaleString()}</div>}
                      {pr.sqftPrice && <div style={{ color: '#888' }}>₹{Number(pr.sqftPrice).toLocaleString()}/sqft</div>}
                      {!pr.boxPrice && !pr.sqftPrice && !pr.isNegotiable && '—'}
                    </div>
                  )},
                  { label: '✅ Status',     key: 'status',       render: (pr: any) => pr.status || '—' },
                  { label: '🔵 Verified',   key: 'verified',     render: (pr: any) => pr.verified === true ? '✅ Yes' : pr.verified === false ? '❌ No' : '🟡 Pending' },
                ].map(row => (
                  <tr key={row.key} style={s.ctr}>
                    <td style={s.ctdLabel}>{row.label}</td>
                    {compareList.map(cp => (
                      <td key={cp.propertyID} style={{
                        ...s.ctd,
                        ...(row.key === 'price' && (cp as any).isNegotiable ? { color: '#27ae60', fontWeight: 600 } : {})
                      }}>
                        {row.render(cp)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Admin contact row */}
                <tr style={s.ctr}>
                  <td style={s.ctdLabel}>📞 Contact</td>
                  {compareList.map(cp => (
                    <td key={cp.propertyID} style={s.ctd}>
                      <div style={{ fontSize: 11, lineHeight: 1.6, color: '#2980b9' }}>
                        {adminSettings.contactName  || '—'}<br/>
                        {adminSettings.contactPhone || '—'}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {compareList.length === 0 && (
        <div style={s.compareHint}>
          <p>☝️ Click <b>"+ Add to Compare"</b> on any property card to start comparing. You can select up to 4.</p>
        </div>
      )}
    </div>
  )
}

function SlideDetail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: '8px 10px', background: highlight ? '#eef7f1' : '#f8f9fa', borderRadius: 6 }}>
      <p style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#27ae60' : '#222' }}>{value}</p>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: '16px 20px', borderLeft: `4px solid ${color}`, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Available' ? '#27ae60' : status === 'Sold' ? '#e74c3c' : status === 'On Hold' ? '#f39c12' : '#aaa'
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'white', background: color }}>{status || 'No Status'}</span>
}

const s: Record<string, React.CSSProperties> = {
  page:           { padding: 24, maxWidth: 1100, margin: '0 auto' },
  // Mode Toggle
  modeToggleWrap: { display: 'flex', gap: 0, marginBottom: 24, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #eee', width: 'fit-content', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
  modeBtn:        { padding: '9px 24px', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#888', transition: 'all 0.2s' },
  modeBtnActive:  { background: '#2c3e50', color: 'white', fontWeight: 700 },
  modeBtnActiveAgent: { background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', color: 'white', fontWeight: 700 },
  // Dashboard Mode
  heading:        { fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 16 },
  subHeading:     { fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 12 },
  statsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  searchBox:      { background: 'white', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  searchRow:      { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  select:         { padding: '9px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, outline: 'none', background: 'white' },
  input:          { flex: 1, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, outline: 'none', minWidth: 200 },
  btnSearch:      { padding: '9px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  btnClear:       { padding: '9px 16px', background: '#f0f0f0', color: '#555', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, cursor: 'pointer' },
  btnView:        { padding: '5px 10px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
  hint:           { fontSize: 11, color: '#2980b9', marginTop: 8 },
  resultInfo:     { fontSize: 13, color: '#555', marginBottom: 12 },
  viewToggle:     { display: 'flex', gap: 8, marginBottom: 16 },
  toggleBtn:      { padding: '7px 16px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  toggleActive:   { background: '#2980b9', color: 'white', border: '1px solid #2980b9' },
  cardsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card:           { background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #eee', cursor: 'pointer' },
  cardImg:        { width: '100%', height: 140, objectFit: 'cover' },
  cardBody:       { padding: 14 },
  cardTitle:      { fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 4 },
  cardSub:        { fontSize: 12, color: '#888', marginBottom: 2 },
  lockedPrice:    { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '5px 8px', background: '#f8f4ff', borderRadius: 4, border: '1px dashed #c9a6f5' },
  lockIcon:       { fontSize: 11 },
  lockText:       { fontSize: 11, color: '#8e44ad', fontWeight: 500 },
  tableLocked:    { fontSize: 12, color: '#8e44ad', fontWeight: 500 },
  empty:          { color: '#aaa', fontSize: 14, padding: 20, textAlign: 'center' },
  tableWrap:      { background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
  table:          { width: '100%', borderCollapse: 'collapse' },
  thead:          { background: '#2980b9' },
  th:             { padding: '12px 14px', color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left' },
  td:             { padding: '11px 14px', fontSize: 13, color: '#444', borderBottom: '1px solid #f0f0f0' },
  overlay:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:          { background: 'white', borderRadius: 12, width: '90%', maxWidth: 380, position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  close:          { position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, zIndex: 1 },
  qrWrap:         { background: '#f8f8f8', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'center', marginBottom: 8 },
  ctaStack:       { display: 'flex', flexDirection: 'column', gap: 10 },
  ctaUnlock:      { width: '100%', padding: '11px 0', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  ctaTour:        { width: '100%', padding: '11px 0', background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  ctaNote:        { fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 8 },
  // Agent Mode
  agentHeader:    { marginBottom: 20 },
  agentTitle:     { fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 4 },
  agentSub:       { fontSize: 13, color: '#888' },
  agentEmpty:     { textAlign: 'center', padding: '60px 0' },
  slideWrap:      { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  arrow:          { width: 32, height: 32, borderRadius: '50%', border: '2px solid #ddd', background: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', color: '#2c3e50', fontWeight: 700 },
  slideCard:      { flex: 1, background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #eee' },
  slideImg:       { width: '100%', height: 140, objectFit: 'cover' },
  slideBadgeRow:  { display: 'flex', gap: 4, padding: '8px 12px 0', flexWrap: 'wrap' },
  verifiedBadge:  { fontSize: 9, fontWeight: 600, color: '#27ae60' },
  negoBadge:      { padding: '2px 4px', borderRadius: 20, fontSize: 9, fontWeight: 600, color: 'white', background: '#2980b9' },
  slideName:      { fontSize: 14, fontWeight: 700, color: '#222', padding: '4px 12px 1px' },
  slideLoc:       { fontSize: 11, color: '#888', padding: '0 12px 8px' },
  slideGrid:      { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, padding: '0 12px 10px' },
  slideContact:   { background: '#f0f7ff', margin: '0 12px 10px', borderRadius: 6, padding: '8px 12px' },
  slideContactTitle: { fontSize: 11, fontWeight: 600, color: '#2980b9', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  slideContactName:  { fontSize: 15, fontWeight: 700, color: '#222', marginBottom: 4 },
  slideContactDetail:{ fontSize: 13, color: '#555', marginBottom: 2 },
  compareBtn:     { margin: '0 20px 20px', width: 'calc(100% - 40px)', padding: '10px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  compareBtnOn:   { background: '#eef7f1', color: '#27ae60', border: '1px solid #27ae60' },
  compareBtnOff:  { background: '#f8f9fa', color: '#555', border: '1px solid #ddd' },
  dots:           { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 6 },
  dot:            { width: 8, height: 8, borderRadius: '50%', border: 'none', background: '#ddd', cursor: 'pointer', padding: 0 },
  dotActive:      { background: '#2c3e50', width: 20, borderRadius: 4 },
  slideCount:     { textAlign: 'center', fontSize: 12, color: '#aaa', marginBottom: 32 },
  // Comparison Table
  compareSection: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginTop: 8 },
  compareHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  compareTitle:   { fontSize: 16, fontWeight: 700, color: '#222' },
  clearCompare:   { padding: '6px 14px', background: '#fdf3f2', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  compareTableWrap: { overflowX: 'auto' },
  compareTable:   { width: '100%', borderCollapse: 'collapse', minWidth: 500 },
  cth:            { padding: '10px 14px', background: '#2c3e50', color: 'white', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' },
  ctr:            { borderBottom: '1px solid #f0f0f0' },
  ctdLabel:       { padding: '10px 14px', fontSize: 12, color: '#888', fontWeight: 600, background: '#f8f9fa', whiteSpace: 'nowrap' },
  ctd:            { padding: '10px 14px', fontSize: 13, color: '#333' },
  removeCompare:  { fontSize: 10, color: '#e74c3c', background: 'rgba(231,76,60,0.1)', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', marginTop: 4 },
  compareHint:    { background: '#fffbf0', border: '1px dashed #f39c12', borderRadius: 8, padding: '14px 18px', marginTop: 16, fontSize: 13, color: '#888', textAlign: 'center' },
}