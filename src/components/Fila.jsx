import { useState } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, MOLA_TOQUE, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA,
  deveDispensar, usaMovimentoReduzido,
} from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { chaveFila, filaResolvida, capaDaFila, autorDaFila, podeEnfileirar, capaVelada, edOf, edicaoDe, isImp, initials, classeTinta } from '../lib/helpers.js'
import { EstrelasInput } from './Estrelas.jsx'

/* A FILA DE LEITURA.
 *
 * Gaveta à direita no desktop, tela cheia no celular — a mesma casca dos
 * Filtros (`w-[min(440px,100%)]`: num telefone de 375px o `min` já entrega a
 * largura toda, sem precisar de um segundo layout).
 *
 * A linha mostra QUATRO coisas e nada mais: capa, título, editora e autor.
 * Não há selos, nota, valor nem progresso. A coleção é onde se consulta; aqui
 * a pergunta é só "o que eu leio agora", e cada dado a mais é uma chance de
 * parar para ler a linha em vez de ler o gibi.
 *
 * ORDEM É O CONTEÚDO. Por isso a fila não se ordena por nada — nem por nome,
 * nem por data. A sequência é a que a pessoa arrastou, e qualquer ordenação
 * automática apagaria a única informação que a fila guarda.
 */

/* Pop-up da nota, depois de marcar lido.
 *
 * Separado da linha porque a linha SAI no mesmo instante: marcar lido tira da
 * fila (ver `marcarLido` no store). Se o pop-up morasse dentro dela, sairia
 * junto, antes de alguém dar a nota. Por isso ele guarda o próprio texto —
 * título e parte — em vez de apontar para a entrada.
 */
