import { useState, useEffect } from 'react'
import { BuyerForm as BuyerFormType, Buyer } from '../types'
import {getUsername} from '../utils/auth'
import { apiFetch } from '../utils/api'


const empty: BuyerFormType = {
  fullName: '', mobile: '', email: '', address: '',
  budgetMin: '', budgetMax: '', preferredCity: '', preferredType: ''
}

interface Props {
  editBuyer: Buyer | null
  onSaved:   () => void
}

export default function BuyerForm({ editBuyer, onSaved }: Props) {
  const [form,    setForm]    = useState<BuyerFormType>(empty)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [result,  setResult]  = useState<any>(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const isEditMode = !!editBuyer

  // ── Pre-fill form if editing ─────────────────────────────────────────
  useEffect(() => {
    if (editBuyer) {
      setForm({
        fullName:      editBuyer.fullName,
        mobile:        editBuyer.mobile,
        email:         editBuyer.email,
        address:       editBuyer.address,
        budgetMin:     editBuyer.budgetMin,
        budgetMax:     editBuyer.budgetMax,
        preferredCity: editBuyer.preferredCity,
        preferredType: editBuyer.preferredType
      })
    } else {
      setForm(empty)
    }
    setResult(null)
    setErrors({})
    setError('')
  }, [editBuyer])

  function onChange(field: keyof BuyerFormType, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ── Validate ─────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.fullName.trim())      e.fullName      = 'Full name is required.'
    if (!form.mobile.trim())        e.mobile        = 'Mobile number is required.'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required.'
    if (!form.address.trim())       e.address       = 'Address is required.'
    if (!form.budgetMin.trim())     e.budgetMin     = 'Minimum budget is required.'
    if (!form.budgetMax.trim())     e.budgetMax     = 'Maximum budget is required.'
    if (!form.preferredCity.trim()) e.preferredCity = 'Preferred city is required.'
    if (!form.preferredType)        e.preferredType = 'Please select preferred property type.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const endpoint = isEditMode
        ? `/buyer/${editBuyer!.buyerID}`
        : '/buyer/register'
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await apiFetch(endpoint, {
        method,
        body:    JSON.stringify({ ...form, ownerUsername: getUsername() || '' })
      })
      if (!res) { setError('Could not connect to server.'); return }
      const data = await res.json()

      if (!res.ok) { setError(data.message); return }

      if (isEditMode) {
        alert('✅ Buyer updated successfully!')
        onSaved()
      } else {
        setResult(data)
        setForm(empty)
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>👤 {isEditMode ? 'Edit Buyer' : 'Buyer Registration'}</h1>
        <p style={s.sub}>{isEditMode ? `Editing: ${editBuyer?.buyerID}` : 'Register as a buyer'}</p>

        {/* Personal Details */}
        <Section title="Personal Details">
          <Field label="Full Name">
            <input style={s.input} value={form.fullName} onChange={e => onChange('fullName', e.target.value)} placeholder="Enter full name"/>
            {errors.fullName && <p style={s.err}>{errors.fullName}</p>}
          </Field>
          <Row>
            <Field label="Mobile Number">
              <input style={s.input} value={form.mobile} onChange={e => onChange('mobile', e.target.value)} placeholder="+91 XXXXXXXXXX"/>
              {errors.mobile && <p style={s.err}>{errors.mobile}</p>}
            </Field>
            <Field label="Email ID">
              <input style={s.input} value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="email@example.com"/>
              {errors.email && <p style={s.err}>{errors.email}</p>}
            </Field>
          </Row>
          <Field label="Address">
            <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.address} onChange={e => onChange('address', e.target.value)} placeholder="Enter full address"/>
            {errors.address && <p style={s.err}>{errors.address}</p>}
          </Field>
        </Section>

        {/* Property Preferences */}
        <Section title="Property Preferences">
          <Row>
            <Field label="Budget Min (₹)">
              <input style={s.input} value={form.budgetMin} onChange={e => onChange('budgetMin', e.target.value)} placeholder="e.g. 2000000"/>
              {errors.budgetMin && <p style={s.err}>{errors.budgetMin}</p>}
            </Field>
            <Field label="Budget Max (₹)">
              <input style={s.input} value={form.budgetMax} onChange={e => onChange('budgetMax', e.target.value)} placeholder="e.g. 8000000"/>
              {errors.budgetMax && <p style={s.err}>{errors.budgetMax}</p>}
            </Field>
          </Row>
          <Field label="Preferred City / Location">
            <input style={s.input} value={form.preferredCity} onChange={e => onChange('preferredCity', e.target.value)} placeholder="e.g. Hyderabad, Telangana"/>
            {errors.preferredCity && <p style={s.err}>{errors.preferredCity}</p>}
          </Field>
          <Field label="Preferred Property Type">
            <select style={s.input} value={form.preferredType} onChange={e => onChange('preferredType', e.target.value)}>
              <option value="">-- Select --</option>
              <option>3BHK</option>
              <option>4BHK</option>
              <option>Any</option>
            </select>
            {errors.preferredType && <p style={s.err}>{errors.preferredType}</p>}
          </Field>
        </Section>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.actions}>
          <button style={s.btnCancel} onClick={() => { setForm(empty); setErrors({}); setResult(null); setError('') }}>Cancel</button>
          <button style={s.btnSubmit} onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Registering...') : (isEditMode ? 'Update Buyer' : 'Register Buyer')}
          </button>
        </div>

        {/* Success Result */}
        {result && (
          <div style={s.result}>
            <p style={{ color: '#27ae60', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>✅ Buyer Registered!</p>
            <p style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>Buyer ID: <b>{result.buyerID}</b></p>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Scan QR to view buyer profile</p>
            <img src={result.qrCode} alt="QR Code" style={{ width: 160, height: 160 }}/>
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>{result.buyerURL}</p>
          </div>
        )}
      </div>
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
  page:      { display: 'flex', justifyContent: 'center' },
  card:      { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8) var(--space-6)', width: '100%', maxWidth: 640, height: 'fit-content', boxShadow: 'var(--shadow-sm)' },
  title:     { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' },
  sub:       { fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' },
  input:     { width: '100%', padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'var(--color-surface)' },
  err:       { fontSize: 11, color: 'var(--color-danger-dark)', marginTop: 3 },
  error:     { background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger-dark)', padding: '10px var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-3)', fontWeight: 500 },
  actions:   { display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' },
  btnCancel: { flex: 1, padding: '10px var(--space-4)', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-secondary)' },
  btnSubmit: { flex: 1, padding: '10px var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  result:    { background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', textAlign: 'center' },
}
