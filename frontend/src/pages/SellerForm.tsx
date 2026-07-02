import { useState, useEffect } from 'react'
import Lightbox from '../components/Lightbox'
import { PropertyForm, Property } from '../types'
import { getUsername } from '../utils/auth'
import { apiFetch } from '../utils/api'

const empty: PropertyForm = {
  propertyName: '', size: '', bedroomType: '3BHK', propertyType: '',
  positionDate: '', propertyAge: '', sqftPrice: '', boxPrice: '',
  neighbourhood: '', geoLocation: '', sellerName: '', contactNo: '', email: '', status: '',
  floorNumber: '', totalFloors: '', isNegotiable: false
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
        status:        editProperty.status || '',
        floorNumber:   (editProperty as any).floorNumber  || '',
        totalFloors:   (editProperty as any).totalFloors  || '',
        isNegotiable:  (editProperty as any).isNegotiable || false,
      })
      setPreviews(editProperty.images.map(img => img))
    } else {
      setForm(empty)
      setPreviews([])
    }
    setResult(null)
    setError('')
  }, [editProperty])

  function onChange(field: keyof PropertyForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 4)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.propertyName.trim()) e.propertyName  = 'Property Name is required.'
    if (!form.size.trim())         e.size          = 'Size is required.'
    if (!form.propertyType)        e.propertyType  = 'Please select property type.'
    if (!form.sqftPrice.trim())    e.sqftPrice     = 'Sqft price is required.'
    if (!form.neighbourhood.trim())e.neighbourhood = 'Neighbourhood is required.'
    if (!form.geoLocation.trim())  e.geoLocation   = 'Geo location is required.'
    if (!form.sellerName.trim())   e.sellerName    = 'Seller name is required.'
    if (!form.contactNo.trim())    e.contactNo     = 'Contact number is required.'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required.'
    if (isUnderConstruction && !form.positionDate) e.positionDate = 'Position date is required.'
    if (isImmediate && !form.propertyAge)          e.propertyAge  = 'Property age is required.'
    if (form.floorNumber && !form.totalFloors)     e.totalFloors  = 'Total floors is required when floor number is set.'
    if (form.totalFloors && !form.floorNumber)     e.floorNumber  = 'Floor number is required when total floors is set.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    setLoading(true)
    setError('')
    setResult(null)

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    images.forEach(img => fd.append('images', img))
    fd.append('ownerUsername', getUsername() || '')

    try {
      const endpoint = isEditMode ? `/property/${editProperty!.propertyID}` : '/register'
      const method   = isEditMode ? 'PUT' : 'POST'
      const res      = await apiFetch(endpoint, { method, body: fd })

      if (!res) return
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

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

        {/* Property Details */}
        <Section title="Property Details">
          <Field label="Property Name">
            <input style={s.input} value={form.propertyName} onChange={e => onChange('propertyName', e.target.value)} placeholder="e.g. Pranav Villa"/>
            {errors.propertyName && <p style={s.errMsg}>{errors.propertyName}</p>}
          </Field>
          <Row>
            <Field label="Size (sq ft)">
              <input style={s.input} value={form.size} onChange={e => onChange('size', e.target.value)} placeholder="e.g. 1685"/>
              {errors.size && <p style={s.errMsg}>{errors.size}</p>}
            </Field>
            <Field label="Bedroom Type">
              <select style={s.input} value={form.bedroomType} onChange={e => onChange('bedroomType', e.target.value)}>
                <option value="">-- Select --</option>
                <option>1BHK</option>
                <option>2BHK</option>
                <option>3BHK</option>
                <option>4BHK</option>
                <option>5BHK+</option>
              </select>
              {errors.bedroomType && <p style={s.errMsg}>{errors.bedroomType}</p>}
            </Field>
          </Row>
          <Field label="Property Type">
            <select style={s.input} value={form.propertyType} onChange={e => onChange('propertyType', e.target.value)}>
              <option value="">-- Select --</option>
              <option>Under Construction</option>
              <option>Immediate Available</option>
            </select>
            {errors.propertyType && <p style={s.errMsg}>{errors.propertyType}</p>}
          </Field>
          {isUnderConstruction && (
            <Field label="Position Date">
              <input style={s.input} type="date" value={form.positionDate} onChange={e => onChange('positionDate', e.target.value)}/>
              {errors.positionDate && <p style={s.errMsg}>{errors.positionDate}</p>}
            </Field>
          )}
          {isImmediate && (
            <Field label="Property Age (years)">
              <input style={s.input} value={form.propertyAge} onChange={e => onChange('propertyAge', e.target.value)} placeholder="e.g. 2"/>
              {errors.propertyAge && <p style={s.errMsg}>{errors.propertyAge}</p>}
            </Field>
          )}
        </Section>

        {/* Floor Details — NEW */}
        <Section title="Floor Details">
          <Row>
            <Field label="Floor Number">
              <input
                style={s.input}
                value={form.floorNumber}
                onChange={e => onChange('floorNumber', e.target.value)}
                placeholder="e.g. 5"
                type="number"
                min="0"
              />
              {errors.floorNumber && <p style={s.errMsg}>{errors.floorNumber}</p>}
            </Field>
            <Field label="Total Floors in Building">
              <input
                style={s.input}
                value={form.totalFloors}
                onChange={e => onChange('totalFloors', e.target.value)}
                placeholder="e.g. 6"
                type="number"
                min="1"
              />
              {errors.totalFloors && <p style={s.errMsg}>{errors.totalFloors}</p>}
            </Field>
          </Row>
          {form.floorNumber && form.totalFloors && (
            <p style={s.floorPreview}>
              📐 Floor {form.floorNumber} of {form.totalFloors} — will show as <b>{form.floorNumber}/{form.totalFloors}</b> in Agent Mode
            </p>
          )}
        </Section>

        {/* Cost of Property */}
        <Section title="Cost of Property">
          {(isImmediate || !form.propertyType) && (
            <Field label="Box Price (₹)">
              <input style={s.input} value={form.boxPrice} onChange={e => onChange('boxPrice', e.target.value)} placeholder="e.g. 5000000"/>
              {errors.boxPrice && <p style={s.errMsg}>{errors.boxPrice}</p>}
            </Field>
          )}
          <Field label="Sqft Price (₹)">
            <input style={s.input} value={form.sqftPrice} onChange={e => onChange('sqftPrice', e.target.value)} placeholder="e.g. 6499"/>
            {errors.sqftPrice && <p style={s.errMsg}>{errors.sqftPrice}</p>}
          </Field>

          {/* Negotiable Toggle — NEW */}
          <Field label="Price Negotiable?">
            <div style={s.toggleRow}>
              <button
                type="button"
                style={{ ...s.toggleBtn, ...(form.isNegotiable ? s.toggleOn : s.toggleOff) }}
                onClick={() => onChange('isNegotiable', !form.isNegotiable)}
              >
                {form.isNegotiable ? '✅ Yes — Negotiable' : '❌ No — Fixed Price'}
              </button>
              <p style={s.toggleHint}>
                {form.isNegotiable
                  ? 'Price will show as "Negotiable" in Agent Mode'
                  : 'Actual price will be shown in Agent Mode'}
              </p>
            </div>
          </Field>
        </Section>

        {/* Location */}
        <Section title="Location">
          <Field label="Neighbourhood / Standalone">
            <input style={s.input} value={form.neighbourhood} onChange={e => onChange('neighbourhood', e.target.value)} placeholder="e.g. Banjara Hills"/>
            {errors.neighbourhood && <p style={s.errMsg}>{errors.neighbourhood}</p>}
          </Field>
          <Field label="Geo Location">
            <input style={s.input} value={form.geoLocation} onChange={e => onChange('geoLocation', e.target.value)} placeholder="e.g. Hyderabad, Telangana"/>
            {errors.geoLocation && <p style={s.errMsg}>{errors.geoLocation}</p>}
          </Field>
        </Section>

        {/* Seller Details */}
        <Section title="Seller Details">
          <Field label="Seller Name">
            <input style={s.input} value={form.sellerName} onChange={e => onChange('sellerName', e.target.value)} placeholder="Full name"/>
            {errors.sellerName && <p style={s.errMsg}>{errors.sellerName}</p>}
          </Field>
          <Row>
            <Field label="Contact No.">
              <input style={s.input} value={form.contactNo} onChange={e => onChange('contactNo', e.target.value)} placeholder="+91 XXXXXXXXXX"/>
              {errors.contactNo && <p style={s.errMsg}>{errors.contactNo}</p>}
            </Field>
            <Field label="Email ID">
              <input style={s.input} value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="email@example.com"/>
              {errors.email && <p style={s.errMsg}>{errors.email}</p>}
            </Field>
          </Row>
          <Field label="Property Status">
            <select style={s.input} value={form.status} onChange={e => onChange('status', e.target.value)}>
              <option value="">-- Select --</option>
              <option>Available</option>
              <option>On Hold</option>
              <option>Sold</option>
            </select>
            {errors.status && <p style={s.errMsg}>{errors.status}</p>}
          </Field>
        </Section>

        {/* Images */}
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
  page:         { display: 'flex', justifyContent: 'center' },
  card:         { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8) var(--space-6)', width: '100%', maxWidth: 640, height: 'fit-content', boxShadow: 'var(--shadow-sm)' },
  title:        { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' },
  sub:          { fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' },
  input:        { width: '100%', padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'var(--color-surface)' },
  imgGrid:      { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  imgMain:      { width: '100%', height: 220, objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--color-border)' },
  imgRow:       { display: 'flex', gap: 'var(--space-2)' },
  imgSub:       { flex: 1, height: 90, objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--color-border)' },
  error:        { background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger-dark)', padding: '10px var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-3)', fontWeight: 500 },
  actions:      { display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' },
  btnCancel:    { flex: 1, padding: '10px var(--space-4)', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-secondary)' },
  btnSubmit:    { flex: 1, padding: '10px var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  result:       { background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', textAlign: 'center' },
  idText:       { fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 6 },
  errMsg:       { fontSize: 11, color: 'var(--color-danger-dark)', marginTop: 3 },
  floorPreview: { fontSize: 12, color: 'var(--color-accent)', background: '#f0f7ff', padding: '7px 10px', borderRadius: 'var(--radius-sm)', marginTop: 4 },
  toggleRow:    { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' },
  toggleBtn:    { padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  toggleOn:     { background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' },
  toggleOff:    { background: 'var(--color-danger-bg)', color: 'var(--color-danger-dark)', border: '1px solid var(--color-danger)' },
  toggleHint:   { fontSize: 11, color: 'var(--color-text-muted)', margin: 0 },
}