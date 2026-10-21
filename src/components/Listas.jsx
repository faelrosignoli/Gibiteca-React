import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA,
  deveDispensar, usaMovimentoReduzido, MOLA_TOQUE,
} from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { obrasDaLista, sortList, coverOf, edOf, gNorm, initials, classeTinta } from '../lib/helpers.js'

/* AS LISTAS.
 *
 * Pastas feitas à mão: "Para reler", "Emprestados", "Comprar na bienal". Uma
 * obra pode estar em várias, e estar numa lista não muda nada sobre ela — não
 * é status, não é filtro, não é fila. É arrumação.
 *
 * UMA gaveta, DOIS níveis: o índice das listas e, ao abrir uma, a galeria
 * dela. Não são duas telas empilhadas — a gaveta é a mesma, o conteúdo é que
 * troca, e o cabeçalho ganha uma seta de voltar. Duas gavetas sobrepostas
 * dariam dois véus, dois arrastos e duas formas de fechar.
 *
 * Mesma casca da Fila e dos Filtros (`w-[min(440px,100%)]`): gaveta no
 * desktop, tela cheia no celular sem precisar de um segundo layout.
 */

/* Escolher obras: busca + grade de capas que se marcam.
 *
 * É GRADE, não lista de caixinhas. A obra se reconhece pela capa muito antes
 * do título, e numa coleção de centenas é isso que faz achar sem procurar.
 * O marcado é o próprio cartão que se acende — sem checkbox ao lado, que
 * duplicaria o alvo de clique e roubaria largura da capa.
 */