function PopupNota({ alvo, onFechar, onConfirmar }) {
  const [nota, setNota] = useState(0)
  return (
    <AnimatePresence>
      {alvo && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}
        >
          <motion.div
            className="w-full sm:max-w-[460px] h-full sm:h-auto flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Lido</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onFechar} aria-label="Fechar">×</button>
            </div>

            <div className="px-5 sm:px-6 py-6">
              <div className="text-corpo text-ink break-words">{alvo.titulo}</div>
              {alvo.parte && <div className="text-apoio text-ink-faint mt-0.5">{alvo.parte}</div>}

              <div className="mt-5 font-rotulo text-rotulo uppercase text-ink-faint">Que nota você dá?</div>
              <div className="mt-2.5"><EstrelasInput value={nota} onChange={setNota} /></div>

              <button
                type="button"
                className="cta w-full justify-center !pr-5 mt-6"
                onClick={() => { onConfirmar(nota); setNota(0) }}
              >
                Salvar
              </button>
              {/* Dá para sair sem nota, e isso é de propósito: nem tudo que se
                  lê se quer avaliar. Fechar pelo × marca lido do mesmo jeito —
                  o que a fila precisava saber já foi dito no clique. */}
              <p className="mt-3 text-apoio text-ink-faint leading-relaxed">
                Já saiu da fila. A nota é opcional — fechar sem dar nota também vale.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Uma linha da fila.
 *
 * O arrasto começa pelo PUNHO, não pela linha inteira (`dragListener={false}`
 * + `dragControls`): a linha tem dois botões, e arrastar a partir de qualquer
 * ponto faria todo toque hesitante virar um arraste de dois pixels que come o
 * clique. Com o punho, quem quer mover sabe onde pegar e quem quer clicar
 * clica.
 */
function Linha({ item, aoLer, aoTirar, aoEditar }) {
  const arrasto = useDragControls()
  const reduzido = usaMovimentoReduzido()
  const { verAdulto } = useStore()
  const capa = capaDaFila(item)
  /* O véu olha a OBRA, não a unidade: a marca de +18 é da obra inteira, e um
     volume solto na fila herda a decisão dela. */
  const velada = capaVelada(item.obra, verAdulto)
  const autor = autorDaFila(item)
  const editora = edOf(item.obra)
  const edicao = edicaoDe(item.obra)
  const importado = isImp(item.obra)
  const rotulo = item.parte ? item.titulo + ' — ' + item.parte : item.titulo

  return (
    <Reorder.Item
      value={item.entrada}
      dragListener={false}
      dragControls={arrasto}
      /* `layout` faz as OUTRAS linhas abrirem espaço enquanto esta viaja. Sem
         ele a lista pula de posição de uma vez, e some a noção de para onde a
         linha está indo. */
      layout
      transition={MOLA_TOQUE}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      /* `select-none`: arrastar a linha selecionava o texto dela, e o que
         ficava na tela era um bloco azul de seleção acompanhando o dedo em
         vez da linha. Apareceu no primeiro arrasto de teste. Nada aqui é
         texto para copiar — o título de verdade está na coleção. */
      className="flex items-center gap-3 py-3 border-b border-linha bg-surface select-none"
    >
      {/* punho */}
      <span
        onPointerDown={e => { if (!reduzido) arrasto.start(e) }}
        className="shrink-0 text-ink-mute cursor-grab active:cursor-grabbing touch-none px-0.5"
        aria-hidden="true"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </span>

      {/* A CAPA E O TEXTO formam um alvo só para o duplo clique, que abre o
          editor. Os botões ficam de fora: duplo clique em "Lido" não pode
          marcar lido e abrir o editor na mesma batida.

          Clique simples continua sem fazer nada — a linha é informação, e o
          que age são os dois botões à direita. */}
      <div
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        onDoubleClick={() => aoEditar?.(item)}
        title={'Clique duas vezes para editar ' + item.titulo}
      >
        {/* Capa RETRATO, não quadrada: capa de gibi é mais alta que larga, e
            na caixa quadrada de antes ela ficava pequena no meio de duas
            faixas vazias. Aqui o desenho ocupa a caixa inteira. */}
        <div className="w-[52px] h-[70px] shrink-0 relative flex items-center justify-center">
          {capa
            ? <img src={capa} alt="" loading="lazy" className={`absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_8px_16px_-9px_rgba(33,33,33,.55)] ${velada ? 'capa-velada' : ''}`} />
            : <div className={'w-full h-full rounded-pequeno flex items-center justify-center ' + classeTinta(editora || item.titulo)}>
                <span className="font-display font-semibold text-obra leading-none text-sobre-tinta">{initials(item.titulo)}</span>
              </div>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-corpo text-ink leading-snug break-words">{item.titulo}</div>
          {item.parte && <div className="text-apoio text-ink-soft leading-snug">{item.parte}</div>}
          {(editora || autor) && (
            <div className="text-apoio text-ink-faint leading-snug truncate">
              {[editora, autor].filter(Boolean).join(' · ')}
            </div>
          )}
          {/* Os selos do que AJUDA a escolher o próximo: o formato da edição e
              se é importado. Não há nota nem valor — nota o item ainda não tem
              (é o que falta ler) e valor é assunto da coleção, não da fila. */}
          {(edicao || importado) && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {edicao && <span className="pill pill-quero">{edicao}</span>}
              {importado && <span className="pill pill-quero">Importado</span>}
            </div>
          )}
        </div>
      </div>

      {/* ---- ações ---- */}
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => aoLer(item)}
          className="neo-btn !py-1.5 !px-2.5"
          title={'Marcar ' + rotulo + ' como lido'}
        >
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
          Lido
        </button>
        {/* Vermelho e com anel próprio, ao lado de um botão neutro: tirar da
            fila é a única ação da linha que desfaz alguma coisa, e o `rust` é
            a cor que o projeto já usa para isso (urgente, excluir volume). O
            anel vale SEMPRE, não só no hover — num toque não existe hover, e
            o aviso tem de estar lá antes do dedo. */}
        <button
          type="button"
          onClick={() => aoTirar(item)}
          className="shrink-0 w-8 h-8 rounded-full border border-rust text-rust inline-flex items-center justify-center transition-colors hover:bg-tinta-rust"
          title={'Tirar ' + rotulo + ' da fila'}
          aria-label={'Tirar ' + rotulo + ' da fila'}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  )
}

export default function Fila({ open, onClose, onNotice, onEditar }) {
  const { obras, fila, reordenarFila, removerDaFila, marcarLido } = useStore()
  const reduzido = usaMovimentoReduzido()
  const arrasto = useDragControls()
  const [aNotar, setANotar] = useState(null)

  /* A fila guardada é de `{id, vol}`; a tela precisa das obras resolvidas.
     Cada item leva junto a `entrada` que o gerou: é ela que o Reorder
     devolve, já no formato do store.
   *
   * DUAS COISAS SAEM AQUI, e as duas têm de sair da MESMA lista que vai para
   * o Reorder: entrada que não resolve mais (obra apagada, volume que sumiu)
   * DUAS COISAS SAEM AQUI, e as duas têm de sair da MESMA lista que vai para
   * o Reorder: entrada que não resolve mais (obra apagada, volume que sumiu)
   * e unidade que não pode mais estar na fila — já lida, ou tirada da
   * estante.
   *
   * Esse segundo filtro aparece porque a poda do store só roda quando ALGUMA
   * obra muda — um aparelho que recebe a coleção pela nuvem, ou um arquivo
   * restaurado, chega com a fila como ela estava lá. Filtrar na leitura faz
   * a tela dizer a verdade sem esperar a próxima edição.
   * a verdade sem esperar a próxima edição.
   *
   * E o Reorder recebe `vivas`, não `fila`. Essa era a armadilha: com uma
   * entrada morta, `fila` teria 3 itens e a tela 2 — o arrasto reordenaria
   * uma lista que ninguém vê e devolveria a ordem errada. Passando as vivas,
   * o primeiro arrasto também GRAVA a limpeza. */
  const itens = []
  fila.forEach((entrada) => {
    const [item] = filaResolvida(obras, [entrada])
    if (item && podeEnfileirar(item.unidade)) itens.push({ ...item, entrada })
  })
  const vivas = itens.map(i => i.entrada)

  const aoLer = (item) => setANotar({ ...item })

  const confirmarNota = (nota) => {
    if (!aNotar) return
    marcarLido(aNotar.obra.id, aNotar.vol, nota)
    onNotice?.(nota > 0 ? 'Lido, com nota ✓' : 'Lido ✓')
    setANotar(null)
  }

  /* Fechar o pop-up sem salvar AINDA marca lido, sem nota. O clique em "Lido"
     já foi a decisão; o pop-up só oferece a nota. Marcar no fechar, e não no
     clique, mantém uma gravação só em vez de duas seguidas. */
  const fecharNota = () => {
    if (aNotar) {
      marcarLido(aNotar.obra.id, aNotar.vol, 0)
      onNotice?.('Lido ✓')
    }
    setANotar(null)
  }

  const tirar = (item) => {
    removerDaFila(item.obra.id, item.vol)
    onNotice?.('Tirado da fila.')
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 veu-canelado"
              initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE} onClick={onClose} />
            <motion.div
              className="fixed right-0 top-0 z-50 h-full w-[min(440px,100%)] bg-surface border-l border-separador flex flex-col"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={reduzido ? { duration: 0.16 } : MOLA_GAVETA}
              /* O arrasto da GAVETA sai só do cabeçalho. O corpo tem linhas
                 que se arrastam para reordenar, e as duas coisas competindo
                 pelo mesmo gesto fariam um reordenar fechar a gaveta. */
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
                className="flex items-center gap-3 px-5 py-3.5 border-b border-separador cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={e => arrasto.start(e)}
              >
                <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Fila de leitura</h3>
                {itens.length > 0 && (
                  <span className="font-mono text-rotulo text-ink-faint tabular-nums">{itens.length}</span>
                )}
                <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
              </div>

              <div className="flex-1 overflow-auto px-5 py-2">
                {itens.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="text-corpo text-ink-soft">A fila está vazia.</div>
                    <p className="mt-2 max-w-[38ch] mx-auto text-apoio text-ink-faint leading-relaxed">
                      Escolha uma obra e clique no botão <b>Salvar na fila</b> para
                      incluí-la aqui.
                    </p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={vivas} onReorder={reordenarFila} className="flex flex-col">
                    <AnimatePresence initial={false}>
                      {itens.map(item => (
                        <Linha key={chaveFila(item.obra.id, item.vol)} item={item} aoLer={aoLer} aoTirar={tirar} aoEditar={(it) => onEditar?.(it.obra)} />
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FORA da gaveta: o pop-up tem de sobreviver a ela e ficar POR CIMA
          (z-70 contra z-50). Dentro, herdaria o recorte e o arrasto dela. */}
      <PopupNota alvo={aNotar} onFechar={fecharNota} onConfirmar={confirmarNota} />
    </>
  )
}
