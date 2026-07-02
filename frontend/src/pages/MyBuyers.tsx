import { useState, useEffect, useRef } from 'react'
import { Buyer } from '../types'
import { apiFetch } from '../utils/api'

interface Props {
  onEdit:     (buyer: Buyer) => void
  onNavigate: (page: string) => void
}

export default function MyBuyers({ onEdit, onNavigate }: Props) {
  const [buyers,  setBuyers]  = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [viewBuyer, setViewBuyer] = useState<Buyer | null>(null)

  useEffect(() => { fetchBuyers() }, [])

  async function fetchBuyers() {
    try {
      const res = await apiFetch('/my-buyers')
      if (!res) return
      const data = await res.json()
      if (Array.isArray(data)) setBuyers(data)
      else { console.error('Expected array:', data); setBuyers([]) }
    } catch (err) {
      console.error('Could not load buyers:', err)
      setBuyers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure?')) return
    try {
      const res  = await apiFetch(`/buyer/${id}`, { method: 'DELETE' })
      if (!res) return
      const data = await res.json()
      if (data.success) { alert('✅ Deleted!'); fetchBuyers() }
    } catch { alert('Could not delete.') }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await apiFetch(`/buyer/${id}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ status })
      })
      if (!res) return
      const data = await res.json()
      if (data.success) setBuyers(prev => prev.map(b => b.buyerID === id ? { ...b, status } : b))
    } catch { alert('Could not update status.') }
  }

  if (loading) return <div style={s.center}>Loading...</div>

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>👤 My Buyers</h1>
          <button style={s.btnNew} onClick={() => onNavigate('buyer-register')}>+ Register New</button>
        </div>

        {buyers.length === 0 && (
          <div style={s.empty}>
            <p>No registrations yet.</p>
            <button style={s.btnNew} onClick={() => onNavigate('buyer-register')}>Register Now</button>
          </div>
        )}

        {buyers.map(b => (
          <div key={b.buyerID} style={s.item}>
            <div style={s.itemLeft}>
              <div style={s.avatar}>{b.fullName.charAt(0).toUpperCase()}</div>
              <div>
                <p style={s.name}>{b.fullName}</p>
                <p style={s.sub}>{b.preferredCity} | {b.preferredType} | ₹{Number(b.budgetMin).toLocaleString()} – ₹{Number(b.budgetMax).toLocaleString()}</p>
                <p style={s.id}>{b.buyerID}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <StatusBadge status={b.status}/>
                  <select
                    style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }}
                    value={b.status || ''}
                    onChange={e => handleStatusChange(b.buyerID, e.target.value)}
                  >
                    <option value="">-- Set Status --</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={s.actions}>
              <button style={s.btnView}   onClick={() => setViewBuyer(b)}>📱 QR</button>
              <button style={s.btnEdit}   onClick={() => onEdit(b)}>✏️ Edit</button>
              <button style={s.btnDelete} onClick={() => handleDelete(b.buyerID)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── QR Only Modal ── */}
      {viewBuyer && (
        <QRModal
          qrCode={viewBuyer.qrCode}
          url={viewBuyer.buyerURL}
          name={viewBuyer.fullName}
          onClose={() => setViewBuyer(null)}
        />
      )}
    </div>
  )
}

// ── QR Only Modal ──────────────────────────────────────────────────────────────
function QRModal({ qrCode, url, name, onClose }: {
  qrCode: string; url: string; name: string; onClose: () => void
}) {
  const qrSrc = qrCode.startsWith('data:')
    ? qrCode
    : `/uploads${qrCode.replace('/uploads', '')}`

  function handleDownload() {
    const a    = document.createElement('a')
    a.href     = qrSrc
    a.download = `QR-${name.replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.qrModal} onClick={e => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>
        <p style={s.qrTitle}>📱 Scan to View Profile</p>
        <p style={s.qrSub}>{name}</p>
        <div style={s.qrWrap}>
          <img src={qrSrc} alt="QR Code" style={s.qrImg}/>
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
  const color = status === 'Active' ? '#27ae60' : status === 'Inactive' ? '#f39c12' : status === 'Closed' ? '#e74c3c' : '#aaa'
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
  avatar:      { width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, flexShrink: 0 },
  name:        { fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 3 },
  sub:         { fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 },
  id:          { fontSize: 11, color: 'var(--color-text-placeholder)', fontFamily: 'monospace' },
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