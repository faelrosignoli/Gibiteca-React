import { useRef, useState, useEffect } from 'react'
import { useStore } from '../lib/store.jsx'
import logo from '../assets/logo.png'

export default function Header({ onNotice, onCloud, onBulk }) {
  const { obras, editoras, loadBackup, cloud, sync } = useStore()
  const fileRef = useRef(null)
  const [menu, setMenu] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { loadBackup(JSON.parse(r.result)) } catch (_) { alert('Arquivo inválido.') } }
    r.readAsText(f); e.target.value = ''
  }
  const exportJSON = () => {
    const data = { version: 1, exported: new Date().toISOString(), obras, editoras }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'gibiteca-backup-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMenu(false)
  }

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-4 pt-3.5 pb-2">
      <div className="mx-auto max-w-[1320px] flex items-center gap-3 rounded-[20px] border-[1.5px] border-moss-line bg-paper/80 backdrop-blur-md px-3 sm:px-5 py-3 shadow-[0_22px_46px_-18px_rgba(35,39,28,.6)]">
        <img src={logo} alt="Minha Gibiteca" className="h-9 sm:h-11 w-auto shrink-0" />

        {/* espaçador: empurra os botões para a direita */}
        <div className="flex-1" />

        <div className="flex items-center gap-2 shrink-0">
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />

          {/* Nuvem (sincronização com o GitHub) */}
          <button className="neo-icon sm:hidden relative" title="Sincronizar" onClick={onCloud}>
            <IconCloud /><SyncDot sync={sync} />
          </button>
          <button className="neo-btn hidden sm:inline-flex relative" onClick={onCloud}>
            <span className="relative inline-flex"><IconCloud /><SyncDot sync={sync} /></span>
            <span className="hidden lg:inline">Nuvem</span>
          </button>

          {/* Capas em massa */}
          <button className="neo-icon sm:hidden" title="Enviar capas" onClick={onBulk}>
            <IconImage />
          </button>
          <button className="neo-btn hidden sm:inline-flex" onClick={onBulk}>
            <IconImage /><span className="hidden lg:inline">Capas</span>
          </button>

          {/* Backup (menu) */}
          <div className="relative" ref={wrapRef}>
            <button className="neo-icon sm:hidden" title="Backup" onClick={() => setMenu(m => !m)}><IconBackup /></button>
            <button className="neo-btn hidden sm:inline-flex" onClick={() => setMenu(m => !m)}>
              <IconBackup /><span className="hidden lg:inline">Backup</span>
              <svg className="w-3.5 h-3.5 -ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {menu && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[230px] rounded-[10px] border-[1.5px] border-ink bg-paper p-1.5 shadow-[0_14px_32px_-12px_rgba(35,39,28,.5)] flex flex-col gap-0.5">
                <button onClick={exportJSON} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-semibold text-ink hover:bg-paper-2 text-left">
                  <svg className="w-4 h-4 text-ink-soft shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  Baixar backup (.json)
                </button>
                <button onClick={() => { setMenu(false); fileRef.current?.click() }} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-semibold text-ink hover:bg-paper-2 text-left">
                  <svg className="w-4 h-4 text-ink-soft shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5-5 5 5M12 4v12" /></svg>
                  Restaurar backup (.json)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

const IconCloud = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 16" /><path d="M8 16h9.5" /></svg>
)
const SyncDot = ({ sync }) => {
  const c = { off: 'bg-[#b9b9a5]', ok: 'bg-moss', sync: 'bg-gold animate-pulse', pending: 'bg-gold animate-pulse', err: 'bg-rust' }[sync] || 'bg-[#b9b9a5]'
  if (sync === 'off' || !sync) return null
  return <span className={`absolute -right-1 -bottom-1 w-[9px] h-[9px] rounded-full border-2 border-paper ${c}`} />
}
const IconImage = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>
)
const IconBackup = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 1 0 9 9M12 3v6h6M12 3a9 9 0 0 1 9 9" /></svg>
)
