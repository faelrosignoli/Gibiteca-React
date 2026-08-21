import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA,
  deveDispensar, usaMovimentoReduzido,
} from '../lib/motion.js'
import { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { edOf, authorsOf, paisesOf } from '../lib/helpers.js'
import Selecao from './Selecao.jsx'

function Field({ label, changed, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`font-mono text-rotulo uppercase pl-0.5 ${changed ? 'text-moss font-bold' : 'text-ink-faint'}`}>
        {label}{changed && <span className="ml-1.5 inline-block w-[7px] h-[7px] rounded-full bg-gold align-middle" />}
      </label>
      {children}
    </div>
  )
}
// lista de opções no formato que o Selecao espera: [valor, rótulo]
const comTodos = (rotulo, itens) => [['', rotulo], ...itens.map(x => [x, x])]

function Seg({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-full border border-separador overflow-hidden">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
 className={`flex-1 text-corpo font-semibold py-2 px-2 transition ${value === v ? 'bg-moss text-white' : 'bg-surface text-ink-soft hover:bg-paper-2'}`}>{l}</button>
      ))}
    </div>
  )
}

export default function FiltersDrawer({ open, onClose }) {
  const { obras, editoras, filters, sort, setFilter, setSort, resetFilters } = useStore()
  const reduzido = usaMovimentoReduzido()
  // o arrasto sai só do cabeçalho: a lista de filtros precisa continuar rolando
  const arrasto = useDragControls()
  // "Argentina / Espanha" entra como dois paises, nao como um rotulo so
  const paises = useMemo(() => Array.from(new Set(obras.flatMap(paisesOf))).sort((a, b) => a.localeCompare(b, 'pt')), [obras])
  const autores = useMemo(() => Array.from(new Set(obras.flatMap(authorsOf))).sort((a, b) => a.localeCompare(b, 'pt')), [obras])
  const eds = useMemo(() => Array.from(new Set([...(editoras || []), ...obras.map(edOf)].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt')), [editoras, obras])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-veu backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} onClick={onClose} />
          <motion.div
 className="fixed right-0 top-0 z-50 h-full w-[min(440px,100%)] bg-surface border-l border-separador flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={reduzido ? { duration: 0.16 } : MOLA_GAVETA}
            drag={reduzido ? false : 'x'}
            dragControls={arrasto}
            dragListener={false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={ELASTICO_DIREITA}
            dragTransition={VOLTA_DO_ARRASTO}
            dragSnapToOrigin
            onDragEnd={(_e, info) => {
              if (deveDispensar({ deslocamento: info.offset.x, velocidade: info.velocity.x, tamanho: 440 })) onClose?.()
            }}
          >
            <div
 className="flex items-center justify-between px-5 py-3.5 border-b border-separador cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={e => arrasto.start(e)}
            >
              <h3 className="font-display text-secao text-moss">Filtros</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 grid grid-cols-2 gap-x-3 gap-y-3 content-start">
              <div className="col-span-2"><Seg options={[['todos', 'Todos'], ['biblioteca', 'Tenho'], ['wishlist', 'Quero']]} value={filters.status} onChange={v => setFilter('status', v)} /></div>

              <Field label="Tipo" changed={!!filters.tipo}>
                <Selecao value={filters.tipo} onChange={v => setFilter('tipo', v)} changed={!!filters.tipo}
                  options={[['', 'Todos'], ['avulso', 'Só avulsos'], ['box', 'Só boxes'], ['serie', 'Só séries']]} />
              </Field>
              <Field label="Editora" changed={!!filters.editora}>
                <Selecao value={filters.editora} onChange={v => setFilter('editora', v)} changed={!!filters.editora}
                  options={comTodos('Todas', eds)} />
              </Field>
              <Field label="País" changed={!!filters.pais}>
                <Selecao value={filters.pais} onChange={v => setFilter('pais', v)} changed={!!filters.pais}
                  options={comTodos('Todos', paises)} />
              </Field>
              <Field label="Autor" changed={!!filters.autor}>
                <Selecao value={filters.autor} onChange={v => setFilter('autor', v)} changed={!!filters.autor}
                  options={comTodos('Todos', autores)} />
              </Field>
              <Field label="Ordenar por">
                <Selecao value={sort.by} onChange={v => setSort({ ...sort, by: v })}
                  options={[['nome', 'Título (A–Z)'], ['editora', 'Editora'], ['autor', 'Autor'], ['nota', 'Nota'],
                            ['valor', 'Valor'], ['volumes', 'Qtd. volumes'], ['pais', 'País'], ['recent', 'Recentes']]} />
              </Field>
              <Field label="Ordem">
                <Selecao value={sort.dir} onChange={v => setSort({ ...sort, dir: v })}
                  options={[['asc', 'Crescente'], ['desc', 'Decrescente']]} />
              </Field>

              <div className="col-span-2"><Field label="Leitura" changed={filters.leitura !== 'todos'}>
                <Seg options={[['todos', 'Todos'], ['lido', 'Lidos'], ['naolido', 'Não lidos']]} value={filters.leitura} onChange={v => setFilter('leitura', v)} />
              </Field></div>

              <label className={`flex items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-corpo font-semibold cursor-pointer transition ${filters.importado ? 'border-moss text-moss bg-surface-2' : 'border-separador text-ink-soft'}`}>
                <input type="checkbox" className="accent-moss w-[15px] h-[15px]" checked={filters.importado} onChange={e => setFilter('importado', e.target.checked)} /> Importados
              </label>
              <label className={`flex items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-corpo font-semibold cursor-pointer transition ${filters.urgencia ? 'border-moss text-moss bg-surface-2' : 'border-separador text-ink-soft'}`}>
                <input type="checkbox" className="accent-moss w-[15px] h-[15px]" checked={filters.urgencia} onChange={e => setFilter('urgencia', e.target.checked)} /> Urgentes
              </label>
            </div>

            <div className="flex gap-2 px-5 py-3.5 border-t border-separador">
              <button className="neo-btn neo-btn-rust mr-auto" onClick={resetFilters}>Limpar filtros</button>
              <button className="neo-btn neo-btn-moss" onClick={onClose}>Ver resultados</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
