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

  if (error)    return <div style={s.center}><p style={{ color: '#c0392b' }}>❌ {error}</p></div>
  if (!property) return <div style={s.center}><p>Loading property...</p></div>

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
            <span style={{ fontSize: 16 }}>🔒</span>
            <p style={s.priceLockedTitle}>Price details are hidden</p>
          </div>
          <p style={s.priceLockedSub}>
            Unlock sqft price, box price, and seller contact by reaching out to us.
          </p>
        </div>

        {/* CTA Buttons */}
        <div style={s.ctaStack}>
          <button style={s.ctaUnlock} onClick={handleUnlockContact}>
            🔒 Unlock Details — Contact Us
          </button>
          <button style={s.ctaTour} onClick={handleScheduleTour}>
            🏠 Schedule Tour — ₹2,000
          </button>
        </div>
        <p style={s.ctaNote}>Tour fee is fully adjustable against the purchase price</p>

        {/* Seller section — contact hidden */}
        <div style={s.sellerHidden}>
          <p style={s.sellerTitle}>👤 Seller Info</p>
          <div style={s.sellerRow}>
            <span style={s.sellerLabel}>Name</span>
            <span style={s.sellerValue}>●●●●●●●● <span style={s.unlockHint}>(unlock to reveal)</span></span>
          </div>
          <div style={s.sellerRow}>
            <span style={s.sellerLabel}>Mobile</span>
            <span style={s.sellerValue}>+91 ●●●●●●●●●● <span style={s.unlockHint}>(unlock to reveal)</span></span>
          </div>
          <div style={s.sellerRow}>
            <span style={s.sellerLabel}>Email</span>
            <span style={s.sellerValue}>●●●●@●●●●.com <span style={s.unlockHint}>(unlock to reveal)</span></span>
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
  center:           { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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