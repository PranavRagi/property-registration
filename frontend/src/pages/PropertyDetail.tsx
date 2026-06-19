import { useState, useEffect } from 'react'
import Lightbox from '../components/Lightbox'
import { Property } from '../types'

export default function PropertyDetail({ id }: { id: string }) {
  const [property, setProperty] = useState<Property | null>(null)
  const [zoomImg,  setZoomImg]  = useState<string | null>(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
  // const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
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

        {/* Price */}
        <div style={s.price}>
          {property.boxPrice  && <p>Box Price: <b>₹{Number(property.boxPrice).toLocaleString()}</b></p>}
          {property.sqftPrice && <p>Sqft Price: <b>₹{Number(property.sqftPrice).toLocaleString()}/sqft</b></p>}
        </div>

        {/* Seller */}
        <div style={s.seller}>
          <p style={s.sellerTitle}>📞 Contact Seller</p>
          <p><b>{property.sellerName}</b></p>
          <p>{property.contactNo}</p>
          <p>{property.email}</p>
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
  center:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  page:       { minHeight: '100vh', background: '#f5f5f5', padding: 20, display: 'flex', justifyContent: 'center' },
  card:       { background: 'white', borderRadius: 8, padding: 24, width: '100%', maxWidth: 560, height: 'fit-content', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  id:         { fontSize: 11, color: '#aaa', marginBottom: 4 },
  title:      { fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 16 },
  imgGrid:    { marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  imgMain:    { width: '100%', height: 220, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' },
  imgRow:     { display: 'flex', gap: 8 },
  imgSub:     { flex: 1, height: 90, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' },
  grid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 16 },
  price:      { background: '#f8f9fa', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 15, lineHeight: 2 },
  seller:     { background: '#f0f7ff', borderRadius: 6, padding: '14px 16px', lineHeight: 1.8 },
  sellerTitle:{ fontWeight: 700, color: '#2980b9', marginBottom: 6 }
}
