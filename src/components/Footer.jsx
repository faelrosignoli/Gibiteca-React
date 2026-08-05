import { useStore } from '../lib/store.jsx'
import { tipoOf, statusMatch, tagsOf } from '../lib/helpers.js'
import Ticker from './Ticker.jsx'

export default function Footer() {
  const { obras } = useStore()
  const sb = obras.filter(o => { const t = tipoOf(o); return t === 'serie' || t === 'box' }).length
  const tenho = obras.filter(o => statusMatch(o, 'biblioteca')).length
  const generos = new Set(obras.flatMap(tagsOf)).size
  const stats = [[obras.length, 'obras'], [sb, 'séries / boxes'], [tenho, 'na estante'], [generos, 'gêneros']]
  return (
    <footer className="mt-11 border-t-[1.5px] border-moss-line">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-14 pt-8 pb-28">
        <div className="flex flex-wrap justify-between gap-8 items-start">
          <p className="max-w-[430px] text-ink-soft text-[13.5px] leading-relaxed">
            <span className="font-serif font-bold text-lg block text-ink mb-1">Minha Gibiteca</span>
            Sua gibiteca pessoal — organize a coleção, acompanhe o que falta e nunca perca o fio da meada.
          </p>
          <div className="flex gap-7 flex-wrap">
            {stats.map(([n, l]) => (
              <div key={l} className="flex flex-col gap-1">
                <span className="font-serif font-extrabold text-[23px] leading-none text-ink"><Ticker value={n} /></span>
                <span className="font-mono text-[9.5px] tracking-widest uppercase text-ink-faint font-bold">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-4.5 pt-[18px] border-t border-dashed border-moss-line text-center sm:text-left">
          <span className="text-[12px] text-ink-faint">© {new Date().getFullYear()} · Minha Gibiteca · feito com 📚 e ☕</span>
          <button className="neo-btn mx-auto sm:mx-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao topo <span className="text-[15px]">↑</span></button>
        </div>
      </div>
    </footer>
  )
}
