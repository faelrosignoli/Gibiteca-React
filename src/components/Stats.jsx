import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_GAVETA, FADE } from '../lib/motion.js'
import { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import {
  unitsOf, edOf, isImp, sumValor, tipoOf, anyUrg, ownedCount, fmtBRL, paisesOf,
} from '../lib/helpers.js'
import Ticker from './Ticker.jsx'

/* ---------- barra horizontal (itens ou dinheiro) ---------- */
function BarRow({ nm, v, max, money, i }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="w-[120px] shrink-0 text-apoio text-ink-soft truncate" title={nm}>{nm}</span>
      <span className="flex-1 h-[8px] rounded-pequeno bg-linha overflow-hidden">
        <motion.span
 className="block h-full rounded-pequeno bg-moss"
          initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.round(v / max * 100))}%` }}
          transition={{ duration: 0.6, delay: 0.05 + i * 0.05, ease: [0.2, 0.8, 0.3, 1] }}
        />
      </span>
      <span className="w-[86px] shrink-0 text-right font-mono text-apoio font-medium tabular-nums whitespace-nowrap text-ink">{money ? fmtBRL(v) : v}</span>
    </div>
  )
}

function Bars({ title, data, money }) {
  const max = Math.max(1, ...data.map(d => d[1]))
  return (
    <div>
      <h4 className="font-display text-obra text-ink mb-4">{title}</h4>
      {data.length
        ? <div className="flex flex-col gap-2.5">{data.map(([nm, v], i) => <BarRow key={nm} nm={nm} v={v} max={max} money={money} i={i} />)}</div>
        : <p className="text-apoio text-ink-faint">Sem dados ainda.</p>}
    </div>
  )
}

/* ---------- histograma de notas ---------- */
function Histogram({ counts, buckets }) {
  const max = Math.max(1, ...counts)
  return (
    <div>
      <h4 className="font-display text-obra text-ink mb-4">Distribuição de notas</h4>
      <div className="flex items-end gap-1.5 h-[120px]">
        {buckets.map((b, i) => {
          const c = counts[i]
          return (
            <div key={b} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className="text-rotulo font-bold text-ink-soft h-3">{c || ''}</span>
              <motion.span
 className={`w-full rounded-t-pequeno ${c ? 'bg-gold' : 'bg-linha'}`}
                initial={{ height: 0 }} animate={{ height: c ? `${Math.round(c / max * 100)}%` : '3px' }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.03, ease: [0.2, 0.8, 0.3, 1] }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {buckets.map(b => <span key={b} className="flex-1 text-center font-mono text-rotulo text-ink-faint">{b}</span>)}
      </div>
    </div>
  )
}

export default function Stats({ open, onClose }) {
  const { obras, filtered } = useStore()
  const [scope, setScope] = useState('all')
  const src = scope === 'all' ? obras : filtered

  const s = useMemo(() => {
    const O = src
    const units = O.flatMap(unitsOf)
    const owned = units.filter(u => u.status === 'biblioteca')
    const want = units.filter(u => u.status !== 'biblioteca')
    const invest = owned.reduce((a, u) => a + (Number(u.valorPago) || 0), 0)
    const paid = owned.filter(u => Number(u.valorPago) > 0)
    const avg = paid.length ? invest / paid.length : 0
    const lidos = owned.filter(u => u.lido).length
    const pctLido = owned.length ? Math.round(lidos / owned.length * 100) : 0
    const rated = units.filter(u => Number(u.nota) > 0)
    const notaMed = rated.length ? rated.reduce((a, u) => a + u.nota, 0) / rated.length : 0

    const tally = (keyFn) => {
      const m = {}; O.forEach(o => { const k = keyFn(o); if (k) m[k] = (m[k] || 0) + 1 }); return m
    }
    const byEd = tally(o => edOf(o) || (isImp(o) ? 'Importado (s/ editora)' : '—'))
    const byPais = {}; O.forEach(o => paisesOf(o).forEach(p => { byPais[p] = (byPais[p] || 0) + 1 }))
    const invEd = {}; O.forEach(o => { const v = sumValor(o); if (v > 0) { const k = edOf(o) || '—'; invEd[k] = (invEd[k] || 0) + v } })
    const top = (obj, n = 7) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)

    const buckets = []; for (let v = 0.5; v <= 5.0001; v += 0.5) buckets.push(Math.round(v * 10) / 10)
    const counts = buckets.map(b => units.filter(u => Number(u.nota) === b).length)

    const completas = O.filter(o => { const t = tipoOf(o); if (t !== 'serie' && t !== 'box') return false; const tot = unitsOf(o).length; return tot > 0 && ownedCount(o) >= tot }).length

    return {
      invest, tenho: owned.length, quero: want.length, pctLido, lidos, ownedLen: owned.length,
      avg, notaMed, obras: O.length, itens: units.length,
      importados: O.filter(isImp).length, urgentes: O.filter(anyUrg).length, completas,
      topEd: top(byEd), topPais: top(byPais), topInv: top(invEd),
      buckets, counts,
    }
  }, [src])

  const Kpi = ({ n, l, money, sub }) => (
    <div className="bg-surface px-5 py-6">
      <div className={`font-mono font-medium tabular-nums whitespace-nowrap ${money ? 'text-secao text-moss' : 'text-titulo text-ink'}`}>
        {money ? fmtBRL(n) : <Ticker value={n} />}{!money && sub ? <span className="text-corpo text-ink-faint font-sans font-semibold">{sub}</span> : null}
      </div>
      <div className="font-mono text-rotulo uppercase text-ink-faint mt-2">{l}</div>
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
 className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-veu backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
 className="w-full sm:max-w-[720px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(35,39,28,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-display text-secao text-ink flex-1">{s.obras ? `${s.tenho} de ${s.itens} itens na estante` : 'Painel da coleção'}</h3>
              <div className="flex rounded-pequeno border border-separador overflow-hidden text-apoio font-medium">
                {[['all', 'Coleção'], ['filtered', 'Filtro atual']].map(([v, l]) => (
                  <button key={v} onClick={() => setScope(v)} className={`px-3.5 py-1.5 transition-colors ${scope === v ? 'bg-ink text-paper' : 'bg-transparent text-ink-soft hover:text-ink'}`}>{l}</button>
                ))}
              </div>
              <button className="neo-icon !w-9 !h-9" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto">
              {s.obras === 0 ? (
                <div className="px-6 py-16 text-center text-ink-faint">
                  Sem dados neste escopo. {scope === 'filtered' ? 'Ajuste os filtros' : 'Carregue sua coleção pelo Backup'}.
                </div>
              ) : (
                <>
                  {/* KPIs principais */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-linha">
                    <Kpi n={s.invest} l="Investido" money />
                    <Kpi n={s.tenho} l="Tenho" />
                    <Kpi n={s.quero} l="Quero" />
                    <Kpi n={s.pctLido} l={`Lidos (${s.lidos}/${s.ownedLen})`} sub="%" />
                  </div>
                  {/* KPIs secundários */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-linha border-t border-linha">
                    <Kpi n={s.obras} l="Obras" />
                    <Kpi n={s.itens} l="Itens (volumes)" />
                    <Kpi n={s.importados} l="Importados" />
                    <Kpi n={s.completas} l="Séries completas" />
                  </div>

                  {/* médias */}
                  <div className="grid grid-cols-2 gap-4 px-5 sm:px-6 py-6 border-t border-linha">
                    <div className="rounded-medio border border-moss/15 bg-tinta-moss px-5 py-6">
                      <div className="font-mono text-titulo font-medium tabular-nums whitespace-nowrap text-moss">{s.notaMed ? s.notaMed.toFixed(1) : '—'}{s.notaMed ? <span className="text-gold text-obra ml-1">★</span> : null}</div>
                      <div className="font-mono text-rotulo uppercase text-moss/70 mt-2">Nota média</div>
                    </div>
                    <div className="rounded-medio border border-moss/15 bg-tinta-moss px-5 py-6">
                      <div className="font-mono text-secao font-medium tabular-nums whitespace-nowrap text-moss">{fmtBRL(s.avg)}</div>
                      <div className="font-mono text-rotulo uppercase text-moss/70 mt-2">Valor médio por item</div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-8 border-t border-linha"><Histogram counts={s.counts} buckets={s.buckets} /></div>

                  <div className="px-5 sm:px-6 pt-8 pb-10 border-t border-linha grid sm:grid-cols-2 gap-x-10 gap-y-9">
                    <Bars title="Itens por editora" data={s.topEd} />
                    <Bars title="Investimento por editora" data={s.topInv} money />
                    <Bars title="Por país" data={s.topPais} />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
