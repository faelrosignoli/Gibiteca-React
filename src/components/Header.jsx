import { useRef } from 'react'
import { useStore } from '../lib/store.jsx'
import logo from '../assets/logo.png'

export default function Header({ onNew }) {
  const { filters, setFilter, loadBackup } = useStore()
  const fileRef = useRef(null)

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { loadBackup(JSON.parse(r.result)) } catch (_) { alert('Arquivo inválido.') } }
    r.readAsText(f); e.target.value = ''
  }

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-4 pt-3.5 pb-2">
      <div className="mx-auto max-w-[1320px] flex items-center gap-3 sm:gap-6 rounded-[20px] border-[1.5px] border-moss-line bg-paper/80 backdrop-blur-md px-4 py-3 shadow-[0_22px_46px_-18px_rgba(35,39,28,.6)]">
        <img src={logo} alt="Minha Gibiteca" className="h-9 sm:h-11 w-auto shrink-0" />
        <div className="relative flex-1 min-w-0 hidden sm:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            value={filters.q}
            onChange={e => setFilter('q', e.target.value)}
            placeholder="Buscar na coleção…"
            className="w-full rounded-[10px] border-[1.5px] border-ink bg-surface pl-9 pr-3 py-2.5 text-sm text-ink outline-none shadow-neo-sm focus:border-moss"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
          <button className="neo-btn" onClick={() => fileRef.current?.click()} title="Carregar backup (.json)">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15V3M8 7l4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
            <span className="hidden md:inline">Backup</span>
          </button>
        </div>
      </div>
      {/* busca no mobile */}
      <div className="sm:hidden mx-auto max-w-[1320px] mt-2 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          value={filters.q}
          onChange={e => setFilter('q', e.target.value)}
          placeholder="Buscar…"
          className="w-full rounded-[10px] border-[1.5px] border-ink bg-surface pl-9 pr-3 py-2.5 text-sm text-ink outline-none shadow-neo-sm focus:border-moss"
        />
      </div>
    </header>
  )
}
