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
        <div style={s.loadingSpinner}>🏠</div>
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
  center:           { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 20 },
  // Error state
  errorBox:         { background: 'white', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  errorIcon:        { fontSize: 52, marginBottom: 16 },
  errorTitle:       { fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 10 },
  errorMsg:         { fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 8 },
  errorSub:         { fontSize: 12, color: '#aaa', lineHeight: 1.6, marginBottom: 24 },
  errorBtn:         { display: 'inline-block', padding: '11px 24px', background: '#2c3e50', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  // Loading state
  loadingBox:       { background: 'white', borderRadius: 16, padding: '40px 32px', maxWidth: 320, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  loadingSpinner:   { fontSize: 48, marginBottom: 16, display: 'block', animation: 'pulse 1.5s ease-in-out infinite' },
  loadingTitle:     { fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 6 },
  loadingSub:       { fontSize: 13, color: '#aaa' },
  page:             { minHeight: '100vh', background: '#f5f5f5', padding: 20, display: 'flex', justifyContent: 'center' },
  card:             { background: 'white', borderRadius: 8, padding: 24, width: '100%', maxWidth: 560, height: 'fit-content', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  id:               { fontSize: 11, color: '#aaa', marginBottom: 4 },
  title:            { fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 16 },
  imgGrid:          { marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  imgMain:          { width: '100%', height: 220, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' },
  imgRow:           { display: 'flex', gap: 8 },
  imgSub:           { flex: 1, height: 90, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' },
  grid:             { display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 16 },
  // Price locked
  priceLocked:      { background: '#f8f4ff', border: '1px dashed #c9a6f5', borderRadius: 8, padding: '14px 16px', marginBottom: 16 },
  priceLockedHeader:{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  priceLockedTitle: { fontSize: 14, fontWeight: 600, color: '#6c3483', margin: 0 },
  priceLockedSub:   { fontSize: 12, color: '#8e44ad', lineHeight: 1.5, margin: 0 },
  // CTA
  ctaStack:         { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 },
  ctaUnlock:        { width: '100%', padding: '13px 0', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' },
  ctaTour:          { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' },
  ctaNote:          { fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 20 },
  // Seller hidden
  sellerHidden:     { background: '#f8f9fa', borderRadius: 6, padding: '14px 16px' },
  sellerTitle:      { fontWeight: 700, color: '#555', marginBottom: 10, fontSize: 13 },
  sellerRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #eee' },
  sellerLabel:      { fontSize: 12, color: '#aaa', fontWeight: 500 },
  sellerValue:      { fontSize: 13, color: '#bbb', letterSpacing: '0.05em' },
  unlockHint:       { fontSize: 10, color: '#c9a6f5', fontStyle: 'italic', letterSpacing: 0 },
}