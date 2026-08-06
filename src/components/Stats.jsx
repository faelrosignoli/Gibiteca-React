import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import {
  unitsOf, edOf, isImp, sumValor, tipoOf, tagsOf, anyUrg, ownedCount, fmtBRL,
} from '../lib/helpers.js'
import Ticker from './Ticker.jsx'

/* ---------- barra horizontal (itens ou dinheiro) ---------- */
function BarRow({ nm, v, max, money, i }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[120px] shrink-0 text-[12px] text-ink-soft truncate" title={nm}>{nm}</span>
      <span className="flex-1 h-[18px] rounded-full bg-paper-3 overflow-hidden">
        <motion.span
          className="block h-full rounded-full bg-gradient-to-r from-moss to-moss-2"
          initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.round(v / max * 100))}%` }}
          transition={{ duration: 0.6, delay: 0.05 + i * 0.05, ease: [0.2, 0.8, 0.3, 1] }}
        />
      </span>
      <span className="w-[86px] shrink-0 text-right font-mono text-[12px] font-bold text-ink">{money ? fmtBRL(v) : v}</span>
    </div>
  )
}

function Bars({ title, data, money }) {
  const max = Math.max(1, ...data.map(d => d[1]))
  return (
    <div>
      <h4 className="font-serif text-[15px] text-moss mb-2">{title}</h4>
      {data.length
        ? <div className="flex flex-col gap-1.5">{data.map(([nm, v], i) => <BarRow key={nm} nm={nm} v={v} max={max} money={money} i={i} />)}</div>
        : <p className="text-[12px] text-ink-faint">Sem dados ainda.</p>}
    </div>
  )
}

/* ---------- histograma de notas ---------- */
function Histogram({ counts, buckets }) {
  const max = Math.max(1, ...counts)
  return (
    <div>
      <h4 className="font-serif text-[15px] text-moss mb-2">Distribuição de notas</h4>
      <div className="flex items-end gap-1.5 h-[120px]">
        {buckets.map((b, i) => {
          const c = counts[i]
          return (
            <div key={b} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className="text-[10px] font-bold text-ink-soft h-3">{c || ''}</span>
              <motion.span
                className={`w-full rounded-t-[4px] ${c ? 'bg-gold' : 'bg-paper-3'}`}
                initial={{ height: 0 }} animate={{ height: c ? `${Math.round(c / max * 100)}%` : '3px' }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.03, ease: [0.2, 0.8, 0.3, 1] }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {buckets.map(b => <span key={b} className="flex-1 text-center font-mono text-[9px] text-ink-faint">{b}</span>)}
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
    const byPais = tally(o => o.pais || '')
    const byGen = {}; O.forEach(o => tagsOf(o).forEach(t => { byGen[t] = (byGen[t] || 0) + 1 }))
    const invEd = {}; O.forEach(o => { const v = sumValor(o); if (v > 0) { const k = edOf(o) || '—'; invEd[k] = (invEd[k] || 0) + v } })
    const top = (obj, n = 7) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)

    const buckets = []; for (let v = 0.5; v <= 5.0001; v += 0.5) buckets.push(Math.round(v * 10) / 10)
    const counts = buckets.map(b => units.filter(u => Number(u.nota) === b).length)

    const completas = O.filter(o => { const t = tipoOf(o); if (t !== 'serie' && t !== 'box') return false; const tot = unitsOf(o).length; return tot > 0 && ownedCount(o) >= tot }).length

    return {
      invest, tenho: owned.length, quero: want.length, pctLido, lidos, ownedLen: owned.length,
      avg, notaMed, obras: O.length, itens: units.length,
      importados: O.filter(isImp).length, urgentes: O.filter(anyUrg).length, completas,
      topEd: top(byEd), topPais: top(byPais), topGen: top(byGen), topInv: top(invEd),
      buckets, counts,
    }
  }, [src])

  const Kpi = ({ n, l, money, sub }) => (
    <div className="bg-surface p-4">
      <div className={`font-mono text-[24px] font-bold tracking-tight ${money ? 'text-moss' : 'text-ink'}`}>
        {money ? fmtBRL(n) : <Ticker value={n} />}{!money && sub ? <span className="text-[13px] text-ink-faint font-sans font-semibold">{sub}</span> : null}
      </div>
      <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-faint mt-0.5">{l}</div>
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-ink/45 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[720px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-paper sm:rounded-[16px] sm:border-[1.5px] sm:border-ink overflow-hidden sm:shadow-[0_30px_70px_-24px_rgba(35,39,28,.7)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center gap-3 px-5 py-3.5 border-b-[1.5px] border-moss-line">
              <h3 className="font-serif text-[21px] text-moss flex-1">Painel da coleção</h3>
              <div className="flex rounded-[9px] border-[1.5px] border-moss-line overflow-hidden text-[12px] font-semibold">
                {[['all', 'Coleção'], ['filtered', 'Filtro atual']].map(([v, l]) => (
                  <button key={v} onClick={() => setScope(v)} className={`px-3 py-1.5 transition ${scope === v ? 'bg-moss text-white' : 'bg-surface text-ink-soft hover:bg-paper-2'}`}>{l}</button>
                ))}
              </div>
              <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm hover:bg-paper-2" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto">
              {s.obras === 0 ? (
                <div className="px-6 py-16 text-center text-ink-faint">
                  Sem dados neste escopo. {scope === 'filtered' ? 'Ajuste os filtros' : 'Carregue sua coleção pelo Backup'}.
                </div>
              ) : (
                <>
                  {/* KPIs principais */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-moss-line">
                    <Kpi n={s.invest} l="Investido no acervo" money />
                    <Kpi n={s.tenho} l="Tenho" />
                    <Kpi n={s.quero} l="Quero" />
                    <Kpi n={s.pctLido} l={`Lidos (${s.lidos}/${s.ownedLen})`} sub="%" />
                  </div>
                  {/* KPIs secundários */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-moss-line border-t border-moss-line">
                    <Kpi n={s.obras} l="Obras" />
                    <Kpi n={s.itens} l="Itens (volumes)" />
                    <Kpi n={s.importados} l="Importados" />
                    <Kpi n={s.completas} l="Séries completas" />
                  </div>

                  {/* médias */}
                  <div className="grid grid-cols-2 gap-3 px-4 py-4 bg-paper-2">
                    <div className="rounded-[12px] bg-moss text-white px-4 py-4 text-center shadow-[0_10px_22px_-14px_rgba(75,93,58,.9)]">
                      <div className="font-mono text-[26px] font-bold">{s.notaMed ? s.notaMed.toFixed(1) : '—'}{s.notaMed ? <span className="text-gold text-[18px] ml-0.5">★</span> : null}</div>
                      <div className="text-[11px] text-white/80 tracking-wide uppercase mt-0.5">Nota média</div>
                    </div>
                    <div className="rounded-[12px] bg-moss text-white px-4 py-4 text-center shadow-[0_10px_22px_-14px_rgba(75,93,58,.9)]">
                      <div className="font-mono text-[26px] font-bold">{fmtBRL(s.avg)}</div>
                      <div className="text-[11px] text-white/80 tracking-wide uppercase mt-0.5">Valor médio por item</div>
                    </div>
                  </div>

                  <div className="px-5 py-4"><Histogram counts={s.counts} buckets={s.buckets} /></div>

                  <div className="px-5 pb-6 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <Bars title="Itens por editora" data={s.topEd} />
                    <Bars title="Investimento por editora" data={s.topInv} money />
                    <Bars title="Por país" data={s.topPais} />
                    <Bars title="Por gênero" data={s.topGen} />
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
