import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  coverOf, tipoOf, edOf, ownedCount, unitsOf, missingVols, avgNota,
  anyUrg, statusMatch, initials, tintFor, isImp,
} from '../lib/helpers.js'

function Stars({ n }) {
  if (!n) return null
  return (
    <span className="text-gold text-[11px] tracking-tight" aria-label={`nota ${n}`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={n >= i ? '' : n >= i - 0.5 ? 'opacity-60' : 'opacity-25'}>★</span>
      ))}
    </span>
  )
}

export default function Card({ obra, index = 0, onOpen }) {
  const cover = coverOf(obra)
  const t = tipoOf(obra)
  const multi = t === 'serie' || t === 'box'
  const total = unitsOf(obra).length
  const owned = ownedCount(obra)
  const miss = missingVols(obra)
  const nota = avgNota(obra)
  const hasNote = obra.resenha && obra.resenha.trim()
  const owns = statusMatch(obra, 'biblioteca')

  // tilt 3D
  const px = useMotionValue(0.5), py = useMotionValue(0.5)
  const rotY = useSpring(useTransform(px, [0, 1], [7, -7]), { stiffness: 200, damping: 16 })
  const rotX = useSpring(useTransform(py, [0, 1], [-7, 7]), { stiffness: 200, damping: 16 })
  const onMove = (e) => {
    if (e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => { px.set(0.5); py.set(0.5) }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.3), ease: [0.2, 0.8, 0.3, 1] }}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 720 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={{ y: -3 }}
      onClick={() => onOpen?.(obra)}
      className="group relative cursor-pointer rounded-xl2 border-[1.5px] border-moss-line bg-surface overflow-hidden shadow-neo-sm"
    >
      {/* glare */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-screen"
        style={{
          background: useTransform([px, py], ([x, y]) =>
            `radial-gradient(170px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,.42), transparent 60%)`),
        }}
      />
      {/* cover */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-white p-1.5">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="max-w-full max-h-full w-auto h-auto object-contain rounded-md" />
        ) : (
          <div className="w-full h-full rounded-md flex flex-col items-center justify-center text-white text-center p-2"
               style={{ background: tintFor(obra.nome) }}>
            <div className="font-serif font-bold text-4xl leading-none">{initials(obra.nome)}</div>
            <div className="font-serif text-[13px] leading-tight mt-2 line-clamp-3">{obra.nome}</div>
          </div>
        )}
        {isImp(obra) && (
          <span className="absolute top-1.5 right-1.5 z-[3] font-mono text-[8px] tracking-wide uppercase bg-ink/85 text-paper px-1.5 py-0.5 rounded">imp</span>
        )}
        {anyUrg(obra) && (
          <span className="absolute top-1.5 left-1.5 z-[3] text-[12px]" title="Urgente">⚠️</span>
        )}
      </div>
      {/* body */}
      <div className="p-2.5 flex flex-col gap-0.5">
        {edOf(obra) && <div className="font-mono text-[8.5px] tracking-wide uppercase text-ink-faint truncate">{edOf(obra)}</div>}
        <div className="font-serif text-[14px] leading-tight text-ink line-clamp-2">
          {obra.nome}{hasNote && <span className="text-gold text-[11px] ml-1 align-middle" title="Tem anotação">✎</span>}
        </div>
        <div className="text-[11.5px] text-ink-soft truncate">
          {multi ? `${total} ${t === 'box' ? 'livro(s)' : 'volume(s)'}` : (obra.roteirista || obra.desenhista || '—')}
        </div>
        {multi && total > 0 && (
          <div className="mt-1.5">
            <div className="h-1.5 rounded-full bg-paper-3 overflow-hidden">
              <div className="h-full bg-moss rounded-full" style={{ width: `${Math.round(owned / total * 100)}%` }} />
            </div>
            <div className="mt-1 text-[10px] font-semibold">
              {owned >= total
                ? <span className="text-moss">completa ✓</span>
                : miss.length ? <span className="text-rust">faltam: {miss.slice(0, 6).join(', ')}{miss.length > 6 ? '…' : ''}</span> : null}
            </div>
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <span className={`font-mono text-[8.5px] tracking-wide uppercase px-2 py-0.5 rounded-full border ${owns ? 'border-moss text-moss' : 'border-gold text-gold'}`}>
            {owns ? 'Tenho' : 'Quero'}
          </span>
          {nota > 0 && <Stars n={nota} />}
        </div>
      </div>
    </motion.div>
  )
}
