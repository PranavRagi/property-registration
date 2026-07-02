interface Props {
  src:     string
  onClose: () => void
}

export default function Lightbox({ src, onClose }: Props) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <button style={s.close} onClick={onClose}>✕</button>
      <img
        src={src}
        alt="zoomed"
        style={s.img}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,37,47,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  close:   { position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 18, cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img:     { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)' },
}
