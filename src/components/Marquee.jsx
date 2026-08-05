import { useStore } from '../lib/store.jsx'
import { coverOf } from '../lib/helpers.js'

export default function Marquee({ onOpen }) {
  const { obras, view } = useStore()
  const withCover = obras.filter(coverOf).slice().sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 14)
  if (view !== 'galeria' || withCover.length < 6) return null
  const row = [...withCover, ...withCover]
  return (
    <div className="relative mt-2 mb-5 overflow-hidden rounded-xl2 border-[1.5px] border-moss-line bg-paper-2 py-3 group">
      <div className="absolute left-3.5 -top-2.5 z-[2] bg-paper border-[1.5px] border-moss-line rounded-full px-2.5 py-0.5 font-mono text-[9px] tracking-widest uppercase text-ink-soft">Adicionados recentemente</div>
      <div className="flex gap-3 w-max animate-[marquee_34s_linear_infinite] group-hover:[animation-play-state:paused]">
        {row.map((o, i) => (
          <button key={i} onClick={() => onOpen?.(o)} title={o.nome}
            className="w-[58px] h-[78px] rounded-lg overflow-hidden shrink-0 border-[1.5px] border-ink bg-white shadow-neo-sm hover:-translate-y-0.5 transition">
            <img src={coverOf(o)} alt="" loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
