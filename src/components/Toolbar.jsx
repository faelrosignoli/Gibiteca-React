import { useStore } from '../lib/store.jsx'

export default function Toolbar({ onFilters, onStats, onSearch, filterCount }) {
  const { view, setView, filters } = useStore()
  return (
    <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-3 flex flex-wrap items-center gap-2">
      {/* busca vira botão -> abre pop-up */}
      <button className="neo-btn !px-3" onClick={onSearch} title="Buscar" aria-label="Buscar">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        {filters.q ? <span className="w-[7px] h-[7px] rounded-full bg-moss" /> : null}
      </button>

      <button className="neo-btn flex-1 sm:flex-none justify-center" onClick={onFilters}>
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        Filtros{filterCount ? <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-moss text-white text-[11px] font-bold">{filterCount}</span> : null}
      </button>
      <button className="neo-btn flex-1 sm:flex-none justify-center" onClick={onStats}>
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
        Estatísticas
      </button>

      <div className="ml-auto inline-flex w-full sm:w-auto rounded-[10px] border-[1.5px] border-ink overflow-hidden shadow-neo-sm">
        {[['galeria', 'Galeria'], ['lista', 'Lista']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-semibold ${view === v ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-paper-2'}`}>
            {v === 'galeria'
              ? <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              : <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>}
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
