import { useState } from 'react'
import { saveAdminToken } from '../utils/auth'

interface Props { onLogin: () => void }

export default function AdminLogin({ onLogin }: Props) {
  const [tab,     setTab]     = useState<'login' | 'register'>('login')
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const BACKEND = "https://property-registration-production.up.railway.app"

  async function handleSubmit() {
    setLoading(true)
    setMessage('')
    
    const url = tab === 'login'
      ? `${BACKEND}/admin/login`
      : `${BACKEND}/admin/register`

    try {
      const res  = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form)
      })
      const data = await res.json()
      setSuccess(data.success)
      setMessage(data.message)

      if (data.success && tab === 'login') {
        saveAdminToken(data.token, data.username)
        setTimeout(() => onLogin(), 500)
      }
      if (data.success && tab === 'register') {
        setTimeout(() => { setTab('login'); setMessage('') }, 1500)
      }
    } catch {
      setMessage('Could not connect to server.')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>🔐</div>
        <h1 style={s.title}>Admin {tab === 'login' ? 'Login' : 'Register'}</h1>
        <p style={s.sub}>Main Office Access Only</p>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'login'    ? s.tabActive : {}) }}
            onClick={() => { setTab('login');    setMessage('') }}
          >Login</button>
          <button
            style={{ ...s.tab, ...(tab === 'register' ? s.tabActive : {}) }}
            onClick={() => { setTab('register'); setMessage('') }}
          >Register</button>
        </div>

        <div style={s.field}>
          <label style={s.label}>Username</label>
          <input
            style={s.input}
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            placeholder="Admin username"
          />
        </div>

        {tab === 'register' && (
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="Admin email"
            />
          </div>
        )}

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {message && (
          <div style={{
            ...s.msg,
            background: success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            color:      success ? 'var(--color-success)' : 'var(--color-danger-dark)',
            border:     `1px solid ${success ? 'var(--color-success)' : 'var(--color-danger)'}`
          }}>
            {message}
          </div>
        )}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Register'}
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', background: 'linear-gradient(145deg, var(--color-primary-dark) 0%, #0d1117 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' },
  card:      { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8) var(--space-6)', width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' },
  icon:      { fontSize: 40, textAlign: 'center', marginBottom: 'var(--space-2)' },
  title:     { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' },
  sub:       { fontSize: 12, color: 'var(--color-danger)', textAlign: 'center', marginBottom: 'var(--space-5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  tabs:      { display: 'flex', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 'var(--space-5)', border: '1px solid var(--color-border)' },
  tab:       { flex: 1, padding: '10px var(--space-4)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', borderRadius: 5 },
  tabActive: { background: 'var(--color-primary-dark)', color: 'white', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  field:     { marginBottom: 'var(--space-4)' },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' },
  input:     { width: '100%', padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--color-surface)' },
  msg:       { padding: '10px var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)', textAlign: 'center', fontWeight: 500 },
  btn:       { width: '100%', padding: '12px var(--space-4)', background: 'var(--color-primary-dark)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' },
}