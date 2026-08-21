import { motion } from 'framer-motion'
import { useStore } from '../lib/store.jsx'
import {
  edOf, tipoOf, statusMatch, avgNota, isImp, anyUrg,
  coverOf, unidadeVitrine, urgenteNaVitrine, unitsOf, ownedCount, sumValor, fmtBRL, initials, tintFor, missingVols,
} from '../lib/helpers.js'
import Card from './Card.jsx'
import Estrelas from './Estrelas.jsx'
import Pagination from './Pagination.jsx'

/* Modo lista — formato "ficha".
 *
 * A tabela antiga repetia o que a grade já mostra, só que pior. A ficha dá à
 * lista um papel próprio: cada linha conta a obra inteira sem precisar abrir —
 * capa, editora, tipo, selos, nota, progresso da série e quanto já foi gasto.
 */
function Ficha({ obra, index, onOpen }) {
  const { filters } = useStore()
  const capa = coverOf(obra, filters.status)
  const vitrine = unidadeVitrine(obra, filters.status)
  const volDaVez = vitrine ? (vitrine.nome || '').trim() : ''
  const t = tipoOf(obra)
  const multi = t === 'serie' || t === 'box'
  const total = unitsOf(obra).length
  const tem = ownedCount(obra)
  const nota = avgNota(obra)
  const valor = sumValor(obra)
  const possui = statusMatch(obra, 'biblioteca')
  const falta = multi ? missingVols(obra) : []
  const tipoLabel = { avulso: 'Avulso', serie: 'Série', box: 'Box' }[t] || t

  return (
    <motion.button
      type="button"
      onClick={() => onOpen?.(obra)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.02, 0.24), ease: [0.32, 0.72, 0, 1] }}
      whileTap={{ scale: 0.995 }}
      className="w-full text-left grid grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[64px_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-center
                 rounded-medio border border-linha bg-surface px-3 py-3 sm:px-4
                 transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-separador hover:bg-toque"
    >
      {/* capa: caixa quadrada nua, imagem arredondada por dentro */}
      <div className="w-[52px] sm:w-16 aspect-square relative flex items-center justify-center self-start">
        {urgenteNaVitrine(obra, filters.status) && <UrgBadge />}
        {capa
          ? <img src={capa} alt="" loading="lazy" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_10px_20px_-10px_rgba(35,39,28,.55)]" />
          : <div className="w-full h-full rounded-pequeno flex items-center justify-center shadow-[0_10px_20px_-10px_rgba(35,39,28,.55)]"
                 style={{ background: `linear-gradient(155deg, ${tintFor(edOf(obra) || obra.nome)}, ${tintFor(edOf(obra) || obra.nome)}cc)` }}>
              <span className="font-display font-semibold text-corpo sm:text-obra leading-none text-white">{initials(obra.nome)}</span>
            </div>}
      </div>

      <div className="min-w-0">
        <div className="font-display text-obra sm:text-secao text-ink leading-tight">
          {obra.nome}
        </div>
        {/* sob filtro a capa é de um volume específico — diz qual */}
        {volDaVez && (
          <div className="mt-0.5 font-mono text-rotulo uppercase text-ink-faint truncate">{volDaVez}</div>
        )}

        {/* apoio categórico em rótulo mono, como manda a convenção */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {edOf(obra) && <span className="font-mono text-rotulo uppercase text-moss-2">{edOf(obra)}</span>}
          <span className="font-mono text-rotulo uppercase text-ink-faint">{tipoLabel}</span>
          {/* sob filtro a ficha fala de um volume — o selo é o dele */}
          <span className={`pill ${(vitrine ? vitrine.status === 'biblioteca' : possui) ? 'pill-tenho' : 'pill-quero'}`}>
            {(vitrine ? vitrine.status === 'biblioteca' : possui) ? 'Tenho' : 'Quero'}
          </span>
          {/* a fração vira pílula própria — o status não precisa carregá-la */}
          {multi && total > 0 && (
            <span className={`pill ${tem >= total ? 'pill-tenho' : 'pill-quero'}`} title={`${tem} de ${total} na estante`}>
              {tem}/{total}
            </span>
          )}
          {isImp(obra) && <span className="pill pill-imp">Importado</span>}
          {nota > 0 && <Estrelas n={nota} />}
        </div>

        {/* sem barra: a pílula acima já diz a fração. Aqui fica só o que
            ela não diz — QUAIS volumes faltam. */}
        {multi && tem < total && filters.status === 'todos' && (
          <div className="mt-1.5 font-mono text-rotulo uppercase text-ink-faint">
            {falta.length > 0 && falta.length <= 4
              ? `falta${falta.length > 1 ? 'm' : ''} ${falta.length > 1 ? 'os vols.' : 'o vol.'} ${falta.join(', ')}`
              : `faltam ${total - tem}`}
          </div>
        )}

        {/* no celular o valor desce para cá, já que não há terceira coluna */}
        {valor > 0 && (
          <div className="sm:hidden mt-2 font-mono text-corpo tabular-nums text-ink">
            {fmtBRL(valor)} <span className="font-mono text-rotulo uppercase text-ink-faint">investido</span>
          </div>
        )}
      </div>

      <div className="hidden sm:block text-right self-center">
        <div className="font-mono text-obra tabular-nums text-ink">{valor > 0 ? fmtBRL(valor) : '—'}</div>
        <div className="font-mono text-rotulo uppercase text-ink-faint mt-1">investido</div>
      </div>
    </motion.button>
  )
}

function ListView({ items, onOpen }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((o, i) => <Ficha key={o.id} obra={o} index={i} onOpen={onOpen} />)}
    </div>
  )
}
export default function Collection({ onOpen }) {
  const { view, total, pageItems, obras, fixada } = useStore()

  if (total === 0) {
    return (
      <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-5">
        <div className="rounded-grande border border-dashed border-separador px-5 py-16 text-center text-ink-faint">
          <div className="font-display text-secao text-moss mb-1.5 bg-gradient-to-r from-moss via-gold to-moss bg-[length:200%_auto] bg-clip-text text-transparent animate-[shine_3.6s_linear_infinite]">Nada por aqui</div>
          {obras.length === 0
            ? <>Sua coleção está vazia neste preview. <br />Clique em <b className="text-ink">Backup</b> (no topo) e carregue seu <b className="text-ink">gibiteca-dados.json</b> pra ver tudo aqui.</>
            : <>Nenhuma obra corresponde aos filtros. Ajuste a busca ou os filtros.</>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-4">
      {view === 'galeria'
        ? <div className="grid gap-2.5 sm:gap-4 xl:gap-5 grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {pageItems.map((o, i) => {
              // o destaque é a obra FIXADA, e ela foi para o começo da lista
              // no store. Sem obra fixada, nenhum cartão vira destaque.
              const feature = fixada != null && o.id === fixada && i === 0
              return (
                <div key={o.id} className={feature ? 'lg:col-span-2 lg:row-span-2' : ''}>
                  <Card obra={o} index={i} onOpen={onOpen} feature={feature} />
                </div>
              )
            })}
          </div>
        : <ListView items={pageItems} onOpen={onOpen} />}
      <Pagination />
    </div>
  )
}

/* mesmo selo da galeria: quadrado rust com o triângulo de alerta */
function UrgBadge() {
  return (
    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-[4] w-4 h-4 sm:w-[20px] sm:h-[20px] rounded-pequeno bg-rust text-white flex items-center justify-center shadow-[0_2px_8px_rgba(35,39,28,.3)]" title="Urgente">
      <svg className="w-[10px] h-[10px] sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
    </span>
  )
}
