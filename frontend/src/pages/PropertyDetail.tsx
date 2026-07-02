import { useState, useEffect } from 'react'
import Lightbox from '../components/Lightbox'
import { Property } from '../types'

export default function PropertyDetail({ id }: { id: string }) {
  const [property, setProperty] = useState<Property | null>(null)
  const [zoomImg,  setZoomImg]  = useState<string | null>(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const BACKEND = "https://property-registration-production.up.railway.app"
    fetch(`${BACKEND}/property/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setProperty(data)
      })
      .catch(() => setError('Could not load property.'))
  }, [id])

  if (error) return (
    <div style={s.center}>
      <div style={s.errorBox}>
        <div style={s.errorIcon}>🏠</div>
        <h2 style={s.errorTitle}>Property Not Found</h2>
        <p style={s.errorMsg}>
          This listing may have been removed, or the link might be incorrect.
        </p>
        <p style={s.errorSub}>
          Looking for a property? Visit our platform to browse all available listings.
        </p>
        <a href="https://property-registration.vercel.app" style={s.errorBtn}>
          Browse Properties →
        </a>
      </div>
    </div>
  )

  if (!property) return (
    <div style={s.center}>
      <div style={s.loadingBox}>
        <div style={s.loadingSpinner}/>
        <p style={s.loadingTitle}>Loading property details...</p>
        <p style={s.loadingSub}>Please wait a moment</p>
      </div>
    </div>
  )

  function handleUnlockContact() {
    alert('Our team will reach out to connect you with the seller. Expect a call within 24 hours.')
  }

  function handleScheduleTour() {
    alert('Tour booked! ₹2,000 is payable at confirmation. We\'ll contact you to schedule your slot.')
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.id}>🏠 {property.propertyID}</p>
        <h1 style={s.title}>{property.propertyName}</h1>

        {/* Images */}
        {property.images.length > 0 && (
          <div style={s.imgGrid}>
            <img src={property.images[0]} alt="main" style={s.imgMain} onClick={() => setZoomImg(property.images[0])}/>
            <div style={s.imgRow}>
              {property.images.slice(1).map((src, i) => (
                <img key={i} src={src} alt={`img-${i}`} style={s.imgSub} onClick={() => setZoomImg(src)}/>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div style={s.grid}>
          <Detail label="Size"          value={`${property.size} sq ft`}/>
          <Detail label="Bedroom"       value={property.bedroomType}/>
          <Detail label="Type"          value={property.propertyType}/>
          <Detail label="Neighbourhood" value={property.neighbourhood}/>
          <Detail label="Location"      value={property.geoLocation}/>
          {property.propertyType === 'Under Construction' && property.positionDate &&
            <Detail label="Position Date" value={property.positionDate}/>}
          {property.propertyType === 'Immediate Available' && property.propertyAge &&
            <Detail label="Property Age"  value={`${property.propertyAge} years`}/>}
        </div>

        {/* Price — hidden, replaced with lock banner */}
        <div style={s.priceLocked}>
          <div style={s.priceLockedHeader}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <p style={s.priceLockedTitle}>Interested in this property?</p>
          </div>
          <p style={s.priceLockedSub}>
            Pricing and seller contact are shared only with verified buyers.
            Schedule a tour or contact us — we'll take it from there.
          </p>
        </div>

        {/* CTA Buttons */}
        <div style={s.ctaStack}>
          <button style={s.ctaUnlock} onClick={handleUnlockContact}>
            🔒 Contact Us — Get Full Details
          </button>
          <button style={s.ctaTour} onClick={handleScheduleTour}>
            🏠 Schedule a Tour — ₹2,000
          </button>
        </div>
        <p style={s.ctaNote}>Details exclusively shared with verified buyers · Tour fee adjustable against purchase price</p>

        {/* Seller section — contact hidden */}
        <div style={s.sellerHidden}>
          <p style={s.sellerTitle}>📞 Seller Contact</p>
          <div style={s.sellerRow}>
            <span style={s.sellerLabel}>Name</span>
            <span style={s.sellerValue}>●●●●●●●● <span style={s.unlockHint}>· verified buyer only</span></span>
          </div>
          <div style={s.sellerRow}>
            <span style={s.sellerLabel}>Mobile</span>
            <span style={s.sellerValue}>+91 ●●●●●●●●●● <span style={s.unlockHint}>· verified buyer only</span></span>
          </div>
          <div style={s.sellerRow}>
            <span style={s.sellerLabel}>Email</span>
            <span style={s.sellerValue}>●●●●@●●●●.com <span style={s.unlockHint}>· verified buyer only</span></span>
          </div>
        </div>
      </div>

      {zoomImg && <Lightbox src={zoomImg} onClose={() => setZoomImg(null)}/>}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{value}</p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  center:           { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 'var(--space-5)' },
  errorBox:         { background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8) var(--space-6)', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  errorIcon:        { fontSize: 48, marginBottom: 'var(--space-4)' },
  errorTitle:       { fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' },
  errorMsg:         { fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-2)' },
  errorSub:         { fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-6)' },
  errorBtn:         { display: 'inline-block', padding: '11px var(--space-6)', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' },
  loadingBox:       { background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8) var(--space-6)', maxWidth: 320, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  loadingSpinner:   { width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' },
  loadingTitle:     { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 },
  loadingSub:       { fontSize: 13, color: 'var(--color-text-muted)' },
  page:             { minHeight: '100vh', background: 'var(--color-bg)', padding: 'var(--space-5)', display: 'flex', justifyContent: 'center' },
  card:             { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', width: '100%', maxWidth: 560, height: 'fit-content', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  id:               { fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', fontFamily: 'monospace' },
  title:            { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' },
  imgGrid:          { marginBottom: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  imgMain:          { width: '100%', height: 220, objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  imgRow:           { display: 'flex', gap: 'var(--space-2)' },
  imgSub:           { flex: 1, height: 90, objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  grid:             { display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--space-4)' },
  priceLocked:      { background: '#f8f4ff', border: '1px dashed #c9a6f5', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)' },
  priceLockedHeader:{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 6 },
  priceLockedTitle: { fontSize: 14, fontWeight: 600, color: '#6c3483', margin: 0 },
  priceLockedSub:   { fontSize: 12, color: 'var(--color-purple)', lineHeight: 1.5, margin: 0 },
  ctaStack:         { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' },
  ctaUnlock:        { width: '100%', padding: '13px 0', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' },
  ctaTour:          { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg, var(--color-success) 0%, #1e8449 100%)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' },
  ctaNote:          { fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 'var(--space-5)' },
  sellerHidden:     { background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)' },
  sellerTitle:      { fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', fontSize: 13 },
  sellerRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' },
  sellerLabel:      { fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 },
  sellerValue:      { fontSize: 13, color: 'var(--color-text-placeholder)', letterSpacing: '0.05em' },
  unlockHint:       { fontSize: 10, color: '#c9a6f5', fontStyle: 'italic', letterSpacing: 0 },
}