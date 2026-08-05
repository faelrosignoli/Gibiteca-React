import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { edOf, authorsOf, tagsOf } from '../lib/helpers.js'

function Field({ label, changed, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`font-mono text-[10px] tracking-widest uppercase ${changed ? 'text-moss font-bold' : 'text-ink-faint'}`}>
        {label}{changed && <span className="ml-1.5 inline-block w-[7px] h-[7px] rounded-full bg-gold align-middle" />}
      </label>
      {children}
    </div>
  )
}
const selCls = (changed) => `rounded-[10px] border-[1.5px] bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none ${changed ? 'border-moss' : 'border-ink'}`

function Seg({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-[10px] border-[1.5px] border-moss-line overflow-hidden min-h-[42px]">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`flex-1 text-[13px] font-semibold px-2 ${value === v ? 'bg-moss text-white' : 'bg-surface text-ink-soft'}`}>{l}</button>
      ))}
    </div>
  )
}

export default function FiltersDrawer({ open, onClose }) {
  const { obras, editoras, filters, sort, setFilter, setSort, resetFilters } = useStore()
  const paises = useMemo(() => Array.from(new Set(obras.map(o => o.pais).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt')), [obras])
  const autores = useMemo(() => Array.from(new Set(obras.flatMap(authorsOf))).sort((a,b)=>a.localeCompare(b,'pt')), [obras])
  const generos = useMemo(() => Array.from(new Set(obras.flatMap(tagsOf))).sort((a,b)=>a.localeCompare(b,'pt')), [obras])
  const eds = useMemo(() => Array.from(new Set([...(editoras||[]), ...obras.map(edOf)].filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt')), [editoras, obras])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-[min(440px,100%)] bg-paper border-l-[1.5px] border-moss-line flex flex-col"
            initial={{ x: 40, opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b-[1.5px] border-moss-line">
              <h3 className="font-serif text-[22px] text-moss">Filtros</h3>
              <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm" onClick={onClose}>×</button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-5 grid grid-cols-2 gap-3">
              <div className="col-span-2"><Seg options={[['todos','Todos'],['biblioteca','Tenho'],['wishlist','Quero']]} value={filters.status} onChange={v => setFilter('status', v)} /></div>
              <Field label="Tipo" changed={!!filters.tipo}>
                <select className={selCls(!!filters.tipo)} value={filters.tipo} onChange={e => setFilter('tipo', e.target.value)}>
                  <option value="">Todos</option><option value="avulso">Só avulsos</option><option value="box">Só boxes</option><option value="serie">Só séries</option>
                </select>
              </Field>
              <Field label="Editora" changed={!!filters.editora}>
                <select className={selCls(!!filters.editora)} value={filters.editora} onChange={e => setFilter('editora', e.target.value)}>
                  <option value="">Todas</option>{eds.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="País" changed={!!filters.pais}>
                <select className={selCls(!!filters.pais)} value={filters.pais} onChange={e => setFilter('pais', e.target.value)}>
                  <option value="">Todos</option>{paises.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Autor" changed={!!filters.autor}>
                <select className={selCls(!!filters.autor)} value={filters.autor} onChange={e => setFilter('autor', e.target.value)}>
                  <option value="">Todos</option>{autores.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Ordenar por">
                <select className={selCls(false)} value={sort.by} onChange={e => setSort({ ...sort, by: e.target.value })}>
                  <option value="nome">Título (A–Z)</option><option value="editora">Editora</option><option value="autor">Autor</option>
                  <option value="nota">Nota</option><option value="valor">Valor</option><option value="volumes">Qtd. volumes</option>
                  <option value="pais">País</option><option value="recent">Recentes</option>
                </select>
              </Field>
              <Field label="Ordem">
                <select className={selCls(false)} value={sort.dir} onChange={e => setSort({ ...sort, dir: e.target.value })}>
                  <option value="asc">Crescente</option><option value="desc">Decrescente</option>
                </select>
              </Field>
              <div className="col-span-2"><Field label="Gênero" changed={!!filters.genero}>
                <select className={selCls(!!filters.genero)} value={filters.genero} onChange={e => setFilter('genero', e.target.value)}>
                  <option value="">Todos</option>{generos.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field></div>
              <div className="col-span-2"><Field label="Leitura" changed={filters.leitura !== 'todos'}>
                <Seg options={[['todos','Todos'],['lido','Lidos'],['naolido','Não lidos']]} value={filters.leitura} onChange={v => setFilter('leitura', v)} />
              </Field></div>
              <label className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-moss-line px-3 py-2.5 text-[13px] cursor-pointer">
                <input type="checkbox" checked={filters.importado} onChange={e => setFilter('importado', e.target.checked)} /> Importados
              </label>
              <label className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-moss-line px-3 py-2.5 text-[13px] cursor-pointer">
                <input type="checkbox" checked={filters.urgencia} onChange={e => setFilter('urgencia', e.target.checked)} /> Urgentes
              </label>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t-[1.5px] border-moss-line">
              <button className="neo-btn neo-btn-rust mr-auto" onClick={resetFilters}>Limpar filtros</button>
              <button className="neo-btn neo-btn-moss" onClick={onClose}>Ver resultados</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
