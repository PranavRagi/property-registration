import { useState } from 'react'
import { saveToken } from '../utils/auth'

// const BACKEND = import.meta.env.VITE_BACKEND_URL || ''
const BACKEND = "https://property-registration-production.up.railway.app"

interface Props { onLogin: () => void }

export default function AuthPage({ onLogin }: Props) {
  const [tab,     setTab]     = useState<'login' | 'register'>('login')
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!form.username || !form.password) { setMessage('Please fill all fields.'); setSuccess(false); return }
    if (tab === 'register' && !form.email) { setMessage('Email is required.'); setSuccess(false); return }

    setLoading(true)
    setMessage('')

    try {
      const res  = await fetch(`${BACKEND}/auth/${tab}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form)
      })
      const data = await res.json()
      setSuccess(data.success)
      setMessage(data.message)

      if (data.success && tab === 'login') {
        saveToken(data.token, data.username)
        setTimeout(() => onLogin(), 400)
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
        <div style={s.logo}>🏠</div>
        <h1 style={s.title}>Property Registration</h1>
        <p style={s.sub}>Your complete real estate platform</p>

        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === 'login'    ? s.tabActive : {}) }} onClick={() => { setTab('login');    setMessage('') }}>Login</button>
          <button style={{ ...s.tab, ...(tab === 'register' ? s.tabActive : {}) }} onClick={() => { setTab('register'); setMessage('') }}>Register</button>
        </div>

        <div style={s.field}>
          <label style={s.label}>Username</label>
          <input style={s.input} placeholder="Enter username" value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}/>
        </div>

        {tab === 'register' && (
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="Enter email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/>
          </div>
        )}

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="Enter password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
        </div>

        {message && (
          <div style={{ ...s.msg, background: success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: success ? 'var(--color-success)' : 'var(--color-danger-dark)', border: `1px solid ${success ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
            {message}
          </div>
        )}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
        </button>

        {/* <p style={s.adminLink}>
          Admin? <a href="/admin" style={{ color: '#2980b9', textDecoration: 'none' }}>Admin Panel →</a>
        </p> */}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', background: 'linear-gradient(145deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' },
  card:      { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8) var(--space-6)', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' },
  logo:      { fontSize: 44, textAlign: 'center', marginBottom: 'var(--space-2)' },
  title:     { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' },
  sub:       { fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 'var(--space-6)' },
  tabs:      { display: 'flex', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 'var(--space-5)', border: '1px solid var(--color-border)' },
  tab:       { flex: 1, padding: '10px var(--space-4)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', borderRadius: 5 },
  tabActive: { background: 'var(--color-primary)', color: 'white', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  field:     { marginBottom: 'var(--space-4)' },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' },
  input:     { width: '100%', padding: '10px var(--space-3)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-text)' },
  msg:       { padding: '10px var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)', textAlign: 'center', fontWeight: 500 },
  btn:       { width: '100%', padding: '12px var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' },
  adminLink: { textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' },
}
