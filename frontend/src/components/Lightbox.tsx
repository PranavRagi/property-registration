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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  close:   { position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer' },
  img:     { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 6 }
}
