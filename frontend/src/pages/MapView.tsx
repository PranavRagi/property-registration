import { useState, useEffect, useRef } from 'react'

interface Property {
  propertyID:    string
  propertyName:  string
  geoLocation:   string
  neighbourhood: string
  bedroomType:   string
  propertyType:  string
  sqftPrice:     string
  boxPrice:      string | null
  status:        string
  verified?:     boolean | null
  images:        string[]
}

const STATUS_CONFIG = {
  'Available': { color: '#27ae60', pin: '🟢' },
  'Sold':      { color: '#e74c3c', pin: '🔴' },
  'On Hold':   { color: '#f39c12', pin: '🟡' },
  '':          { color: '#95a5a6', pin: '⚪' },
} as const

// ── Geocoding — Nominatim with 3-strategy fallback ────────────────────────────
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {}

async function nominatimLookup(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
  } catch { return null }
}

async function geocodeCity(location: string): Promise<{ lat: number; lng: number } | null> {
  const key = location.toLowerCase().trim()
  if (key in geocodeCache) return geocodeCache[key]

  let result = await nominatimLookup(location)
  await new Promise(r => setTimeout(r, 300))

  if (!result) {
    const parts = location.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      result = await nominatimLookup(parts[parts.length - 1])
      await new Promise(r => setTimeout(r, 300))
    }
  }

  if (!result) {
    const parts = location.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      result = await nominatimLookup(parts[0])
      await new Promise(r => setTimeout(r, 300))
    }
  }

  geocodeCache[key] = result
  return result
}

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || ''

