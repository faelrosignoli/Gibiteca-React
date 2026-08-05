import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  coverOf, tipoOf, edOf, ownedCount, unitsOf, missingVols, avgNota,
  anyUrg, statusMatch, initials, tintFor, isImp, volsOf,
} from '../lib/helpers.js'

function Stars({ n }) {
  if (!n) return null
  return (
    <span className="text-gold text-[11px] tracking-tight" aria-label={`nota ${n}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={n >= i ? '' : n >= i - 0.5 ? 'opacity-60' : 'opacity-25'}>★</span>
      ))}
    </span>
  )
}

// selo de urgente — fiel à imagem: quadrado arredondado cor rust + triângulo branco
function UrgBadge() {
  return (
    <span className="absolute top-1.5 right-1.5 z-[4] w-[26px] h-[26px] rounded-[8px] bg-rust text-white flex items-center justify-center shadow-[0_2px_8px_rgba(35,39,28,.3)]" title="Urgente">
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
    </span>
  )
}

// selo de tipo (série / box) — canto inferior esquerdo da capa
function TypeBadge({ t, count }) {
  if (t === 'box') return (
    <span className="absolute bottom-1.5 left-1.5 z-[3] inline-flex items-center gap-1 font-mono text-[8px] font-extrabold tracking-wide uppercase px-1.5 py-[3px] rounded-[5px] bg-box text-white shadow-[0_2px_6px_rgba(35,39,28,.3)]">
      <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 8l9-5 9 5-9 5-9-5zM3 8v8l9 5 9-5V8" /></svg>Box {count || ''}
    </span>
  )
  if (t === 'serie') return (
    <span className="absolute bottom-1.5 left-1.5 z-[3] inline-flex items-center gap-1 font-mono text-[8px] font-extrabold tracking-wide uppercase px-1.5 py-[3px] rounded-[5px] bg-moss text-white shadow-[0_2px_6px_rgba(35,39,28,.3)]">
      <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 5h10v14H4zM17 7h3v12h-3" /></svg>Série {count || ''}
    </span>
  )
  return null
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

  // tilt 3D (sem brilho)
  const px = useMotionValue(0.5), py = useMotionValue(0.5)
  const rotY = useSpring(useTransform(px, [0, 1], [6, -6]), { stiffness: 200, damping: 16 })
  const rotX = useSpring(useTransform(py, [0, 1], [-6, 6]), { stiffness: 200, damping: 16 })
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
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 720, boxShadow: '3px 3px 0 var(--ink)' }}
      whileHover={{ y: -3, boxShadow: '5px 5px 0 var(--ink)' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={() => onOpen?.(obra)}
      className="relative cursor-pointer rounded-xl2 border-[1.5px] border-ink bg-surface overflow-hidden"
    >
      {/* capa */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-white p-1.5">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="max-w-full max-h-full w-auto h-auto object-contain rounded-md" />
        ) : (
          <div className="w-full h-full rounded-md flex flex-col p-2.5 text-white"
               style={{ background: `linear-gradient(160deg, ${tintFor(edOf(obra) || obra.nome)}, ${tintFor(edOf(obra) || obra.nome)}dd)` }}>
            {(edOf(obra) || (isImp(obra) ? 'Importado' : '')) &&
              <div className="font-mono text-[8.5px] tracking-[.14em] uppercase opacity-90 truncate">{edOf(obra) || 'Importado'}</div>}
            <div className="font-serif font-bold text-[40px] leading-none my-auto text-center">{initials(obra.nome)}</div>
            <div className="h-[2px] bg-white/50" />
            <div className="font-serif text-[12px] leading-tight mt-1.5 line-clamp-2">{obra.nome}</div>
          </div>
        )}
        {multi && <TypeBadge t={t} count={volsOf(obra).length} />}
        {anyUrg(obra) && <UrgBadge />}
      </div>

      {/* corpo */}
      <div className="p-2.5 flex flex-col gap-0.5">
        {edOf(obra) && <div className="font-mono text-[8.5px] tracking-wide uppercase text-moss-2 font-bold truncate">{edOf(obra)}</div>}
        <div className="font-serif text-[14px] leading-tight text-ink line-clamp-2">
          {obra.nome}{hasNote && <span className="text-gold text-[11px] ml-1 align-middle" title="Tem anotação">✎</span>}
        </div>
        <div className="text-[11.5px] text-ink-faint truncate">
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
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <span className={`pill ${owns ? 'pill-tenho' : 'pill-quero'}`}>
            {multi && owns && owned < total ? `Tenho ${owned}/${total}` : owns ? 'Tenho' : 'Quero'}
          </span>
          {isImp(obra) && <span className="pill pill-imp">Importado</span>}
          {nota > 0 && <Stars n={nota} />}
        </div>
      </div>
    </motion.div>
  )
}
