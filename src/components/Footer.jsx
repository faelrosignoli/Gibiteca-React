import { useStore } from '../lib/store.jsx'
import { tipoOf, statusMatch } from '../lib/helpers.js'
import Ticker from './Ticker.jsx'

export default function Footer() {
  const { obras } = useStore()
  const sb = obras.filter(o => { const t = tipoOf(o); return t === 'serie' || t === 'box' }).length
  const tenho = obras.filter(o => statusMatch(o, 'biblioteca')).length
  const stats = [[obras.length, 'obras'], [sb, 'séries / boxes'], [tenho, 'na estante']]
  return (
    <footer className="mt-11 border-t border-separador">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-14 pt-8 pb-28">
        <div className="flex flex-wrap justify-between gap-8 items-start">
          <p className="max-w-[430px] text-ink-soft text-corpo leading-relaxed">
            <span className="font-display font-bold text-lg block text-ink mb-1">Minha Gibiteca</span>
            Sua gibiteca pessoal — organize a coleção, acompanhe o que falta e nunca perca o fio da meada.
          </p>
          <div className="flex gap-7 flex-wrap">
            {stats.map(([n, l]) => (
              <div key={l} className="flex flex-col gap-1">
                <span className="font-display font-extrabold text-secao leading-none text-ink"><Ticker value={n} /></span>
                <span className="font-mono text-rotulo  uppercase text-ink-faint font-bold">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-4.5 pt-4 border-t border-dashed border-separador text-center sm:text-left">
          <span className="text-apoio text-ink-faint">© {new Date().getFullYear()} · Minha Gibiteca · feito com 📚 e ☕</span>
          <button className="pill-btn mx-auto sm:mx-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao topo <span className="text-obra">↑</span></button>
        </div>
      </div>
    </footer>
  )
}
