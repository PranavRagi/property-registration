import { useState, useEffect } from 'react'
import Lightbox from '../components/Lightbox'
import { PropertyForm, Property } from '../types'
import { getUsername } from '../utils/auth'
import { apiFetch } from '../utils/api'

const empty: PropertyForm = {
  propertyName: '', size: '', bedroomType: '3BHK', propertyType: '',
  positionDate: '', propertyAge: '', sqftPrice: '', boxPrice: '',
  neighbourhood: '', geoLocation: '', sellerName: '', contactNo: '', email: '', status: ''
}

interface Props {
  editProperty: Property | null
  onSaved:      () => void
}

export default function SellerForm({ editProperty, onSaved }: Props) {
  const [form, setForm]         = useState<PropertyForm>(empty)
  const [images, setImages]     = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [zoomImg, setZoomImg]   = useState<string | null>(null)
  const [result, setResult]     = useState<any>(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})  

  const isEditMode = !!editProperty

  // ── Pre-fill form if editing ─────────────────────────────────────────
  useEffect(() => {
    if (editProperty) {
      setForm({
        propertyName:  editProperty.propertyName,
        size:          editProperty.size,
        bedroomType:   editProperty.bedroomType,
        propertyType:  editProperty.propertyType,
        positionDate:  editProperty.positionDate  || '',
        propertyAge:   editProperty.propertyAge   || '',
        sqftPrice:     editProperty.sqftPrice,
        boxPrice:      editProperty.boxPrice       || '',
        neighbourhood: editProperty.neighbourhood,
        geoLocation:   editProperty.geoLocation,
        sellerName:    editProperty.sellerName,
        contactNo:     editProperty.contactNo,
        email:         editProperty.email,
        status:        editProperty.status || ''
      })
      // Show existing images as previews
      setPreviews(editProperty.images.map(img => img))
    } else {
      setForm(empty)
      setPreviews([])
    }
    setResult(null)
    setError('')
  }, [editProperty])

  function onChange(field: keyof PropertyForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: ''}))
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 4)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function validate():boolean {
    const e: Record<string, string> = {}

    if(!form.propertyName.trim()) e.propertyName = 'Property Name is required.'
    if (!form.size.trim())         e.size         = 'Size is required.'
    if (!form.propertyType)        e.propertyType = 'Please select property type.'
    if (!form.sqftPrice.trim())    e.sqftPrice    = 'Sqft price is required.'
    if (!form.neighbourhood.trim())e.neighbourhood= 'Neighbourhood is required.'
    if (!form.geoLocation.trim())  e.geoLocation  = 'Geo location is required.'
    if (!form.sellerName.trim())   e.sellerName   = 'Seller name is required.'
    if (!form.contactNo.trim())    e.contactNo    = 'Contact number is required.'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required.'
    if (isUnderConstruction && !form.positionDate) e.positionDate = 'Position date is required.'
    if (isImmediate && !form.propertyAge)          e.propertyAge  = 'Property age is required.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit — handles both Create and Update ──────────────────────────
  async function handleSubmit() {
    if(!validate()){
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      images.forEach(img => fd.append('images', img))
      fd.append('ownerUsername', getUsername() || '')

      try {
        const endpoint = isEditMode ? `/property/${editProperty!.propertyID}` : '/register'
        const method = isEditMode ? 'PUT' : 'POST'
        const res = await apiFetch(endpoint, {method, body:fd})

        if (!res) { setError('Could not connect to server.'); return }
        const data = await res.json()
        if(!res.ok){setError(data.message);return}

      
      if (isEditMode) {
        alert('✅ Property updated successfully!')
        onSaved()
      } else {
        setResult(data)
        setForm(empty)
        setImages([])
        setPreviews([])
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const isUnderConstruction = form.propertyType === 'Under Construction'
  const isImmediate         = form.propertyType === 'Immediate Available'

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>🏠 {isEditMode ? 'Edit Property' : 'Property Registration'}</h1>
        <p style={s.sub}>{isEditMode ? `Editing: ${editProperty?.propertyID}` : 'Seller Form'}</p>

        <Section title="Property Details">
          <Field label="Property Name">
            <input style={s.input} value={form.propertyName} onChange={e => onChange('propertyName', e.target.value)} placeholder="e.g. Pranav Villa"/>
            {errors.propertyName  && <p style={s.errMsg}>{errors.propertyName}</p>}
          </Field>
          <Row>
            <Field label="Size (sq ft)">
              <input style={s.input} value={form.size} onChange={e => onChange('size', e.target.value)} placeholder="e.g. 1200"/>
              {errors.size          && <p style={s.errMsg}>{errors.size}</p>}
            </Field>
            <Field label="Bedroom Type">
              <select style={s.input} value={form.bedroomType} onChange={e => onChange('bedroomType', e.target.value)}>
                {errors.bedroomType  && <p style={s.errMsg}>{errors.bedroomType}</p>}
                <option value="">-- Select --</option>
                <option>3BHK</option>
                <option>4BHK</option>
              </select>
            </Field>
          </Row>
          <Field label="Property Type">
            <select style={s.input} value={form.propertyType} onChange={e => onChange('propertyType', e.target.value)}>
              {errors.propertyType  && <p style={s.errMsg}>{errors.propertyType}</p>} 
              <option value="">-- Select --</option>
              <option>Under Construction</option>
              <option>Immediate Available</option>
            </select>
          </Field>
          {isUnderConstruction && (
            <Field label="Position Date">
              <input style={s.input} type="date" value={form.positionDate} onChange={e => onChange('positionDate', e.target.value)}/>
              {errors.positionDate  && <p style={s.errMsg}>{errors.positionDate}</p>}
            </Field>
          )}
          {isImmediate && (
            <Field label="Property Age (years)">
              <input style={s.input} value={form.propertyAge} onChange={e => onChange('propertyAge', e.target.value)} placeholder="e.g. 3"/>
              {errors.propertyAge          && <p style={s.errMsg}>{errors.propertyAge}</p>}
            </Field>
          )}
        </Section>

        <Section title="Cost of Property">
          {(isImmediate || !form.propertyType) && (
            <Field label="Box Price (₹)">
              <input style={s.input} value={form.boxPrice} onChange={e => onChange('boxPrice', e.target.value)} placeholder="e.g. 5000000"/>
              {errors.boxPrice          && <p style={s.errMsg}>{errors.boxPrice}</p>}
            </Field>
          )}
          <Field label="Sqft Price (₹)">
            <input style={s.input} value={form.sqftPrice} onChange={e => onChange('sqftPrice', e.target.value)} placeholder="e.g. 4500"/>
            {errors.sqftPrice          && <p style={s.errMsg}>{errors.sqftPrice}</p>}
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Neighbourhood / Standalone">
            <input style={s.input} value={form.neighbourhood} onChange={e => onChange('neighbourhood', e.target.value)} placeholder="e.g. Banjara Hills"/>
            {errors.neighbourhood && <p style={s.errMsg}>{errors.neighbourhood}</p>}
          </Field>
          <Field label="Geo Location">
            <input style={s.input} value={form.geoLocation} onChange={e => onChange('geoLocation', e.target.value)} placeholder="e.g. Hyderabad, Telangana"/>
            {errors.geoLocation   && <p style={s.errMsg}>{errors.geoLocation}</p>}
          </Field>
        </Section>

        <Section title="Seller Details">
          <Field label="Seller Name">
            <input style={s.input} value={form.sellerName} onChange={e => onChange('sellerName', e.target.value)} placeholder="Full name"/>
            {errors.sellerName  && <p style={s.errMsg}>{errors.sellerName}</p>}
          </Field>
          <Row>
            <Field label="Contact No.">
              <input style={s.input} value={form.contactNo} onChange={e => onChange('contactNo', e.target.value)} placeholder="+91 XXXXXXXXXX"/>
              {errors.contactNo          && <p style={s.errMsg}>{errors.contactNo}</p>}
            </Field>
            <Field label="Email ID">
              <input style={s.input} value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="email@example.com"/>
              {errors.email          && <p style={s.errMsg}>{errors.email}</p>}
            </Field>
            <Field label="Property Status">
              <select style = {s.input} value = {form.status} onChange={e => onChange('status',e.target.value)}>
                {errors.status  && <p style={s.errMsg}>{errors.status}</p>}
                <option value="">-- Select --</option>
                <option>Avaliable</option>
                <option>On Hold</option>
                <option> Sold</option>
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Property Images (max 4)">
          <input type="file" accept="image/*" multiple onChange={onImageChange} style={{ marginBottom: 12 }}/>
          {previews.length > 0 && (
            <div style={s.imgGrid}>
              <img src={previews[0]} alt="main" style={s.imgMain} onClick={() => setZoomImg(previews[0])}/>
              <div style={s.imgRow}>
                {previews.slice(1).map((src, i) => (
                  <img key={i} src={src} alt={`sub-${i}`} style={s.imgSub} onClick={() => setZoomImg(src)}/>
                ))}
              </div>
            </div>
          )}
        </Section>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.actions}>
          <button style={s.btnCancel} onClick={() => { setForm(empty); setImages([]); setPreviews([]); setResult(null); setError('') }}>
            Cancel
          </button>
          <button style={s.btnSubmit} onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Registering...') : (isEditMode ? 'Update Property' : 'Register Property')}
          </button>
        </div>

        {result && (
          <div style={s.result}>
            <p style={{ color: '#27ae60', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>✅ Property Registered!</p>
            <p style={s.idText}>Property ID: <b>{result.propertyID}</b></p>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Scan QR to view property details</p>
            <img src={result.qrCode} alt="QR Code" style={{ width: 160, height: 160 }}/>
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>{result.propertyURL}</p>
          </div>
        )}
      </div>

      {zoomImg && <Lightbox src={zoomImg} onClose={() => setZoomImg(null)}/>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 6 }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', background: '#f5f5f5', padding: 24, display: 'flex', justifyContent: 'center' },
  card:      { background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: '32px 28px', width: '100%', maxWidth: 640, height: 'fit-content' },
  title:     { fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 4 },
  sub:       { fontSize: 13, color: '#999', marginBottom: 24 },
  input:     { width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' },
  imgGrid:   { display: 'flex', flexDirection: 'column', gap: 8 },
  imgMain:   { width: '100%', height: 220, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid #eee' },
  imgRow:    { display: 'flex', gap: 8 },
  imgSub:    { flex: 1, height: 90, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #eee' },
  error:     { background: '#fdf3f2', border: '1px solid #c0392b', color: '#c0392b', padding: '10px 14px', borderRadius: 4, fontSize: 13, marginBottom: 14 },
  actions:   { display: 'flex', gap: 10, marginBottom: 20 },
  btnCancel: { flex: 1, padding: 10, background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 500, color: '#555' },
  btnSubmit: { flex: 1, padding: 10, background: '#2c3e50', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  result:    { background: '#f7fdf9', border: '1px solid #27ae60', borderRadius: 6, padding: 20, textAlign: 'center' },
  idText:    { fontSize: 14, color: '#333', marginBottom: 6 },
  errMsg:    { fontSize: 11, color: '#c0392b', marginTop: 3 }
}
