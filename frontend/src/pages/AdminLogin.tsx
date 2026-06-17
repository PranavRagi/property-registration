import { useState } from 'react'
import { saveAdminToken } from '../utils/auth'

interface Props { onLogin: () => void }

export default function AdminLogin({ onLogin }: Props) {
  const [tab,     setTab]     = useState<'login' | 'register'>('login')
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setMessage('')

    const url = tab === 'login'
      ? '/admin/login'
      : '/admin/register'

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
            background: success ? '#eef7f1' : '#fdf3f2',
            color:      success ? '#27ae60' : '#c0392b',
            border:     `1px solid ${success ? '#27ae60' : '#c0392b'}`
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
  page:      { minHeight: '100vh', background: '#1a252f', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card:      { background: 'white', borderRadius: 8, padding: '36px 32px', width: 380 },
  icon:      { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title:     { fontSize: 20, fontWeight: 700, color: '#222', textAlign: 'center', marginBottom: 4 },
  sub:       { fontSize: 12, color: '#e74c3c', textAlign: 'center', marginBottom: 20, fontWeight: 500 },
  tabs:      { display: 'flex', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  tab:       { flex: 1, padding: 9, background: '#f8f8f8', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#888' },
  tabActive: { background: '#1a252f', color: 'white' },
  field:     { marginBottom: 14 },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 4 },
  input:     { width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  msg:       { padding: '10px 14px', borderRadius: 4, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  btn:       { width: '100%', padding: 11, background: '#1a252f', color: 'white', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer' }
}