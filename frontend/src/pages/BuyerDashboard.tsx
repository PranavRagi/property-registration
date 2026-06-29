import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { Property } from '../types'

export default function BuyerDashboard() {
  const [stats,       setStats]       = useState<any>(null)
  const [properties,  setProperties]  = useState<Property[]>([])
  const [search,      setSearch]      = useState('')
  const [searchType,  setSearchType]  = useState<'id' | 'city'>('city')
  const [results,     setResults]     = useState<Property[]>([])
  const [view,        setView]        = useState<'cards' | 'table'>('cards')
  const [searched,    setSearched]    = useState(false)
  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({})
  const [viewProp,    setViewProp]    = useState<Property | null>(null)

  useEffect(() => { fetchStats(); fetchProperties() }, [])
  const BACKEND = "https://property-registration-production.up.railway.app"
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

      {/* Result Info */}
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
                {/* Price hidden — unlock via CTA */}
                <div style={s.lockedPrice}>
                  <span style={s.lockIcon}>🔒</span>
                  <span style={s.lockText}>Price hidden · Unlock details</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <StatusBadge status={p.status}/>
                  <span style={{ fontSize: 11 }}>{p.verified === true ? '✅ Verified' : p.verified === false ? '❌ Rejected' : '🟡 Pending'}</span>
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
                  <td style={s.td}>
                    <span style={s.tableLocked}>🔒 Hidden</span>
                  </td>
                  <td style={s.td}><StatusBadge status={p.status}/></td>
                  <td style={s.td}>
                    <button style={s.btnView} onClick={() => setViewProp(p)}>View Details</button>
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
              <img
                src={viewProp.images[0]}
                alt="property"
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
              />
            )}

            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#222', marginBottom: 4 }}>
                {viewProp.propertyName}
              </p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                📍 {viewProp.geoLocation} | {viewProp.bedroomType}
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <StatusBadge status={viewProp.status}/>
                {viewProp.verified === true && <span style={{ fontSize: 11 }}>✅ Verified</span>}
              </div>

              {/* QR Code */}
              {viewProp.qrCode && (
                <>
                  <div style={s.qrWrap}>
                    <img src={viewProp.qrCode} alt="QR" style={{ width: 160, height: 160, display: 'block' }}/>
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 16 }}>
                    📱 Scan to view full property details
                  </p>
                </>
              )}

              {/* CTA Buttons */}
              <div style={s.ctaStack}>
                <button style={s.ctaUnlock} onClick={() => alert('Our team will contact you shortly!')}>
                  🔒 Unlock Details — Contact Us
                </button>
                <button style={s.ctaTour} onClick={() => alert('Tour booked! We\'ll confirm your slot within 24 hours.')}>
                  🏠 Schedule Tour — ₹2,000
                </button>
              </div>
              <p style={s.ctaNote}>Tour fee is fully adjustable against purchase price</p>
            </div>
          </div>
        </div>
      )}
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
  page:        { padding: 24, maxWidth: 1100, margin: '0 auto' },
  heading:     { fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 16 },
  subHeading:  { fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 12 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  searchBox:   { background: 'white', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  searchRow:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  select:      { padding: '9px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, outline: 'none', background: 'white' },
  input:       { flex: 1, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, outline: 'none', minWidth: 200 },
  btnSearch:   { padding: '9px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  btnClear:    { padding: '9px 16px', background: '#f0f0f0', color: '#555', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, cursor: 'pointer' },
  btnView:     { padding: '5px 10px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
  hint:        { fontSize: 11, color: '#2980b9', marginTop: 8 },
  resultInfo:  { fontSize: 13, color: '#555', marginBottom: 12 },
  viewToggle:  { display: 'flex', gap: 8, marginBottom: 16 },
  toggleBtn:   { padding: '7px 16px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  toggleActive:{ background: '#2980b9', color: 'white', border: '1px solid #2980b9' },
  cardsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card:        { background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #eee', cursor: 'pointer' },
  cardImg:     { width: '100%', height: 140, objectFit: 'cover' },
  cardBody:    { padding: 14 },
  cardTitle:   { fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 4 },
  cardSub:     { fontSize: 12, color: '#888', marginBottom: 2 },
  lockedPrice: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '5px 8px', background: '#f8f4ff', borderRadius: 4, border: '1px dashed #c9a6f5' },
  lockIcon:    { fontSize: 11 },
  lockText:    { fontSize: 11, color: '#8e44ad', fontWeight: 500 },
  tableLocked: { fontSize: 12, color: '#8e44ad', fontWeight: 500 },
  empty:       { color: '#aaa', fontSize: 14, padding: 20, textAlign: 'center' },
  tableWrap:   { background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: '#2980b9' },
  th:          { padding: '12px 14px', color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left' },
  td:          { padding: '11px 14px', fontSize: 13, color: '#444', borderBottom: '1px solid #f0f0f0' },
  // Modal
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: 'white', borderRadius: 12, width: '90%', maxWidth: 380, position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  close:       { position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, zIndex: 1 },
  qrWrap:      { background: '#f8f8f8', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'center', marginBottom: 8 },
  ctaStack:    { display: 'flex', flexDirection: 'column', gap: 10 },
  ctaUnlock:   { width: '100%', padding: '11px 0', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' },
  ctaTour:     { width: '100%', padding: '11px 0', background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' },
  ctaNote:     { fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 8 },
}