function EscolherObras({ obras, escolhidas, aoAlternar }) {
  const [busca, setBusca] = useState('')

  const vistas = useMemo(() => {
    const q = gNorm(busca.trim())
    if (!q) return obras
    return obras.filter(o => gNorm([o.nome, edOf(o)].filter(Boolean).join(' ')).includes(q))
  }, [obras, busca])

  return (
    <>
      <input
        className="field-input w-full"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Procurar na coleção"
        aria-label="Procurar obras para pôr na lista"
      />

      {vistas.length === 0 ? (
        <p className="mt-4 text-apoio text-ink-faint">Nada com esse nome.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {vistas.map(o => {
            const dentro = escolhidas.includes(o.id)
            const capa = coverOf(o)
            return (
              <button
                key={o.id} type="button" onClick={() => aoAlternar(o.id)}
                aria-pressed={dentro}
                className="flex flex-col gap-1.5 min-w-0 text-left group"
              >
                <div className={'w-full aspect-square relative flex items-center justify-center rounded-pequeno transition ' +
                  (dentro ? 'ring-2 ring-moss ring-offset-2 ring-offset-surface' : 'opacity-80 group-hover:opacity-100')}>
                  {capa
                    ? <img src={capa} alt="" loading="lazy" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno" />
                    : <div className={'w-full h-full rounded-pequeno flex items-center justify-center ' + classeTinta(edOf(o) || o.nome)}>
                        <span className="font-display font-semibold text-corpo leading-none text-sobre-tinta">{initials(o.nome)}</span>
                      </div>}
                  {/* O visto fica DENTRO da moldura, no canto: fora dela, numa
                      grade apertada, ele encostaria no cartão vizinho e a
                      pessoa leria o visto do outro. */}
                  {dentro && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-moss text-sobre-acento inline-flex items-center justify-center shadow-amb">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="text-apoio leading-snug text-ink break-words">{o.nome}</span>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/* O + das duas ações de acrescentar. Um só desenho porque é um só verbo —
   "mais um" —, mudando apenas de tamanho entre o botão flutuante e o de
   dentro do fluxo. */
function IconMais({ tamanho = 'w-[15px] h-[15px]' }) {
  return (
    <svg className={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
/* Uma lista numerada: três linhas e os algarismos à esquerda. Não é um "1"
   solto nem um hash — o que se liga aqui é a NUMERACAO da lista inteira. */
function IconNumerada() {
  return (
    <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6h11M10 12h11M10 18h11" />
      <path d="M4 5.5 5.5 5V9M3.5 15.5a1.5 1.5 0 1 1 2.6 1L3.5 19H6.5" />
    </svg>
  )
}

/* A tira de capas da prévia: as obras da lista em linha, rolando na
 * horizontal quando não cabem.
 *
 * Não há "limite de quantas cabem" escrito em lugar nenhum, e isso é de
 * propósito: o limite é a largura da gaveta, que muda entre o celular e o
 * desktop. Um número fixo erraria nos dois — sobraria vão num lado e cortaria
 * no outro. Quem decide é o `overflow-x`.
 *
 * O DEDO rola nativo. O MOUSE precisa de ajuda: `overflow-x` numa tela de
 * computador só rola com roda horizontal ou barra, e a barra está escondida
 * de propósito (ver `.tira-capas` no index.css). Daí o arrasto por ponteiro
 * aqui embaixo.
 *
 * `setPointerCapture`: sem ele, soltar o mouse fora da tira — o que acontece
 * sempre que se arrasta com força — deixa o arrasto preso ligado, e a tira
 * continua seguindo o cursor depois do gesto.
 */
function TiraDeCapas({ obras, onAbrir }) {
  const caixa = useRef(null)
  const gesto = useRef(null)

  const aoDescer = (e) => {
    const el = caixa.current
    if (!el || e.pointerType === 'touch') return      // no toque, o nativo já faz melhor
    gesto.current = { x: e.clientX, scroll: el.scrollLeft, andou: 0 }
    el.setPointerCapture(e.pointerId)
    el.dataset.arrastando = '1'
  }
  const aoMover = (e) => {
    const el = caixa.current
    if (!el || !gesto.current) return
    const d = e.clientX - gesto.current.x
    gesto.current.andou = Math.max(gesto.current.andou, Math.abs(d))
    el.scrollLeft = gesto.current.scroll - d
  }
  const aoSubir = (e) => {
    const el = caixa.current
    if (!el) return
    /* Arrastou? Então NÃO foi clique. Sem esta trava, todo arrasto terminaria
       abrindo a lista — e 4px de tremor de mão bastariam. */
    const arrastou = gesto.current && gesto.current.andou > 5
    gesto.current = null
    delete el.dataset.arrastando
    try { el.releasePointerCapture(e.pointerId) } catch (err) { /* já solto */ }
    if (!arrastou) onAbrir?.()
  }

  if (!obras.length) return null

  return (
    <div
      ref={caixa}
      className="tira-capas mt-2"
      onPointerDown={aoDescer}
      onPointerMove={aoMover}
      onPointerUp={aoSubir}
      onPointerCancel={() => { gesto.current = null; if (caixa.current) delete caixa.current.dataset.arrastando }}
      /* A tira não é botão nem lista para quem ouve: as capas repetiriam, uma
         a uma, nomes que a linha de cima já disse. Quem abre a lista para o
         teclado e o leitor de tela é o botão do título. */
      aria-hidden="true"
    >
      {obras.map(o => {
        const capa = coverOf(o)
        return (
          /* sem largura nem altura aqui: o tamanho vem de `.tira-capas > *`,
             que divide a largura por seis. Fixar em classe faria dois lugares
             decidirem o mesmo, e o da tira ganharia só às vezes. */
          <div key={o.id} className="relative flex items-center justify-center">
            {capa
              ? <img src={capa} alt="" loading="lazy" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_6px_12px_-7px_rgba(33,33,33,.55)]" />
              : <div className={'w-full h-full rounded-pequeno flex items-center justify-center ' + classeTinta(edOf(o) || o.nome)}>
                  <span className="font-display font-semibold text-apoio leading-none text-sobre-tinta">{initials(o.nome)}</span>
                </div>}
          </div>
        )
      })}
    </div>
  )
}
/* Os dois modos de ordem, em letras de verdade e não em desenho.
 *
 * "ABC" e "123" dizem o que fazem sem precisar de legenda, e nenhum ícone
 * desenhado chega perto disso. Vão em `font-mono` porque ali os três sinais
 * têm a mesma largura: em fonte proporcional o "1" é estreito e o bloco
 * "123" fica menor que o "ABC", desalinhando os dois lados do seletor. */
const ORDENS = [
  ['alfabetica', 'ABC', 'Alfabética'],
  ['numerada', '123', 'Numerada'],
]

/* O seletor de ordem, no pop-up de editar a lista.
 *
 * Aqui e não na galeria: é um ajuste da lista, e ajuste mora junto do nome,
 * atrás da mesma porta. Exposto sobre a galeria, virava um botão permanente
 * para uma decisão que se toma uma vez.
 *
 * Duas opções lado a lado e não um interruptor de liga/desliga: alfabética
 * não é "numerada desligada", é outra ordem. Um interruptor diria que uma
 * delas é a ausência da outra.
 */
function SeletorOrdem({ valor, onChange }) {
  return (
    <div role="radiogroup" aria-label="Ordem das obras na lista"
         className="flex w-full rounded-full border border-contorno bg-paper-2 p-1 gap-1">
      {ORDENS.map(([v, sigla, rotulo]) => {
        const marcado = valor === v
        return (
          <button
            key={v} type="button" role="radio" aria-checked={marcado}
            onClick={() => onChange(v)}
            className={'flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 px-2 text-corpo font-semibold transition ' +
              (marcado
                ? 'bg-surface-pure text-acento-texto shadow-amb ring-1 ring-moss-2'
                : 'text-ink-soft hover:bg-toque')}
          >
            <span className="font-mono text-rotulo font-bold tracking-tight" aria-hidden="true">{sigla}</span>
            {rotulo}
          </button>
        )
      })}
    </div>
  )
}

/* Uma célula da galeria da lista.
 *
 * Na ordem NUMERADA ela se arrasta para trocar de posição. O arrasto é do
 * framer-motion (`drag`), mas quem decide o destino é a GEOMETRIA da grade,
 * não o `Reorder`: o `Reorder` reordena por um eixo só, e numa grade de três
 * colunas isso quebra — arrastar da coluna 1 para a 2 na mesma linha não
 * muda o Y, então nada acontece.
 *
 * Aqui o destino sai de uma conta simples: ao soltar, o pai procura qual
 * célula contém o ponto do ponteiro. Funciona em qualquer arranjo de colunas,
 * no mouse e no dedo.
 *
 * `dragSnapToOrigin`: a célula volta sozinha ao lugar, e quem move o item é a
 * reordenação do estado — não a posição que o arrasto deixou. Sem isso, uma
 * soltura fora da grade deixaria a capa jogada num canto.
 *
 * `data-indice` é como o pai acha as células para medir. É atributo e não
 * ref porque o pai precisa das OITO de uma vez, no momento da soltura.
 */
function CelulaLista({ obra, indice, numerada, arrastavel, aoSoltar, aoEditar, aoTirar }) {
  const capa = coverOf(obra)
  const reduzido = usaMovimentoReduzido()
  const podeArrastar = arrastavel && !reduzido

  return (
    <motion.div
      data-indice={indice}
      className="flex flex-col gap-1.5 min-w-0"
      /* `layout` faz as OUTRAS células abrirem espaço quando a ordem muda.
         Sem ele a grade salta de arranjo e some a noção do que foi para onde. */
      layout
      transition={MOLA_TOQUE}
      drag={podeArrastar}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.18}
      whileDrag={{ scale: 1.06, zIndex: 20 }}
      onDragEnd={(e) => aoSoltar?.(indice, e)}
    >
      {/* Duplo clique abre o editor da obra. Clique simples não faz nada aqui
          de propósito: o único toque simples da célula é o × do canto, e dar
          DUAS funções ao mesmo alvo faria quem quer tirar da lista cair no
          editor.

          O `title` diz os dois atalhos — nem duplo clique nem arrasto têm
          aparência, e sem o aviso ninguém descobre. */}
      <div
        className={'w-full aspect-square relative flex items-center justify-center select-none ' +
          (podeArrastar ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-pointer')}
        onDoubleClick={() => aoEditar?.(obra)}
        title={(podeArrastar ? 'Arraste para mudar a ordem · ' : '') + 'Clique duas vezes para editar ' + obra.nome}
      >
        {capa
          ? <img src={capa} alt="" loading="lazy" draggable="false" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_10px_20px_-10px_rgba(33,33,33,.55)]" />
          : <div className={'w-full h-full rounded-pequeno flex items-center justify-center shadow-[0_10px_20px_-10px_rgba(33,33,33,.55)] ' + classeTinta(edOf(obra) || obra.nome)}>
              <span className="font-display font-semibold text-secao leading-none text-sobre-tinta">{initials(obra.nome)}</span>
            </div>}

        {/* O número vai no canto de BAIXO à esquerda: o × já ocupa o de cima
            à direita, e os dois no mesmo canto brigariam pelo mesmo toque. */}
        {numerada && (
          <span
            aria-hidden="true"
            className="absolute bottom-1 left-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-ink text-paper font-mono text-rotulo font-bold tabular-nums inline-flex items-center justify-center shadow-amb"
          >
            {indice + 1}
          </span>
        )}

        <button type="button"
          onClick={aoTirar}
          title={'Tirar ' + obra.nome + ' da lista'}
          aria-label={'Tirar ' + obra.nome + ' da lista'}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-surface/90 border border-rust text-rust inline-flex items-center justify-center hover:bg-tinta-rust">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* O número também entra no TEXTO quando a lista é numerada: a pastilha
      {/* O número não se repete no texto visível — ele já está na pastilha
          sobre a capa, e repetido aqui comia uma linha de nome. Para quem
          ouve ele continua, em `sr-only`: a pastilha é `aria-hidden`, e sem
          isto a ordem sumiria para o leitor de tela. */}
      <div className="text-apoio leading-snug text-ink break-words text-center">
        {numerada && <span className="sr-only">{indice + 1}. </span>}{obra.nome}
      </div>
    </motion.div>
  )
}

/* Pop-up de criar ou renomear.
 *
 * Mesmo molde do Backup e do Tema. Ao CRIAR ele traz a escolha de obras
 * junto, porque é assim que se cria uma lista: com o nome e com o que vai
 * dentro. Ao renomear, só o nome — as obras se mexem na galeria, que é onde
 * elas estão à vista.
 */
function PopupLista({ aberto, lista, obras, onFechar, onSalvar }) {
  const editando = !!lista
  const [nome, setNome] = useState('')
  const [escolhidas, setEscolhidas] = useState([])
  const [ordem, setOrdem] = useState('alfabetica')

  /* Zera ao ABRIR, num efeito — não durante o render. Chamar setter no corpo
     do componente reagenda o render de dentro dele mesmo, e com mais de um
     setter o React pode rodar a sincronia de novo antes de assentar. É o
     mesmo padrão do `draftFromObra` no Editor, pelo mesmo motivo. */
  useEffect(() => {
    if (!aberto) return
    setNome(lista ? lista.nome : '')
    setEscolhidas([])
    setOrdem(lista && lista.numerada ? 'numerada' : 'alfabetica')
  }, [aberto, lista])

  const alternar = (id) => setEscolhidas(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

  const salvar = () => {
    if (!nome.trim()) return
    onSalvar(nome.trim(), escolhidas, ordem === 'numerada')
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}
        >
          <motion.div
            className="w-full sm:max-w-[560px] h-full sm:h-auto sm:max-h-[88vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">
                {editando ? 'Editar lista' : 'Nova lista'}
              </h3>
              <button className="neo-icon !w-9 !h-9" onClick={onFechar} aria-label="Fechar">×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 sm:px-6 py-5">
              <label className="font-rotulo text-rotulo uppercase text-ink-soft pl-0.5">Nome da lista</label>
              <input
                className="field-input w-full mt-1"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Para reler, Emprestados, Comprar na bienal…"
                autoFocus
              />

              <div className="mt-5">
                <label className="font-rotulo text-rotulo uppercase text-ink-soft pl-0.5">Ordem das obras</label>
                <div className="mt-1.5"><SeletorOrdem valor={ordem} onChange={setOrdem} /></div>
                <p className="mt-2 text-apoio text-ink-faint leading-relaxed">
                  {ordem === 'numerada'
                    ? 'As obras ficam na ordem que você montar, numeradas — e dá para arrastar na galeria.'
                    : 'As obras aparecem em ordem alfabética.'}
                </p>
              </div>

              {!editando && (
                <div className="mt-6">
                  <div className="font-rotulo text-rotulo uppercase text-ink-soft pl-0.5 mb-2">
                    Obras {escolhidas.length > 0 && <span className="text-acento-texto">· {escolhidas.length}</span>}
                  </div>
                  {obras.length === 0 ? (
                    <p className="text-apoio text-ink-faint">A coleção está vazia — dá para criar a lista agora e pôr obras depois.</p>
                  ) : (
                    <EscolherObras obras={obras} escolhidas={escolhidas} aoAlternar={alternar} />
                  )}
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-linha">
              {/* Desabilitado sem nome, e não um alerta depois do clique: lista
                  sem nome não se acha de volta, e o botão apagado diz isso
                  antes de a pessoa tentar. */}
              <button type="button" className="cta w-full justify-center !pr-5 disabled:opacity-40"
                      disabled={!nome.trim()} onClick={salvar}>
                {editando ? 'Salvar' : 'Criar lista'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Listas({ open, onClose, onNotice, onEditar }) {
  const { obras, listas, criarLista, renomearLista, apagarLista, alternarNaLista, alternarNumeracao, reordenarLista } = useStore()
  const reduzido = usaMovimentoReduzido()
  const arrasto = useDragControls()

  /* Qual lista está ABERTA. `null` = o índice. É o único estado de navegação
     da gaveta — com dois níveis só, uma pilha seria peso sem uso. */
  const [abertaId, setAbertaId] = useState(null)
  const [popup, setPopup] = useState(null)      // null | 'nova' | lista (renomear)
  const [escolhendo, setEscolhendo] = useState(false)

  const aberta = listas.find(l => l.id === abertaId) || null
  /* AS OBRAS NA ORDEM DO MODO.
   *
   * Numerada: a ordem guardada, que é a que a pessoa arrastou.
   * Alfabética: calculada na hora, com o colator do projeto — "é" vale "e",
   * como no resto do app. Não se grava: gravar a ordem alfabética apagaria
   * a ordem montada à mão, e voltar para numerada devolveria uma lista
   * remexida.
   */
  const cru = aberta ? obrasDaLista(obras, aberta) : []
  const dentro = useMemo(() => (aberta && !aberta.numerada ? sortList(cru, { by: 'nome', dir: 'asc' }) : cru),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aberta && aberta.id, aberta && aberta.numerada, cru.map(o => o.id).join()])

  /* ONDE A CÉLULA FOI SOLTA.
   *
   * O framer-motion diz de onde saiu; quem diz para onde foi é a geometria.
   * Mede-se a caixa de cada célula NA HORA da soltura e procura-se qual
   * contém o ponto do ponteiro. Funciona em qualquer número de colunas, no
   * mouse e no dedo — e é o que o `Reorder` não dá, porque ele ordena por um
   * eixo só e na mesma linha o Y não muda.
   *
   * Soltou fora de qualquer célula? Nada acontece, e o `dragSnapToOrigin`
   * devolve a capa ao lugar. Desistir de um arrasto não pode bagunçar nada.
   */
  const grade = useRef(null)
  const moverPara = useCallback((de, evento) => {
    const caixa = grade.current
    if (!caixa || !aberta) return
    const x = evento.clientX, y = evento.clientY
    if (x == null || y == null) return
    const celulas = [...caixa.querySelectorAll('[data-indice]')]
    /* PULA A PRÓPRIA. Ao soltar, a célula arrastada ainda está no ponto da
       soltura — o `dragSnapToOrigin` só a devolve depois. Sem esta linha ela
       encontra a si mesma, `alvo === de`, e o arrasto não fazia nada: foi
       exatamente o defeito do primeiro teste. */
    const alvo = celulas.findIndex((c, k) => {
      if (k === de) return false
      const r = c.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    })
    if (alvo < 0 || alvo === de) return
    const ids = dentro.map(o => o.id)
    const [movida] = ids.splice(de, 1)
    ids.splice(alvo, 0, movida)
    reordenarLista(aberta.id, ids)
  }, [aberta, dentro, reordenarLista])

  const fechar = () => { setAbertaId(null); setEscolhendo(false); onClose() }

  const salvarPopup = (nome, ids, numerada) => {
    if (popup === 'nova') {
      const nova = criarLista(nome, ids)
      /* criar já com a ordem escolhida: alternar depois faria duas
         gravações e dois envios para a nuvem por um ato só */
      if (nova && numerada) alternarNumeracao(nova.id)
      setPopup(null)
      if (nova) {
        setAbertaId(nova.id)
        onNotice?.(ids.length ? `Lista criada com ${ids.length} ${ids.length === 1 ? 'obra' : 'obras'} ✓` : 'Lista criada ✓')
      }
    } else {
      renomearLista(popup.id, nome)
      if (!!popup.numerada !== !!numerada) alternarNumeracao(popup.id)
      setPopup(null)
      onNotice?.('Lista atualizada ✓')
    }
  }

  const apagar = (l) => {
    /* Confirma porque não tem desfazer. E DIZ que as obras ficam: sem essa
       frase, apagar uma lista de 40 itens parece apagar 40 obras. */
    if (!confirm(`Apagar a lista "${l.nome}"?\n\nAs obras continuam na coleção — some só a lista.\n\nIsso não tem desfazer.`)) return
    if (abertaId === l.id) setAbertaId(null)
    apagarLista(l.id)
    onNotice?.('Lista apagada.')
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 veu-canelado"
              initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE} onClick={fechar} />
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
                if (deveDispensar({ deslocamento: info.offset.x, velocidade: info.velocity.x, tamanho: 440 })) fechar()
              }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3.5 border-b border-separador cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={e => arrasto.start(e)}
              >
                {/* A seta de voltar SÓ existe no segundo nível. Sempre visível,
                    ela viraria um botão morto no índice. */}
                {aberta && (
                  <button className="neo-icon !w-9 !h-9 shrink-0" onClick={() => { setAbertaId(null); setEscolhendo(false) }}
                          aria-label="Voltar para as listas">
                    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                )}
                <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1 min-w-0 truncate">
                  {aberta ? aberta.nome : 'Listas'}
                </h3>
                <button className="neo-icon !w-9 !h-9 shrink-0" onClick={fechar} aria-label="Fechar">×</button>
              </div>

              <div className={`flex-1 overflow-auto px-5 py-4 ${!aberta ? 'pb-24' : ''}`}>
                {!aberta ? (
                  /* ---------- nível 1: o índice ---------- */
                  <>
                    {listas.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="text-corpo text-ink-soft">Nenhuma lista ainda.</div>
                        <p className="mt-2 max-w-[38ch] mx-auto text-apoio text-ink-faint leading-relaxed">
                          Listas são pastas feitas por você — "Para reler", "Emprestados". Uma obra
                          pode estar em várias, e entrar numa lista não muda nada sobre ela.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {listas.map(l => {
                          const dentroDela = obrasDaLista(obras, l)
                          const n = dentroDela.length
                          return (
                            /* A linha deixou de ser um botão só: a tira de
                               capas tem de ficar FORA do botão do título.
                               Dentro, o arrasto da tira e o clique do botão
                               disputariam o mesmo gesto, e rolar as capas
                               abriria a lista. */
                            <div key={l.id} className="py-3 border-b border-linha">
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setAbertaId(l.id)}
                                        className="flex-1 min-w-0 text-left">
                                  <div className="text-corpo text-ink break-words">{l.nome}</div>
                                  <div className="text-apoio text-ink-faint">
                                    {n === 0 ? 'vazia' : n === 1 ? '1 obra' : `${n} obras`}
                                  </div>
                                </button>
                                <button className="neo-icon !w-8 !h-8 shrink-0" onClick={() => setPopup(l)}
                                        title={'Renomear ' + l.nome} aria-label={'Renomear ' + l.nome}>
                                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                                </button>
                                <button className="neo-icon !w-8 !h-8 shrink-0" onClick={() => apagar(l)}
                                        title={'Apagar ' + l.nome} aria-label={'Apagar ' + l.nome}>
                                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
                                  </svg>
                                </button>
                              </div>
                              <TiraDeCapas obras={dentroDela} onAbrir={() => setAbertaId(l.id)} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : escolhendo ? (
                  /* ---------- nível 2b: pôr mais obras ----------
                     A mesma grade de escolha do pop-up de criar, só que aqui
                     cada toque JÁ grava: a lista existe, e guardar um rascunho
                     de alterações para confirmar depois criaria um estado que
                     some se a gaveta fechar. */
                  <>
                    <EscolherObras
                      obras={obras}
                      escolhidas={aberta.obras}
                      aoAlternar={(id) => alternarNaLista(aberta.id, id)}
                    />
                    <button type="button" className="neo-btn w-full justify-center mt-5" onClick={() => setEscolhendo(false)}>
                      Pronto
                    </button>
                  </>
                ) : (
                  /* ---------- nível 2: a galeria ---------- */
                  <>
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-linha">
                      <span className="font-rotulo text-rotulo uppercase text-ink-faint flex-1 min-w-0">
                        {dentro.length === 0 ? 'vazia' : dentro.length === 1 ? '1 obra' : dentro.length + ' obras'}
                      </span>
                    </div>

                    {dentro.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="text-corpo text-ink-soft">Lista vazia.</div>
                      </div>
                    ) : (
                      <div ref={grade} className="grid grid-cols-3 gap-3">
                        {dentro.map((o, i) => (
                          <CelulaLista
                            key={o.id}
                            obra={o}
                            indice={i}
                            numerada={!!aberta.numerada}
                            arrastavel={!!aberta.numerada && dentro.length > 1}
                            aoSoltar={moverPara}
                            aoEditar={onEditar}
                            aoTirar={() => { alternarNaLista(aberta.id, o.id); onNotice?.('Tirado da lista.') }}
                          />
                        ))}
                      </div>
                    )}


                    <button type="button" className="cta w-full justify-center !pr-5 mt-5 gap-2" onClick={() => setEscolhendo(true)}>
                      <IconMais />
                      Adicionar obras
                    </button>
                  </>
                )}
              </div>
              {/* NOVA LISTA — flutuante, no canto de baixo à direita.
                  Só o sinal de +, sem palavra: no índice não há outra coisa
                  para criar, e a cruz num canto de baixo é o gesto que todo
                  app usa para "mais um". O nome vive no `aria-label` e no
                  `title`, que é onde ele serve de verdade — para quem ouve e
                  para quem para o cursor em cima.

                  `absolute`, não `fixed`: a âncora é a GAVETA, não a janela.
                  Em `fixed` ele ficaria na tela mesmo com a gaveta fechada e
                  cairia por cima do botão "Nova obra" da coleção.

                  Só no índice. No segundo nível quem cria é "Adicionar
                  obras", e dois botões de + na mesma tela, um flutuando e
                  outro no fluxo, significariam coisas diferentes com o mesmo
                  desenho. */}
              {!aberta && (
                <button
                  type="button"
                  onClick={() => setPopup('nova')}
                  title="Nova lista"
                  aria-label="Nova lista"
                  className="fab-nova-lista absolute right-5 bottom-5 z-10 w-14 h-14 rounded-full
                    bg-ink text-paper inline-flex items-center justify-center
                    shadow-[0_14px_28px_-12px_rgba(33,33,33,.7)]
                    transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
                    hover:-translate-y-px active:scale-[.96]
                    outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-ink/30"
                >
                  <IconMais tamanho="w-6 h-6" />
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PopupLista
        aberto={popup != null}
        lista={popup === 'nova' ? null : popup}
        obras={obras}
        onFechar={() => setPopup(null)}
        onSalvar={salvarPopup}
      />
    </>
  )
}
