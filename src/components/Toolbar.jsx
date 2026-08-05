import { useStore } from '../lib/store.jsx'

export default function Toolbar({ onFilters, onStats, filterCount }) {
  const { view, setView } = useStore()
  return (
    <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-3 flex flex-wrap items-center gap-2">
      <button className="neo-btn" onClick={onFilters}>
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
        Filtros{filterCount ? <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-moss text-white text-[11px] font-bold">{filterCount}</span> : null}
      </button>
      <button className="neo-btn" onClick={onStats}>
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
        Estatísticas
      </button>
      <div className="ml-auto inline-flex rounded-[10px] border-[1.5px] border-ink overflow-hidden shadow-neo-sm">
        {['galeria', 'lista'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 text-[13px] font-semibold ${view === v ? 'bg-moss text-white' : 'bg-paper text-ink'}`}>
            {v === 'galeria' ? 'Galeria' : 'Lista'}
          </button>
        ))}
      </div>
    </div>
  )
}
