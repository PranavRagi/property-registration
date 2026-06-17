import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { getMode } from '../utils/auth'
import { SellerStats, BuyerStats, Property } from '../types'

// ── Simple Bar Chart ──────────────────────────────────────────────────────────
function BarChart({ data, color = '#2c3e50', unit = '' }: {
  data: { label: string; value: number }[]
  color?: string
  unit?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ width: '100%' }}>
      {data.map(d => (
        <div key={d.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{d.label}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{unit}{d.value.toLocaleString()}</span>
          </div>
          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${(d.value / max) * 100}%`,
              background: color,
              transition: 'width 0.6s ease'
            }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let cumulative = 0

  function polarToXY(pct: number) {
    const angle = pct * 2 * Math.PI - Math.PI / 2
    return { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) }
  }

  function arcPath(start: number, end: number) {
    const s  = polarToXY(start)
    const e  = polarToXY(end)
    const lg = end - start > 0.5 ? 1 : 0
    return `M50,50 L${s.x},${s.y} A38,38 0 ${lg},1 ${e.x},${e.y} Z`
  }

  const slices = data.map(d => {
    const pct   = d.value / total
    const start = cumulative
    cumulative += pct
    return { ...d, pct, start }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 100 100" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {total === 0
          ? <circle cx="50" cy="50" r="38" fill="#eee"/>
          : slices.map(d => <path key={d.label} d={arcPath(d.start, d.start + d.pct)} fill={d.color}/>)
        }
        <circle cx="50" cy="50" r="22" fill="white"/>
        <text x="50" y="53" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#333">{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: d.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 13, color: '#555' }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#222', marginLeft: 'auto', paddingLeft: 12 }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: {
  label: string; value: string | number; color: string; icon: string
}) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: '16px 20px', borderLeft: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{icon} {label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#222' }}>{value}</p>
    </div>
  )
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const role = getMode()
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null)
  const [buyerStats,  setBuyerStats]  = useState<BuyerStats  | null>(null)
  const [properties,  setProperties]  = useState<Property[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      if (role === 'seller') {
        const [sRes, pRes] = await Promise.all([
          apiFetch('/dashboard/seller/stats'),
          apiFetch('/my-properties')
        ])
        if (sRes) setSellerStats(await sRes.json())
        if (pRes) setProperties(await pRes.json())
      } else {
        const [sRes, pRes] = await Promise.all([
          apiFetch('/dashboard/buyer/stats'),
          apiFetch('/dashboard/properties')
        ])
        if (sRes) setBuyerStats(await sRes.json())
        if (pRes) setProperties(await pRes.json())
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Derived chart data ────────────────────────────────────────────────────

  // City count
  const cityMap: Record<string, number> = {}
  properties.forEach(p => {
    const city = p.geoLocation.split(',')[0].trim()
    cityMap[city] = (cityMap[city] || 0) + 1
  })
  const cityData = Object.entries(cityMap).sort((a,b) => b[1]-a[1]).slice(0,6).map(([label,value]) => ({ label, value }))

  // BHK distribution
  const bhkMap: Record<string, number> = {}
  properties.forEach(p => { bhkMap[p.bedroomType] = (bhkMap[p.bedroomType] || 0) + 1 })
  const bhkColors: Record<string, string> = { '1BHK':'#3498db','2BHK':'#2ecc71','3BHK':'#e67e22','4BHK':'#9b59b6','5BHK+':'#e74c3c' }
  const bhkData = Object.entries(bhkMap).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({ label, value, color: bhkColors[label] || '#95a5a6' }))

  // Price per property (seller)
  const priceData = properties.filter(p => p.sqftPrice).slice(0,8).map(p => ({
    label: p.propertyName.length > 14 ? p.propertyName.slice(0,14)+'…' : p.propertyName,
    value: Number(p.sqftPrice) || 0
  }))

  // Avg price per city (buyer)
  const cityPriceMap: Record<string, number[]> = {}
  properties.forEach(p => {
    const city = p.geoLocation.split(',')[0].trim()
    if (!cityPriceMap[city]) cityPriceMap[city] = []
    if (p.sqftPrice) cityPriceMap[city].push(Number(p.sqftPrice))
  })
  const cityAvgPrice = Object.entries(cityPriceMap)
    .filter(([,prices]) => prices.length > 0)
    .sort((a,b) => (b[1].reduce((s,v)=>s+v,0)/b[1].length) - (a[1].reduce((s,v)=>s+v,0)/a[1].length))
    .slice(0,6)
    .map(([label,prices]) => ({ label, value: Math.round(prices.reduce((s,v)=>s+v,0)/prices.length) }))

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <p style={{ color:'#888', fontSize:15 }}>Loading analytics...</p>
    </div>
  )

  // ── Seller View ───────────────────────────────────────────────────────────
  if (role === 'seller' && sellerStats) return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>📊 My Property Analytics</h2>

      <div style={s.statsGrid}>
        <StatCard label="Total Properties" value={sellerStats.total}     color="#2c3e50" icon="🏠"/>
        <StatCard label="Available"        value={sellerStats.available} color="#27ae60" icon="✅"/>
        <StatCard label="Sold"             value={sellerStats.sold}      color="#e74c3c" icon="🔴"/>
        <StatCard label="On Hold"          value={sellerStats.onHold}    color="#f39c12" icon="🟡"/>
        <StatCard label="Verified"         value={sellerStats.verified}  color="#3498db" icon="🔵"/>
        <StatCard label="Pending"          value={sellerStats.pending}   color="#95a5a6" icon="⏳"/>
      </div>

      <div style={s.chartsGrid}>
        <ChartCard title="Status Distribution">
          <DonutChart data={[
            { label:'Available', value:sellerStats.available, color:'#27ae60' },
            { label:'Sold',      value:sellerStats.sold,      color:'#e74c3c' },
            { label:'On Hold',   value:sellerStats.onHold,    color:'#f39c12' },
          ]}/>
        </ChartCard>
        <ChartCard title="Verification Status">
          <DonutChart data={[
            { label:'Verified', value:sellerStats.verified,                                                color:'#27ae60' },
            { label:'Pending',  value:sellerStats.pending,                                                 color:'#f39c12' },
            { label:'Rejected', value:sellerStats.total - sellerStats.verified - sellerStats.pending,      color:'#e74c3c' },
          ]}/>
        </ChartCard>
      </div>

      <div style={s.chartsGrid}>
        <ChartCard title="Sqft Price by Property (₹)">
          {priceData.length > 0 ? <BarChart data={priceData} color="#2c3e50" unit="₹"/> : <p style={s.empty}>No data</p>}
        </ChartCard>
        <ChartCard title="Properties by City">
          {cityData.length > 0 ? <BarChart data={cityData} color="#27ae60"/> : <p style={s.empty}>No data</p>}
        </ChartCard>
      </div>

      <div style={{ ...s.chartsGrid, gridTemplateColumns:'1fr' }}>
        <ChartCard title="Bedroom Type Distribution">
          {bhkData.length > 0 ? <DonutChart data={bhkData}/> : <p style={s.empty}>No data</p>}
        </ChartCard>
      </div>
    </div>
  )

  // ── Buyer View ────────────────────────────────────────────────────────────
  if (role === 'buyer' && buyerStats) return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>📊 Market Analytics</h2>

      <div style={s.statsGrid}>
        <StatCard label="Total Properties" value={buyerStats.totalProperties} color="#2c3e50" icon="🏠"/>
        <StatCard label="Cities Available" value={buyerStats.totalCities}     color="#3498db" icon="📍"/>
        <StatCard label="Available Now"    value={buyerStats.available}       color="#27ae60" icon="✅"/>
        <StatCard label="Verified"         value={buyerStats.verified}        color="#9b59b6" icon="🔵"/>
      </div>

      <div style={s.chartsGrid}>
        <ChartCard title="Avg Sqft Price by City (₹)">
          {cityAvgPrice.length > 0 ? <BarChart data={cityAvgPrice} color="#3498db" unit="₹"/> : <p style={s.empty}>No data</p>}
        </ChartCard>
        <ChartCard title="Properties by City">
          {cityData.length > 0 ? <BarChart data={cityData} color="#2c3e50"/> : <p style={s.empty}>No data</p>}
        </ChartCard>
      </div>

      <div style={s.chartsGrid}>
        <ChartCard title="Bedroom Type Distribution">
          {bhkData.length > 0 ? <DonutChart data={bhkData}/> : <p style={s.empty}>No data</p>}
        </ChartCard>
        <ChartCard title="Property Status Overview">
          <DonutChart data={[
            { label:'Available', value:buyerStats.available,                                    color:'#27ae60' },
            { label:'Sold/Hold', value:buyerStats.totalProperties - buyerStats.available,       color:'#e74c3c' },
            { label:'Verified',  value:buyerStats.verified,                                     color:'#3498db' },
          ]}/>
        </ChartCard>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <p style={{ color:'#888' }}>No analytics data available.</p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding:'24px 28px', background:'#f5f5f5', minHeight:'calc(100vh - 56px)' },
  pageTitle:  { fontSize:22, fontWeight:700, color:'#222', marginBottom:24 },
  statsGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:24 },
  chartsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 },
  empty:      { fontSize:13, color:'#aaa', textAlign:'center', padding:'20px 0' },
}