export default function MapView() {
  const [properties,   setProperties]   = useState<Property[]>([])
  const [filtered,     setFiltered]     = useState<Property[]>([])
  const [coords,       setCoords]       = useState<Record<string, { lat: number; lng: number }>>({})
  const [activeFilter, setActiveFilter] = useState('All')
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState<Property | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [mapReady,     setMapReady]     = useState(false)
  const [tokenError,   setTokenError]   = useState(false)

  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef  = useRef<any[]>([])

  const FILTERS = ['All', 'Available', 'Sold', 'On Hold']

  useEffect(() => { loadProperties() }, [])

  async function loadProperties() {
    setLoading(true)
    try {
      const BACKEND = "https://property-registration-production.up.railway.app"
      const res = await fetch(`${BACKEND}/map/properties`)
      if (!res.ok) return
      const data: Property[] = await res.json()
      setProperties(data)

      const uniqueLocs = [...new Set(data.map(p => p.geoLocation))]
      const results: Record<string, { lat: number; lng: number }> = {}
      for (const loc of uniqueLocs) {
        const coord = await geocodeCity(loc)
        if (coord) results[loc] = coord
      }
      setCoords(results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = activeFilter === 'All'
      ? properties
      : properties.filter(p => p.status === activeFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.propertyName.toLowerCase().includes(q)  ||
        p.geoLocation.toLowerCase().includes(q)   ||
        p.neighbourhood.toLowerCase().includes(q) ||
        p.bedroomType.toLowerCase().includes(q)   ||
        p.propertyID.toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [activeFilter, search, properties])

  useEffect(() => {
    if (mapInstance.current) return

    const link   = document.createElement('link')
    link.rel     = 'stylesheet'
    link.href    = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
    document.head.appendChild(link)

    const script    = document.createElement('script')
    script.src      = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'
    script.onload   = () => setMapReady(true)
    script.onerror  = () => setTokenError(true)
    document.head.appendChild(script)

    return () => {
      try { document.head.removeChild(script); document.head.removeChild(link) } catch {}
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return

    const mapboxgl: any = (window as any).mapboxgl
    if (!MAPBOX_TOKEN) { setTokenError(true); return }

    mapboxgl.accessToken = MAPBOX_TOKEN

    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style:     'mapbox://styles/mapbox/light-v11',
      center:    [78.4867, 17.3850],
      zoom:      10
    })
  }, [mapReady])

  useEffect(() => {
    if (!mapInstance.current || !mapReady) return

    const mapboxgl: any = (window as any).mapboxgl
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    filtered.forEach(p => {
      const coord = coords[p.geoLocation]
      if (!coord) return

      const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['']

      const el             = document.createElement('div')
      el.style.cssText     = `
        width: 32px; height: 32px; border-radius: 50%;
        background: ${cfg.color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; color: white; font-weight: 700;
        transition: transform 0.15s;
      `
      el.textContent = p.bedroomType.replace('BHK', '')
      el.title       = p.propertyName
      el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.3)')
      el.addEventListener('mouseleave', () => el.style.transform = 'scale(1.0)')
      el.addEventListener('click',      () => setSelected(p))

      const lat = coord.lat + (Math.random() - 0.5) * 0.002
      const lng = coord.lng + (Math.random() - 0.5) * 0.002

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current)

      markersRef.current.push(marker)
    })
  }, [filtered, coords, mapReady])

  if (tokenError || !MAPBOX_TOKEN) {
    return (
      <div style={s.page}>
        <div style={s.errorCard}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>⚠️</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 8 }}>
            Mapbox Token Missing
          </h2>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>
            Add your token to <code style={s.code}>frontend/.env</code>:
          </p>
          <div style={s.codeBlock}>
            VITE_MAPBOX_TOKEN=pk.eyJ1...your_token
          </div>
          <a href="https://mapbox.com" target="_blank" rel="noreferrer" style={s.tokenLink}>
            Get free token at mapbox.com →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>🗺️ Property Map</h2>

        <div style={s.searchWrap}>
          <input
            style={s.searchInput}
            placeholder="Search by name, city, neighbourhood, BHK..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div style={s.filters}>
          {FILTERS.map(f => {
            const cfg   = STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]
            const count = f === 'All'
              ? properties.length
              : properties.filter(p => p.status === f).length
            return (
              <button
                key={f}
                style={{
                  ...s.filterBtn,
                  ...(activeFilter === f ? s.filterActive : {}),
                  ...(cfg ? { borderLeft: `3px solid ${cfg.color}` } : {})
                }}
                onClick={() => setActiveFilter(f)}
              >
                {cfg?.pin} {f}
                <span style={s.filterCount}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {search.trim() && (
        <div style={s.searchInfo}>
          {filtered.length === 0
            ? `No properties found for "${search}"`
            : `${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'} found for "${search}"`
          }
        </div>
      )}

      {/* Map */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={s.loadingOverlay}>
            <div style={s.loadingBox}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>🗺️</p>
              <p style={{ fontSize: 14, color: '#555' }}>
                Loading properties & geocoding locations...
              </p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={s.map}/>
      </div>

      {/* Property Detail Popup */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.popup} onClick={e => e.stopPropagation()}>
            <button style={s.popupClose} onClick={() => setSelected(null)}>✕</button>

            {selected.images?.[0] && (
              <img
                src={selected.images[0]}
                alt="property"
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
              />
            )}

            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#222', flex: 1, marginRight: 8 }}>
                  {selected.propertyName}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                  background: STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG]?.color || '#95a5a6',
                  color: 'white', whiteSpace: 'nowrap'
                }}>
                  {selected.status || 'Unknown'}
                </span>
              </div>

              <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                📍 {selected.neighbourhood}, {selected.geoLocation}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={s.stat}>
                  <p style={s.statL}>BHK</p>
                  <p style={s.statV}>{selected.bedroomType}</p>
                </div>
                <div style={s.stat}>
                  <p style={s.statL}>Type</p>
                  <p style={s.statV}>{selected.propertyType}</p>
                </div>
                {/* Price hidden */}
                <div style={{ ...s.stat, gridColumn: '1 / -1', background: '#f8f4ff', border: '1px dashed #c9a6f5' }}>
                  <p style={{ fontSize: 11, color: '#8e44ad', fontWeight: 500 }}>🔒 Price hidden — contact us to unlock</p>
                </div>
              </div>

              {selected.verified === true && (
                <p style={{ fontSize: 11, color: '#27ae60', fontWeight: 600, marginBottom: 10 }}>✅ Verified Property</p>
              )}

              {/* CTA Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  style={s.popupCtaUnlock}
                  onClick={() => alert('Our team will contact you shortly to share full details.')}
                >
                  🔒 Unlock Details — Contact Us
                </button>
                <button
                  style={s.popupCtaTour}
                  onClick={() => alert('Tour booked! ₹2,000 payable at confirmation. We\'ll schedule your slot.')}
                >
                  🏠 Schedule Tour — ₹2,000
                </button>
              </div>

              <p style={{ fontSize: 10, color: '#bbb', marginTop: 8, textAlign: 'center' }}>{selected.propertyID}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={s.legend}>
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== '').map(([status, cfg]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.color }}/>
            <span style={{ fontSize: 12, color: '#555' }}>{status}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2c3e50', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
          <span style={{ fontSize: 12, color: '#555' }}>= BHK on pin</span>
        </div>
        {search && filtered.length > 0 && (
          <span style={{ fontSize: 12, color: '#27ae60', fontWeight: 600, marginLeft: 'auto' }}>
            🔍 Showing {filtered.length} of {properties.length} properties
          </span>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:           { background: '#f5f5f5', minHeight: 'calc(100vh - 56px)' },
  errorCard:      { maxWidth: 440, margin: '80px auto', background: 'white', borderRadius: 12, padding: '40px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' },
  code:           { background: '#f0f0f0', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 },
  codeBlock:      { background: '#1e1e1e', color: '#4ec9b0', padding: '12px 16px', borderRadius: 6, fontFamily: 'monospace', fontSize: 13, textAlign: 'left' },
  tokenLink:      { display: 'inline-block', marginTop: 16, color: '#3498db', fontSize: 13, textDecoration: 'none', fontWeight: 500 },
  header:         { display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'white', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: 10 },
  title:          { fontSize: 17, fontWeight: 700, color: '#222', marginRight: 4, whiteSpace: 'nowrap' },
  searchWrap:     { display: 'flex', alignItems: 'center', flex: 1, minWidth: 220, maxWidth: 380, background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 20, padding: '0 12px', gap: 6 },
  searchInput:    { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, padding: '8px 0', color: '#333' },
  clearBtn:       { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, padding: 0, flexShrink: 0 },
  searchInfo:     { padding: '6px 20px', background: '#fffbf0', borderBottom: '1px solid #f0e6c0', fontSize: 12, color: '#888' },
  filters:        { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:      { padding: '6px 12px', background: 'white', border: '1px solid #ddd', borderRadius: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#555', whiteSpace: 'nowrap' },
  filterActive:   { background: '#2c3e50', color: 'white', border: '1px solid #2c3e50' },
  filterCount:    { background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 5px', fontSize: 10, fontWeight: 700 },
  map:            { width: '100%', height: 'calc(100vh - 160px)', minHeight: 400 },
  loadingOverlay: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingBox:     { textAlign: 'center', padding: 28, background: 'white', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  overlay:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  popup:          { background: 'white', borderRadius: 12, width: 310, position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  popupClose:     { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, zIndex: 1 },
  stat:           { background: '#f8f8f8', borderRadius: 6, padding: '8px 10px' },
  statL:          { fontSize: 10, color: '#aaa', marginBottom: 2 },
  statV:          { fontSize: 13, fontWeight: 600, color: '#222' },
  popupCtaUnlock: { width: '100%', padding: '10px 0', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  popupCtaTour:   { width: '100%', padding: '10px 0', background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  legend:         { display: 'flex', gap: 16, padding: '8px 20px', background: 'white', borderTop: '1px solid #eee', flexWrap: 'wrap', alignItems: 'center' },
}