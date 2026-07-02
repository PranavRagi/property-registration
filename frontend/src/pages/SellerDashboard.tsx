import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { Property } from '../types'

export default function SellerDashboard() {
  const [stats,      setStats]      = useState<any>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [search,     setSearch]     = useState('')
  const [searchType, setSearchType] = useState<'id' | 'city'>('id')
  const [results,    setResults]    = useState<Property[]>([])
  const [view,       setView]       = useState<'cards' | 'table'>('cards')
  const [searched,   setSearched]   = useState(false)

  // ── HashMap for O(1) lookup ──────────────────────────────────────────
  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({})
  const BACKEND = "https://property-registration-production.up.railway.app"

  useEffect(() => {
    fetchStats()
    fetchProperties()
  }, [])

  async function fetchStats() {
    const res = await apiFetch('/dashboard/seller/stats')
    if (res) setStats(await res.json())
  }

  async function fetchProperties() {
    const res = await apiFetch('/my-properties')
    if (!res) return
    const data = await res.json()
    const arr  = Array.isArray(data) ? data : []
    setProperties(arr)

    // Build HashMap — O(1) lookup by propertyID
    const map: Record<string, Property> = {}
    arr.forEach((p: Property) => { map[p.propertyID] = p })
    setPropertyMap(map)
  }

  // ── Search logic ─────────────────────────────────────────────────────
  function handleSearch() {
    if (!search.trim()) return
    setSearched(true)

    if (searchType === 'id') {
      // HashMap O(1) lookup
      const found = propertyMap[search.trim()]
      setResults(found ? [found] : [])
    } else {
      // City filter O(n)
      const found = properties.filter(p =>
        p.geoLocation.toLowerCase().includes(search.toLowerCase()) ||
        p.neighbourhood.toLowerCase().includes(search.toLowerCase())
      )
      setResults(found)
    }
  }

  function clearSearch() {
    setSearch('')
    setResults([])
    setSearched(false)
  }

  const displayList = searched ? results : properties

  return (
    <div style={s.page}>
      {/* Stats */}
      <h2 style={s.heading}>📊 My Dashboard</h2>
      {stats && (
        <div style={s.statsGrid}>
          <StatCard label="Total Properties" value={stats.total}     color="#2980b9"/>
          <StatCard label="Available"        value={stats.available} color="#27ae60"/>
          <StatCard label="Sold"             value={stats.sold}      color="#e74c3c"/>
          <StatCard label="On Hold"          value={stats.onHold}    color="#f39c12"/>
          <StatCard label="Verified"         value={stats.verified}  color="#8e44ad"/>
          <StatCard label="Pending"          value={stats.pending}   color="#7f8c8d"/>
        </div>
      )}

      {/* Search Bar */}
      <div style={s.searchBox}>
        <h3 style={s.subHeading}>🔍 Search Properties</h3>
        <div style={s.searchRow}>
          <select
            style={s.select}
            value={searchType}
            onChange={e => { setSearchType(e.target.value as 'id' | 'city'); clearSearch() }}
          >
            <option value="id">By Property ID</option>
            <option value="city">By City</option>
          </select>
          <input
            style={s.input}
            placeholder={searchType === 'id' ? 'Enter Property ID e.g. PROP-2026-...' : 'Enter city or location'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button style={s.btnSearch} onClick={handleSearch}>Search</button>
          {searched && <button style={s.btnClear} onClick={clearSearch}>Clear</button>}
        </div>
        {searchType === 'id' && (
          <p style={s.hint}>⚡ HashMap O(1) — instant lookup by Property ID</p>
        )}
      </div>

      {/* Results Info */}
      {searched && (
        <p style={s.resultInfo}>
          {results.length > 0 ? `✅ Found ${results.length} result(s)` : '❌ No results found'}
        </p>
      )}

      {/* View Toggle */}
      <div style={s.viewToggle}>
        <button style={{ ...s.toggleBtn, ...(view === 'cards' ? s.toggleActive : {}) }} onClick={() => setView('cards')}>🃏 Cards</button>
        <button style={{ ...s.toggleBtn, ...(view === 'table' ? s.toggleActive : {}) }} onClick={() => setView('table')}>📋 Table</button>
      </div>

      {/* Cards View */}
      {view === 'cards' && (
        <div style={s.cardsGrid}>
          {displayList.map(p => <PropertyCard key={p.propertyID} property={p}/>)}
          {displayList.length === 0 && !searched && <p style={s.empty}>No properties registered yet.</p>}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Property Name</th>
                <th style={s.th}>Location</th>
                <th style={s.th}>Type</th>
                <th style={s.th}>Sqft Price</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((p, i) => (
                <tr key={p.propertyID} style={{ background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={s.td}>{p.propertyName}</td>
                  <td style={s.td}>{p.geoLocation}</td>
                  <td style={s.td}>{p.bedroomType}</td>
                  <td style={s.td}>₹{Number(p.sqftPrice).toLocaleString()}/sqft</td>
                  <td style={s.td}><StatusBadge status={p.status}/></td>
                  <td style={s.td}>{p.verified === true ? '✅' : p.verified === false ? '❌' : '🟡'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayList.length === 0 && <p style={s.empty}>No properties found.</p>}
        </div>
      )}
    </div>
  )
}

function PropertyCard({ property: p }: { property: Property }) {
  return (
    <div style={s.card}>
      {p.images?.[0] && <img src={p.images[0]} alt="thumb" style={s.cardImg}/>}
      <div style={s.cardBody}>
        <p style={s.cardTitle}>{p.propertyName}</p>
        <p style={s.cardSub}>📍 {p.geoLocation}</p>
        <p style={s.cardSub}>🛏 {p.bedroomType} | ₹{Number(p.sqftPrice).toLocaleString()}/sqft</p>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={p.status}/>
          <span style={{ fontSize: 11 }}>{p.verified === true ? '✅ Verified' : p.verified === false ? '❌ Rejected' : '🟡 Pending'}</span>
        </div>
        <p style={s.cardID}>{p.propertyID}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4) var(--space-5)', borderLeft: `4px solid ${color}`, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', borderLeftWidth: 4 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Available' ? '#27ae60' : status === 'Sold' ? '#e74c3c' : status === 'On Hold' ? '#f39c12' : '#aaa'
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'white', background: color }}>{status || 'No Status'}</span>
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: 0, maxWidth: 1100, margin: '0 auto' },
  heading:     { fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' },
  subHeading:  { fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' },
  searchBox:   { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' },
  searchRow:   { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' },
  select:      { padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', background: 'var(--color-surface)' },
  input:       { flex: 1, padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', minWidth: 200 },
  btnSearch:   { padding: '10px var(--space-5)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  btnClear:    { padding: '10px var(--space-4)', background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  hint:        { fontSize: 12, color: 'var(--color-accent)', marginTop: 'var(--space-2)' },
  resultInfo:  { fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', fontWeight: 500 },
  viewToggle:  { display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' },
  toggleBtn:   { padding: '8px var(--space-4)', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-secondary)' },
  toggleActive:{ background: 'var(--color-primary)', color: 'white', border: '1px solid var(--color-primary)', fontWeight: 600 },
  cardsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' },
  card:        { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', transition: 'box-shadow var(--transition)' },
  cardImg:     { width: '100%', height: 140, objectFit: 'cover' },
  cardBody:    { padding: 'var(--space-3) var(--space-4)' },
  cardTitle:   { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' },
  cardSub:     { fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 },
  cardID:      { fontSize: 10, color: 'var(--color-text-placeholder)', marginTop: 'var(--space-2)', fontFamily: 'monospace' },
  empty:       { color: 'var(--color-text-muted)', fontSize: 14, padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' },
  tableWrap:   { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: 'var(--color-primary)' },
  th:          { padding: 'var(--space-3) var(--space-4)', color: 'white', fontSize: 12, fontWeight: 600, textAlign: 'left', letterSpacing: '0.02em', textTransform: 'uppercase' },
  td:          { padding: '11px var(--space-4)', fontSize: 13, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' },
}
