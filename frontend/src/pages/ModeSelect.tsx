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
  page:    { minHeight: '100vh', background: 'linear-gradient(145deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' },
  card:    { background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8) var(--space-6)', width: '100%', maxWidth: 580, boxShadow: 'var(--shadow-xl)', textAlign: 'center', border: '1px solid var(--color-border)' },
  wave:    { fontSize: 44, marginBottom: 'var(--space-3)' },
  title:   { fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' },
  sub:     { fontSize: 15, color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' },
  options: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' },
  option:  { background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6) var(--space-5)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', transition: 'border-color var(--transition), box-shadow var(--transition)' },
  optIcon: { fontSize: 32 },
  optTitle:{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' },
  optDesc: { fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.55 },
  optBtn:  { fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, marginTop: 'var(--space-1)' },
  hint:    { fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' },
}