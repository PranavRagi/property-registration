import { useState, useEffect, useRef } from 'react'
import { Property } from '../types'
import { apiFetch } from '../utils/api'

interface Props {
  onEdit:     (property: Property) => void
  onNavigate: (page: string) => void
}

export default function MyProperties({ onEdit, onNavigate }: Props) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading,    setLoading]    = useState(true)
  const [viewProp,   setViewProp]   = useState<Property | null>(null)

  useEffect(() => { fetchProperties() }, [])
  const BACKEND = "https://property-registration-production.up.railway.app"

  async function fetchProperties() {
    try {
      const res = await apiFetch('/my-properties')
      if (!res) return
      const data = await res.json()
      if (Array.isArray(data)) setProperties(data)
      else { console.error('Expected array but got:', data); setProperties([]) }
    } catch (err) {
      console.error('Could not load properties:', err)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this property?')) return
    try {
      const res  = await apiFetch(`/property/${id}`, { method: 'DELETE' })
      if (!res) return
      const data = await res.json()
      if (data.success) { alert('✅ Property deleted!'); fetchProperties() }
    } catch { alert('Could not delete property.') }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await apiFetch(`/property/${id}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ status })
      })
      if (!res) return
      const data = await res.json()
      if (data.success) setProperties(prev => prev.map(p => p.propertyID === id ? { ...p, status } : p))
    } catch { alert('Could not update status.') }
  }

  if (loading) return <div style={s.center}>Loading properties...</div>

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>🏠 My Properties</h1>
          <button style={s.btnNew} onClick={() => onNavigate('seller-register')}>+ Register New</button>
        </div>

        {properties.length === 0 && (
          <div style={s.empty}>
            <p>No properties registered yet.</p>
            <button style={s.btnNew} onClick={() => onNavigate('seller-register')}>Register First Property</button>
          </div>
        )}

        {properties.map(p => (
          <div key={p.propertyID} style={s.item}>
            <div style={s.itemLeft}>
              {p.images?.[0] && <img src={p.images[0]} alt="thumb" style={s.thumb}/>}
              <div>
                <p style={s.propName}>{p.propertyName}</p>
                <p style={s.propSub}>{p.geoLocation} | {p.bedroomType} | ₹{Number(p.sqftPrice).toLocaleString()}/sqft</p>
                <p style={s.propID}>{p.propertyID}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <StatusBadge status={p.status}/>
                  <select
                    style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }}
                    value={p.status || ''}
                    onChange={e => handleStatusChange(p.propertyID, e.target.value)}
                  >
                    <option value="">-- Set Status --</option>
                    <option>Available</option>
                    <option>On Hold</option>
                    <option>Sold</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={s.actions}>
              <button style={s.btnView}   onClick={() => setViewProp(p)}>📱 QR</button>
              <button style={s.btnEdit}   onClick={() => onEdit(p)}>✏️ Edit</button>
              <button style={s.btnDelete} onClick={() => handleDelete(p.propertyID)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── QR Only Modal ── */}
      {viewProp && (
        <QRModal
          qrCode={viewProp.qrCode}
          url={viewProp.propertyURL}
          name={viewProp.propertyName}
          onClose={() => setViewProp(null)}
        />
      )}
    </div>
  )
}

// ── QR Only Modal ──────────────────────────────────────────────────────────────
function QRModal({ qrCode, url, name, onClose }: {
  qrCode: string; url: string; name: string; onClose: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)

  function handleDownload() {
    const a    = document.createElement('a')
    a.href     = qrCode
    a.download = `QR-${name.replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.qrModal} onClick={e => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        <p style={s.qrTitle}>📱 Scan to View Property</p>
        <p style={s.qrSub}>{name}</p>

        <div style={s.qrWrap}>
          <img ref={imgRef} src={qrCode} alt="QR Code" style={s.qrImg}/>
        </div>

        <p style={s.qrHint}>Point your phone camera at the QR code</p>

        <button style={s.btnDownload} onClick={handleDownload}>
          📥 Download QR
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Available' ? '#27ae60' : status === 'On Hold' ? '#f39c12' : status === 'Sold' ? '#e74c3c' : '#aaa'
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'white', background: color }}>{status || 'No Status'}</span>
}

const s: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', justifyContent: 'center' },
  card:        { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', width: '100%', maxWidth: 680, height: 'fit-content', boxShadow: 'var(--shadow-sm)' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' },
  title:       { fontSize: 20, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' },
  center:      { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', fontSize: 15, color: 'var(--color-text-muted)' },
  empty:       { textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' },
  item:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-3)', flexWrap: 'wrap' },
  itemLeft:    { display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', flex: 1 },
  thumb:       { width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' },
  propName:    { fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 3 },
  propSub:     { fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 },
  propID:      { fontSize: 11, color: 'var(--color-text-placeholder)', fontFamily: 'monospace' },
  actions:     { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btnNew:      { padding: '8px var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  btnView:     { padding: '6px var(--space-3)', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-secondary)' },
  btnEdit:     { padding: '6px var(--space-3)', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  btnDelete:   { padding: '6px var(--space-3)', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(26,37,47,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  qrModal:     { background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8) var(--space-6)', width: 300, textAlign: 'center', position: 'relative', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' },
  close:       { position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' },
  qrTitle:     { fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 },
  qrSub:       { fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' },
  qrWrap:      { background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'inline-block', marginBottom: 'var(--space-3)' },
  qrImg:       { width: 180, height: 180, display: 'block' },
  qrHint:      { fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' },
  btnDownload: { padding: '9px var(--space-5)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
}