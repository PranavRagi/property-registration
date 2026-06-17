import { setFirstLoginDone } from '../utils/auth'

interface Props {
  username: string
  onSelect: (mode: 'seller' | 'buyer') => void
}

export default function ModeSelect({ username, onSelect }: Props) {
  function handleSelect(mode: 'seller' | 'buyer') {
    setFirstLoginDone(mode)
    onSelect(mode)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.wave}>👋</div>
        <h1 style={s.title}>Welcome, {username}!</h1>
        <p style={s.sub}>How do you want to get started today?</p>

        <div style={s.options}>
          {/* Seller Option */}
          <button style={s.option} onClick={() => handleSelect('seller')}>
            <span style={s.optIcon}>🏢</span>
            <p style={s.optTitle}>I'm a Seller</p>
            <p style={s.optDesc}>List and manage your properties. Track listings, analytics and connect with buyers.</p>
            <span style={s.optBtn}>Start as Seller →</span>
          </button>

          {/* Buyer Option */}
          <button style={s.option} onClick={() => handleSelect('buyer')}>
            <span style={s.optIcon}>👤</span>
            <p style={s.optTitle}>I'm a Buyer</p>
            <p style={s.optDesc}>Search and find your dream property. Browse listings, view maps and contact sellers.</p>
            <span style={s.optBtn}>Start as Buyer →</span>
          </button>
        </div>

        <p style={s.hint}>💡 You can switch between modes anytime from the sidebar</p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:    { background: 'white', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' },
  wave:    { fontSize: 48, marginBottom: 12 },
  title:   { fontSize: 24, fontWeight: 700, color: '#222', marginBottom: 8 },
  sub:     { fontSize: 15, color: '#888', marginBottom: 32 },
  options: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  option:  { background: '#f8f9fa', border: '2px solid #eee', borderRadius: 12, padding: '24px 20px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s' },
  optIcon: { fontSize: 36 },
  optTitle:{ fontSize: 16, fontWeight: 700, color: '#222' },
  optDesc: { fontSize: 12, color: '#888', lineHeight: 1.5 },
  optBtn:  { fontSize: 13, color: '#2980b9', fontWeight: 600, marginTop: 4 },
  hint:    { fontSize: 12, color: '#aaa' },
}