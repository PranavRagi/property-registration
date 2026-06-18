import { useState } from 'react'
import { saveToken } from '../utils/auth'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

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
          <div style={{ ...s.msg, background: success ? '#eef7f1' : '#fdf3f2', color: success ? '#27ae60' : '#c0392b', border: `1px solid ${success ? '#27ae60' : '#e74c3c'}` }}>
            {message}
          </div>
        )}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
        </button>

        <p style={s.adminLink}>
          Admin? <a href="/admin" style={{ color: '#2980b9', textDecoration: 'none' }}>Admin Panel →</a>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:      { background: 'white', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo:      { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title:     { fontSize: 22, fontWeight: 700, color: '#222', textAlign: 'center', marginBottom: 4 },
  sub:       { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  tabs:      { display: 'flex', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', marginBottom: 20 },
  tab:       { flex: 1, padding: 10, background: '#f8f8f8', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#888' },
  tabActive: { background: '#2c3e50', color: 'white' },
  field:     { marginBottom: 16 },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 5 },
  input:     { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  msg:       { padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  btn:       { width: '100%', padding: 12, background: '#2c3e50', color: 'white', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16 },
  adminLink: { textAlign: 'center', fontSize: 12, color: '#aaa' },
}