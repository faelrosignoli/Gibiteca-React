import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA, ELASTICO_BAIXO,
  deveDispensar, useEhDesktop, usaMovimentoReduzido,
} from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { linkDoGuia } from '../lib/catalogo.js'
import { coverOf, tipoOf, edOf, authorsOf, paisesOf, unitsForStatus, avgNota, unitsOf, ownedCount, sumValor, fmtBRL, statusMatch, initials, tintFor } from '../lib/helpers.js'

function Numero({ rotulo, valor, sub, capitalizar }) {
  return (
    <div className="bg-surface px-3.5 py-3">
      <dt className="font-mono text-rotulo uppercase text-ink-faint">{rotulo}</dt>
      <dd className="mt-1.5 flex items-baseline gap-1.5 min-w-0">
        <span className={`font-mono text-secao text-ink tabular-nums truncate ${capitalizar ? 'capitalize' : ''}`}>{valor}</span>
        {sub ? <span className="text-apoio text-ink-faint shrink-0">{sub}</span> : null}
      </dd>
    </div>
  )
}

export default function DetailSheet({ obra, onClose, onEdit }) {
  const { fixada, fixarObra, filters } = useStore()
  const estaFixada = obra != null && fixada === obra.id
  const multi = obra != null && (tipoOf(obra) === 'serie' || tipoOf(obra) === 'box')
  const todosOsVolumes = obra != null ? unitsOf(obra) : []
  const unidades = todosOsVolumes.length

  // Com o filtro em "Tenho", uma série 1-de-2 passava e mostrava os dois
  // volumes — inclusive o que falta. Agora a lista respeita o filtro.
  const volumes = obra != null ? unitsForStatus(obra, filters.status) : []
  const filtrando = filters.status !== 'todos' && volumes.length !== todosOsVolumes.length
  const notaDoFiltro = filters.status === 'biblioteca' ? 'só os que você tem' : 'só os que faltam'
  const ehDesktop = useEhDesktop()
  const reduzido = usaMovimentoReduzido()
  // o arrasto começa só pelo cabeçalho: o corpo precisa continuar rolando
  const arrasto = useDragControls()

  // sai pelo mesmo lado por onde entrou
  const eixo = ehDesktop ? 'x' : 'y'
  // percurso inteiro: entra e sai pela mesma borda. Um deslocamento curto
  // faria a gaveta voltar para perto do lugar antes de sumir, se o usuário
  // a tivesse arrastado para longe — um repuxão no meio da dispensa.
  const de = ehDesktop ? { x: '100%' } : { y: '100%' }

  const aoSoltar = (_e, info) => {
    const deslocamento = ehDesktop ? info.offset.x : info.offset.y
    const velocidade = ehDesktop ? info.velocity.x : info.velocity.y
    const tamanho = ehDesktop ? 460 : 420
    if (deveDispensar({ deslocamento, velocidade, tamanho })) onClose?.()
    // se não dispensar, o dragSnapToOrigin devolve a gaveta ao lugar
  }

  return (
    <AnimatePresence>
      {obra && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-veu backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} onClick={onClose} />
          <motion.div
 className="fixed z-50 bg-surface border-separador flex flex-col right-0 top-0 h-full w-[min(460px,100%)] border-l sm:rounded-none max-sm:top-auto max-sm:bottom-0 max-sm:w-full max-sm:h-auto max-sm:max-h-[92vh] max-sm:rounded-t-grande max-sm:border-l-0 max-sm:border-t"
            initial={de} animate={{ x: 0, y: 0 }} exit={de}
            transition={reduzido ? { duration: 0.16 } : MOLA_GAVETA}
            drag={reduzido ? false : eixo}
            dragControls={arrasto}
            dragListener={false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={ehDesktop ? ELASTICO_DIREITA : ELASTICO_BAIXO}
            dragTransition={VOLTA_DO_ARRASTO}
            dragSnapToOrigin
            onDragEnd={aoSoltar}
          >
            {/* puxador — só aparece quando a gaveta vem de baixo */}
            <div
 className="sm:hidden pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={e => arrasto.start(e)}
            >
              <span className="w-9 h-1 rounded-full bg-separador" />
            </div>
            <div
 className="flex items-center gap-2 px-5 py-4 border-b border-separador sm:cursor-grab sm:active:cursor-grabbing touch-none"
              onPointerDown={e => arrasto.start(e)}
            >
              {/* o título saiu daqui: com três botões ao lado ele só cabia
                  truncado. Agora abre o corpo, com a largura toda. */}
              <span className="flex-1" />

              {/* Fixar destaca a obra na grade. Só uma por vez: fixar outra
                  troca a anterior, e clicar de novo desafixa. */}
              <button
                className={`neo-icon !w-9 !h-9 shrink-0 ${estaFixada ? '!bg-moss !text-white' : ''}`}
                onClick={() => fixarObra(obra.id)}
                aria-pressed={estaFixada}
                title={estaFixada ? 'Desafixar da grade' : 'Fixar como destaque da grade'}
                aria-label={estaFixada ? 'Desafixar da grade' : 'Fixar como destaque da grade'}
              >
                <IconFixar preenchido={estaFixada} />
              </button>

              <button className="neo-btn !py-1.5 !px-3 shrink-0" onClick={() => onEdit?.(obra)}>
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                Editar
              </button>
              <button className="neo-icon !w-9 !h-9 shrink-0" onClick={onClose}>×</button>
            </div>
            <div className="flex-1 overflow-auto">

              {/* ---- título, com a largura inteira para quebrar ---- */}
              <div className="px-5 pt-5">
                {edOf(obra) && (
                  <div className="font-mono text-rotulo uppercase text-moss-2">{edOf(obra)}</div>
                )}
                <h2 className="mt-2 font-display text-titulo text-ink break-words">{obra.nome}</h2>
              </div>

              {/* ---- capa quadrada + números da obra ---- */}
              <div className="flex gap-4 px-5 pt-4 pb-5">
                {/* caixa QUADRADA, como na galeria. A capa fica contida dentro,
                    sem recorte; o placeholder preenche o quadrado. */}
                <div className="w-24 sm:w-28 shrink-0 self-start aspect-square relative flex items-center justify-center">
                  {coverOf(obra, filters.status)
                    ? <img src={coverOf(obra, filters.status)} alt="" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_18px_30px_-18px_rgba(35,39,28,.55)]" />
                    : <div className="w-full h-full flex items-center justify-center text-white" style={{ background: `linear-gradient(160deg, ${tintFor(edOf(obra) || obra.nome)}, ${tintFor(edOf(obra) || obra.nome)}dd)` }}>
                        <span className="font-display font-semibold text-titulo leading-none">{initials(obra.nome)}</span>
                      </div>}
                </div>

                {/* números com régua, nunca crus */}
                <dl className="flex-1 min-w-0 grid grid-cols-2 gap-px bg-linha rounded-medio overflow-hidden border border-linha self-start">
                  <Numero rotulo="Status" valor={statusMatch(obra, 'biblioteca') ? 'Tenho' : 'Quero'} />
                  {multi
                    ? <Numero rotulo="Na estante" valor={ownedCount(obra)} sub={`de ${unidades}`} />
                    : <Numero rotulo="Tipo" valor={tipoOf(obra)} capitalizar />}
                  <Numero rotulo="Nota" valor={avgNota(obra) > 0 ? avgNota(obra).toFixed(1).replace('.', ',') : '—'} sub={avgNota(obra) > 0 ? 'de 5' : null} />
                  <Numero rotulo="Investido" valor={sumValor(obra) > 0 ? fmtBRL(sumValor(obra)) : '—'} />
                </dl>
              </div>

              {/* ---- ficha técnica: rótulo mono à esquerda, valor à direita ---- */}
              <div className="px-5 pb-5">
                <dl className="rounded-medio border border-linha overflow-hidden">
                  {[
                    ['Tipo', tipoOf(obra)],
                    ['País', paisesOf(obra).join(', ')],
                    ['Autores', authorsOf(obra).join(', ')],
                    multi ? ['Volumes', `${ownedCount(obra)} de ${unidades}`] : null,
                  ].filter(l => l && l[1]).map(([k, v], i) => (
                    <div key={k} className={`flex items-baseline gap-4 px-4 py-2.5 ${i ? 'border-t border-linha' : ''}`}>
                      <dt className="font-mono text-rotulo uppercase text-ink-faint w-[86px] shrink-0">{k}</dt>
                      <dd className={`text-corpo text-ink min-w-0 ${k === 'Tipo' ? 'capitalize' : ''}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
                {/* consultar a ficha da obra onde a edição brasileira está
                    certa. Link, não consulta: o Guia não tem API. */}
                <a href={linkDoGuia(obra.nome)} target="_blank" rel="noopener noreferrer"
                   className="neo-btn w-full justify-center mt-3">
                  Ver no Guia dos Quadrinhos ↗
                </a>
              </div>

              {obra.resenha && (
                <div className="px-5 pb-5">
                  <div className="font-mono text-rotulo uppercase text-ink-faint mb-2">Anotação</div>
                  <p className="max-w-[62ch] text-corpo text-ink-soft leading-relaxed whitespace-pre-wrap">{obra.resenha}</p>
                </div>
              )}

              {/* ---- volumes ---- */}
              {multi && (
                <div className="px-5 pb-6 border-t border-linha pt-5">
                  <div className="font-mono text-rotulo uppercase text-ink-faint mb-3">
                    Volumes — {ownedCount(obra)} de {unidades}
                    {filtrando && (
                      <span className="text-moss-2"> · {notaDoFiltro} ({volumes.length})</span>
                    )}
                  </div>
                  {/* A grade estica todas as células até a altura da mais alta e o
                      selo é empurrado para baixo com mt-auto. Assim o nome pode
                      quebrar em quantas linhas precisar — SEM corte — e os selos
                      continuam alinhados na mesma linha de base. */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {volumes.map((v, i) => {
                      const owns = v.status === 'biblioteca'
                      const label = v.nome || `Vol. ${i + 1}`
                      return (
                        <div key={i} className="flex flex-col gap-2 min-w-0">
                          {/* mesma caixa quadrada da galeria */}
                          <div className={`w-full aspect-square relative flex items-center justify-center ${owns ? '' : 'opacity-55'}`}>
                            {v.imagem
                              ? <img src={v.imagem} alt="" loading="lazy" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_10px_20px_-10px_rgba(35,39,28,.55)]" />
                              : <div className="w-full h-full rounded-pequeno flex items-center justify-center shadow-[0_10px_20px_-10px_rgba(35,39,28,.55)]"
                                     style={{ background: `linear-gradient(160deg, ${tintFor(label)}, ${tintFor(label)}dd)` }}>
                                  <span className="font-display font-semibold text-secao leading-none text-white">{initials(label)}</span>
                                </div>}
                          </div>
                          {/* nome INTEIRO: quebra livre, sem line-clamp */}
                          <div className="text-apoio leading-snug text-ink break-words text-center">{label}</div>
                          <span className={`pill self-center mt-auto ${owns ? 'pill-tenho' : 'pill-quero'}`}>{owns ? 'Tenho' : 'Quero'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const IconFixar = ({ preenchido }) => (
  <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24"
       fill={preenchido ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
)
