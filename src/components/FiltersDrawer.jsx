import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, MOLA_TOQUE, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA,
  deveDispensar, usaMovimentoReduzido,
} from '../lib/motion.js'
import { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { edOf, authorsOf, tipoOf, passes, comoLista } from '../lib/helpers.js'
import { TIPOS_EDICAO } from '../data.js'
import Selecao from './Selecao.jsx'
import { EstrelasInput } from './Estrelas.jsx'

/* O PAINEL DE FILTROS, reescrito para parar de se repetir.
 *
 * O QUE ELE ERA: dez controles empilhados, cada um com um rótulo em caixa
 * alta por cima. A palavra "Todos"/"Todas" aparecia SEIS vezes — era a
 * primeira opção de todo campo —, havia OITO rótulos, três seletores
 * segmentados com a mesma cara, e a ordenação estava partida em dois campos
 * ("Ordenar por" e "Ordem") que juntos diziam uma coisa só.
 *
 * O princípio que organiza tudo o que mudou:
 *
 *   NÃO FILTRAR NÃO É UMA OPÇÃO — É A AUSÊNCIA DE UMA.
 *
 * "Todos" não é um valor ao lado de "Tenho" e "Quero"; é o que sobra quando
 * nenhum dos dois está ligado. Tratá-lo como botão obrigava a desenhar um
 * terceiro alvo, a escrever a palavra e a explicar, em cada campo, que o
 * estado inicial tem nome. Trocando os segmentados por chips que ligam e
 * desligam, as seis palavras somem de uma vez e cada campo fica com um alvo
 * a menos.
 *
 * E onde o rótulo só existia para dizer o que o campo é, ele passou a ser o
 * PRÓPRIO texto do campo vazio: "Editora" até escolherem, "Panini +2"
 * depois. Os dois nunca precisam aparecer juntos.
 */

const TIPOS = [['avulso', 'Avulsos'], ['box', 'Boxes'], ['serie', 'Séries']]

// valor "sem filtro" de cada campo, para conseguir neutralizar um de cada vez
const NEUTRO = { status: 'todos', tipo: '', tipoEdicao: [], editora: [], autor: [], nota: '', leitura: 'todos', importado: false, urgencia: false, q: '' }

// campo multi ligado = lista com algo dentro
const temAlgo = (v) => comoLista(v).length > 0

/* O FILTRO DE NOTA — estrelas, e não uma lista suspensa.
 *
 * A lista dizia "★ 4,5" em texto. Mas a nota já tem uma forma nesta casa: o
 * cartão, a ficha e o editor mostram estrelas, e só aqui ela viraria uma
 * palavra. Escolher a nota com o mesmo gesto com que se dá a nota é o que
 * torna o filtro reconhecível antes de ser lido.
 *
 * É O MESMO `EstrelasInput` do editor e da ficha, de propósito: clicar na
 * estrela marcada vira meia estrela, que é como as notas quebradas existem no
 * app. Um controle novo aqui teria de reaprender essa regra e um dia divergir
 * dela.
 *
 * ZERO NÃO É ESCOLHÍVEL, e é isso que deixa o campo vazio significar "sem
 * filtro" sem ambiguidade. Quem quiser sair de uma nota escolhida usa o ×,
 * que só aparece quando há o que limpar.
 *
 * A NOTA É EXATA: quatro estrelas mostra o que tem quatro, não "quatro ou
 * mais". Foi o pedido, e tem uma vantagem — com meia estrela na escala, "ou
 * mais" sempre obriga a decidir se 4 inclui 4,5, e exato não precisa decidir
 * nada. Para virar "ou mais", é trocar `!==` por `<` lá no `passes`.
 */
function FiltroNota({ valor, onChange }) {
  const n = Number(valor) || 0
  return (
    <div className={`h-[42px] rounded-full border flex items-center gap-2 px-3 transition-colors
      ${n ? 'border-moss bg-surface-2' : 'border-contorno bg-surface'}`}>
      <span className={`font-rotulo text-rotulo uppercase font-bold shrink-0
        ${n ? 'text-acento-texto' : 'text-ink-faint'}`}>Nota</span>
      <EstrelasInput
        value={n}
        onChange={v => onChange(v || '')}
        tamanho="w-[17px] h-[17px]"
        limpar={false}
      />
      {/* O × ocupa lugar fixo mesmo apagado: aparecendo e sumindo, ele
          empurrava as estrelas de lado a cada escolha. */}
      <button
        type="button"
        onClick={() => onChange('')}
        disabled={!n}
        aria-label="Tirar o filtro de nota"
        title="Tirar o filtro de nota"
        className={`shrink-0 ml-auto w-4 h-4 inline-flex items-center justify-center transition-opacity
          ${n ? 'text-ink-mute hover:text-rust opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}

/* O rótulo do campo VAZIO é o nome do campo, e ele vem do `placeholder`.
 *
 * Era "Todas", como PRIMEIRA OPÇÃO da lista — e aí o nome do campo precisava
 * de uma etiqueta por cima para dizer todas-o-quê. Agora a caixa diz
 * "Editora" enquanto está vazia e "Panini +2" quando está cheia: rótulo e
 * valor disputam o mesmo lugar porque nunca são necessários ao mesmo tempo.
 *
 * A OPÇÃO VAZIA SAIU DA LISTA, e não só trocou de nome. Renomeada, ela virava
 * uma linha chamada "Edição" dentro da lista de edições, marcada por padrão —
 * uma opção com o nome do próprio campo, que não quer dizer nada. Em
 * multi-seleção ela também não tinha função: quem limpa, desmarca.
 *
 * Sem o item `''`, o `Selecao` cai no `placeholder` sozinho (ver `rotuloVazio`
 * lá dentro), que é exatamente o nome do campo. */
const comoOpcoes = (itens) => itens.map(x => [x, x])

const ordenar = (conjunto) => Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt'))

/* O que está escolhido nunca some da própria lista.
 *
 * Sem isso, apertar dois filtros que se excluem faria o valor escolhido
 * desaparecer das opções, e o campo passaria a mostrar o nome vazio enquanto
 * continua filtrando — a interface mentiria sobre o próprio estado.
 *
 * Com multi-seleção isso pesa mais: marcar três editoras e ver duas sumirem
 * ao ligar "Tenho" tiraria justamente a forma de desmarcá-las. */
const comOsEscolhidos = (lista, atuais) => {
  const faltam = comoLista(atuais).filter(x => !lista.includes(x))
  return faltam.length ? [...faltam, ...lista] : lista
}

/* ------------------------------------------------------------------
   O PAR LIGADO: duas opções que se excluem, e a barra que aceita as duas

   "Tenho" e "Quero" não são dois interruptores independentes — são as duas
   respostas possíveis à MESMA pergunta, e uma obra nunca é as duas coisas.
   Soltos lado a lado, nada dizia isso: pareciam dois botões quaisquer que
   por acaso estavam perto.

   Agora são UM controle, com as três respostas dentro dele:

       ┌───────────┬───┬───────────┐
       │   Tenho   │ / │   Quero   │
       └───────────┴───┴───────────┘

   A BARRA NO MEIO é o estado neutro — "tanto faz", que é o que o antigo
   botão "Todos" dizia com uma palavra. A barra diz o mesmo com o sinal que
   já significa isso em português escrito: "tenho/quero" se lê como um ou
   outro, e é exatamente o recorte que ela aplica.

   É `radiogroup` com três `radio`, e não três interruptores: são faces de
   uma escolha só, sempre com uma marcada. Sem isso, quem ouve recebe três
   botões soltos sem saber de que pergunta são resposta — por isso o grupo
   leva `aria-label`, mesmo sem rótulo visível, e a barra se chama "Todos"
   em voz alta.
   ------------------------------------------------------------------ */
function ParLigado({ rotuloGrupo, opcoes, valor, neutro, onChange }) {
  const [esq, dir] = opcoes

  /* A fatia. `flex-1` nas das pontas e largura fixa na barra: as duas
     respostas dividem o que sobra em partes iguais, e a barra fica do
     tamanho de um alvo de dedo sem roubar espaço das palavras. */
  const Fatia = ({ v, children, rotulo, fixa }) => {
    const marcada = valor === v
    return (
      <button
        type="button" role="radio" aria-checked={marcada} aria-label={rotulo}
        onClick={() => onChange(v)}
        className={`${fixa ? 'w-11 shrink-0' : 'flex-1 min-w-0'} inline-flex items-center justify-center gap-1.5
          h-full px-2 text-corpo font-semibold transition-colors duration-200
          ${marcada ? 'bg-tinta-moss text-acento-texto' : 'text-ink-soft hover:text-ink'}`}
      >
        {children}
      </button>
    )
  }

  return (
    /* O contorno é do GRUPO, não de cada fatia: é a moldura única que faz as
       três lerem como um controle. `overflow-hidden` para o preenchimento da
       fatia marcada não vazar pelo arredondado das pontas. */
    <div
      role="radiogroup" aria-label={rotuloGrupo}
      className="flex items-stretch h-10 rounded-full border border-contorno overflow-hidden bg-surface"
    >
      <Fatia v={esq.v} rotulo={esq.rotulo}>{esq.icone}{esq.rotulo}</Fatia>

      {/* Os fios finos entre as fatias. Sem eles, duas fatias apagadas lado a
          lado viram um campo de texto vazio com uma barra perdida no meio. */}
      <span aria-hidden="true" className="w-px bg-linha shrink-0" />

      {/* A barra é um GLIFO, não uma palavra: é a única fatia que não nomeia
          um recorte, e sim a ausência dele. `leading-none` e o deslocamento de
          um pixel porque a barra da fonte senta alta na caixa de texto. */}
      <Fatia v={neutro} rotulo="Todos" fixa>
        <span className="text-secao leading-none -translate-y-px font-normal">/</span>
      </Fatia>

      <span aria-hidden="true" className="w-px bg-linha shrink-0" />

      <Fatia v={dir.v} rotulo={dir.rotulo}>{dir.icone}{dir.rotulo}</Fatia>
    </div>
  )
}

/* ------------------------------------------------------------------
   O CHIP QUE LIGA E DESLIGA

   Para o que NÃO é par: "urgentes" e "importados" são interruptores
   independentes — uma obra pode ser as duas, ou nenhuma. Por isso continuam
   soltos, e a diferença de forma em relação aos pares acima é honesta: ali
   se escolhe entre, aqui se liga.

   `aria-pressed`, e não `aria-checked`: é interruptor, não opção de grupo.
   Quem ouve recebe "Urgentes, botão, não pressionado", que é a descrição
   exata do que está na tela.
   ------------------------------------------------------------------ */
function Chip({ ligado, onClick, children, title }) {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={ligado} title={title}
      /* `h-10` cravado, como em TODO controle deste painel. Deixando a altura
         sair do conteúdo, os chips davam 40px, os glifos 44 e a seta 42 — três
         alturas numa pilha de controles que se leem como uma coluna só. */
      className={`w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full border px-3 text-corpo font-semibold
        transition-colors duration-200
        ${ligado
          ? 'border-moss bg-tinta-moss text-acento-texto'
          : 'border-contorno text-ink-soft hover:border-moss-3 hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------
   OS TRÊS TIPOS, EM GLIFOS

   Avulso é um volume; série são vários lado a lado; box é uma caixa. São as
   três formas que a própria estante já tem, desenhadas — e ler três desenhos
   custa menos que ler três palavras numa trilha segmentada.

   O RÓTULO NÃO SOME: vai no `title` e no `aria-label`. Glifo sem nome
   acessível é um botão mudo para quem ouve, e um enigma para quem passa o
   mouse na primeira vez.

   Tipo sem nenhuma obra no recorte atual continua VISÍVEL, mas apagado e
   desabilitado — sumir mudaria o número de alvos a cada clique noutro filtro,
   e a mão aprende posição antes de aprender rótulo.
   ------------------------------------------------------------------ */
const GLIFOS = {
  avulso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="9" y="4" width="6.5" height="16" rx="1.4" />
    </svg>
  ),
  serie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="2.5" y="6" width="5" height="14" rx="1.2" />
      <rect x="9.5" y="4" width="5" height="16" rx="1.2" />
      <rect x="16.5" y="7" width="5" height="13" rx="1.2" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="1.6" />
      <path d="M3 10.5h18" />
      <path d="M10 6v4.5M14 6v4.5" />
    </svg>
  ),
}

function BotaoTipo({ valor, rotulo, ligado, morto, onClick }) {
  return (
    <button
      type="button" onClick={onClick} disabled={morto}
      aria-pressed={ligado} aria-label={rotulo} title={rotulo}
      className={`flex-1 inline-flex items-center justify-center h-10 rounded-medio border
        transition-colors duration-200
        ${ligado
          ? 'border-moss bg-tinta-moss text-acento-texto'
          : morto
            ? 'border-linha text-ink-mute cursor-default'
            : 'border-contorno text-ink-soft hover:border-moss-3 hover:text-ink'}`}
    >
      <span className="w-5 h-5 inline-flex">{GLIFOS[valor]}</span>
    </button>
  )
}

/* ------------------------------------------------------------------
   A SETA DA ORDEM

   Eram dois campos: "Ordenar por" (o critério) e "Ordem" (crescente ou
   decrescente). Viraram um: o critério, e ao lado uma seta que vira de
   cabeça para baixo.

   E a seta diz MAIS que as palavras diziam. "Crescente" ao lado de "Nota" é
   ambíguo — nota maior primeiro, ou menor? Uma seta para cima encostada em
   "Nota" não tem essa dúvida.

   É a MESMA seta girando, não dois ícones trocando: o giro mostra a inversão
   acontecendo, que é justamente o que o botão faz.
   ------------------------------------------------------------------ */
function SetaOrdem({ dir, onClick }) {
  const asc = dir === 'asc'
  return (
    <button
      type="button" onClick={onClick}
      aria-label={asc ? 'Ordem crescente — inverter' : 'Ordem decrescente — inverter'}
      title={asc ? 'Crescente' : 'Decrescente'}
      className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full
        border border-contorno text-ink-soft hover:border-moss-3 hover:text-ink transition-colors duration-200"
    >
      <motion.svg
        className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
        animate={{ rotate: asc ? 0 : 180 }} transition={MOLA_TOQUE}
      >
        <path d="M12 19V5M6 11l6-6 6 6" />
      </motion.svg>
    </button>
  )
}

/* O rótulo que sobrou. Dos oito, restam dois — e os dois existem porque
   nomeiam um GRUPO de controles, não um controle só: sem eles, a grade de
   quatro caixas e a linha da ordenação ficariam soltas no meio do painel. */
const GRUPO = 'font-rotulo text-rotulo uppercase text-ink-faint'

export default function FiltersDrawer({ open, onClose }) {
  const { obras, filters, sort, total, setFilter, setSort, resetFilters } = useStore()
  const reduzido = usaMovimentoReduzido()
  // o arrasto sai só do cabeçalho: a lista de filtros precisa continuar rolando
  const arrasto = useDragControls()

  /* Filtros em cascata.
   *
   * As opções de um campo saem das obras que passam por TODOS OS OUTROS
   * filtros — nunca por ele mesmo. Se o próprio campo entrasse na conta,
   * escolher "Panini" deixaria a lista de editoras só com "Panini", e não
   * daria para trocar de ideia sem limpar tudo.
   *
   * Com "Tenho" ligado, a lista de editoras mostra só as editoras de obras
   * que você tem. Com "Quero", só as das que faltam. */
  const sobraSem = (campo) => obras.filter(o => passes(o, { ...filters, [campo]: NEUTRO[campo] }))

  // "Argentina / Espanha" entra como dois paises, nao como um rotulo so
  const autores = useMemo(() => comOsEscolhidos(ordenar(new Set(sobraSem('autor').flatMap(authorsOf))), filters.autor), [obras, filters])
  // a lista de editoras vem das OBRAS, não do catálogo fixo: filtrar por uma
  // editora de que não se tem nada só serviria para esvaziar a estante
  const eds = useMemo(() => comOsEscolhidos(ordenar(new Set(sobraSem('editora').map(edOf).filter(Boolean))), filters.editora), [obras, filters])
  const tiposVazios = useMemo(() => {
    const sobra = sobraSem('tipo')
    return TIPOS.map(([v]) => v).filter(v => !sobra.some(o => tipoOf(o) === v))
  }, [obras, filters])
  const edicoes = useMemo(() => {
    const sobra = sobraSem('tipoEdicao')
    const marcadas = comoLista(filters.tipoEdicao)
    const tem = TIPOS_EDICAO.filter(([v]) => marcadas.includes(v) || sobra.some(o => (o.tipoEdicao || '') === v))
    return tem
  }, [obras, filters])


  /* Clicar no que já está ligado desliga. É o que transforma dois chips em
     três estados (nenhum, um, o outro) sem um terceiro botão escrito
     "Todos". */
  const alternar = (campo, valor) => setFilter(campo, filters[campo] === valor ? NEUTRO[campo] : valor)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 veu-canelado" initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE} onClick={onClose} />
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
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto">Filtros</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-5 flex flex-col gap-6 content-start">

              {/* ---- AFUNILAR ----
                   Primeiro, e de propósito: é o corte que mais reduz a
                   estante. Quem abre este painel quase sempre quer chegar a
                   uma obra — e chega por autor ou editora, não por "tenho".
                   As condições, abaixo, refinam o que o afunilamento deixou.

                   Tipo, edição, editora e autor descrevem a OBRA —
                   existiriam igual se ela não fosse sua. Por isso entraram
                   todos no mesmo grupo, sob um rótulo só.

                   Os glifos vêm antes das caixas porque são o corte mais
                   grosso: três opções exclusivas contra listas de dezenas. */}
              <div className="flex flex-col gap-2">
                <span className={GRUPO}>Afunilar</span>

                <div className="flex gap-2">
                  {TIPOS.map(([v, rot]) => (
                    <BotaoTipo
                      key={v} valor={v} rotulo={rot}
                      ligado={filters.tipo === v}
                      morto={tiposVazios.includes(v) && filters.tipo !== v}
                      onClick={() => alternar('tipo', v)}
                    />
                  ))}
                </div>

                {/* A ORDEM é autor, editora, edição, nota — a da pergunta que
                    se faz primeiro, não a da estrutura do dado. Quem procura
                    uma obra na estante lembra de quem a fez antes de lembrar
                    em que formato ela saiu.

                    A NOTA FECHA A FILA, e não é por ser menos usada: é a única
                    das quatro que fala de VOCÊ, não da obra. Autor, editora e
                    edição existiriam igual se a obra não fosse sua; a nota só
                    existe porque é. Pela régua deste painel ela pertenceria às
                    Condições — mas as condições são sim-ou-não, e a nota é uma
                    lista de valores. Ficou onde a FORMA do controle manda,
                    encostada na fronteira, e não onde a natureza mandaria. */}
                <div className="grid grid-cols-2 gap-2">
                  <Selecao multi value={filters.autor} onChange={v => setFilter('autor', v)}
                    changed={temAlgo(filters.autor)} options={comoOpcoes(autores)} placeholder="Autor" />
                  <Selecao multi value={filters.editora} onChange={v => setFilter('editora', v)}
                    changed={temAlgo(filters.editora)} options={comoOpcoes(eds)} placeholder="Editora" />
                  <Selecao multi value={filters.tipoEdicao} onChange={v => setFilter('tipoEdicao', v)}
                    changed={temAlgo(filters.tipoEdicao)} options={edicoes} placeholder="Edição" />
                  <FiltroNota valor={filters.nota} onChange={v => setFilter('nota', v)} />
                </div>
              </div>

              {/* ---- CONDIÇÕES ----
                   O que depende de VOCÊ, não da obra: se é sua, se já leu, se
                   é urgente, se veio de fora. A mesma obra muda de condição
                   conforme a estante de quem olha — daí o nome.

                   DUAS FORMAS, porque são duas naturezas. Os dois primeiros
                   são PARES: respostas que se excluem à mesma pergunta, e por
                   isso viraram um controle só com a barra do "tanto faz" no
                   meio. Os dois últimos são interruptores independentes — uma
                   obra pode ser urgente E importada —, e ficam soltos.

                   Cada par ocupa a largura inteira; os interruptores dividem
                   em dois. As três fileiras começam e terminam na mesma
                   régua. */}
              <div className="flex flex-col gap-2">
                <span className={GRUPO}>Condições</span>

                <ParLigado
                  rotuloGrupo="Tenho ou quero"
                  valor={filters.status}
                  neutro={NEUTRO.status}
                  onChange={v => setFilter('status', v)}
                  opcoes={[
                    { v: 'biblioteca', rotulo: 'Tenho' },
                    { v: 'wishlist', rotulo: 'Quero' },
                  ]}
                />

                <ParLigado
                  rotuloGrupo="Lidos ou não lidos"
                  valor={filters.leitura}
                  neutro={NEUTRO.leitura}
                  onChange={v => setFilter('leitura', v)}
                  opcoes={[
                    { v: 'lido', rotulo: 'Lidos', icone: <IconVisto /> },
                    { v: 'naolido', rotulo: 'Não lidos', icone: <IconAberto /> },
                  ]}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Chip ligado={filters.urgencia} onClick={() => setFilter('urgencia', !filters.urgencia)}>
                    <IconUrgente /> Urgentes
                  </Chip>
                  <Chip ligado={filters.importado} onClick={() => setFilter('importado', !filters.importado)}>
                    <IconImportado /> Importados
                  </Chip>
                </div>
              </div>

              {/* ---- ORDENAR ----
                   Por último porque não recorta nada: só decide a ordem do
                   que sobrou dos dois grupos acima. */}
              <div className="flex flex-col gap-2">
                <span className={GRUPO}>Ordenar</span>
                <div className="flex items-center gap-2">
                  <Selecao className="flex-1 min-w-0" value={sort.by} onChange={v => setSort({ ...sort, by: v })}
                    options={[['nome', 'Título'], ['editora', 'Editora'], ['autor', 'Autor'], ['nota', 'Nota'],
                              ['valor', 'Valor'], ['volumes', 'Qtd. volumes'], ['recent', 'Recentes']]} />
                  <SetaOrdem dir={sort.dir} onClick={() => setSort({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 py-3.5 border-t border-separador">
              <button className="neo-btn neo-btn-rust mr-auto" onClick={resetFilters}>Limpar filtros</button>
              {/* O botão CONTA. "Ver resultados" é uma palavra genérica no
                  lugar onde cabia a única informação que importa antes de
                  fechar o painel: sobrou alguma coisa? */}
              <button className="neo-btn neo-btn-moss" onClick={onClose}>
                {total === 0 ? 'Nada encontrado' : total === 1 ? 'Ver 1 obra' : `Ver ${total} obras`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* Lido e não lido: o mesmo círculo, com e sem o visto dentro. A diferença
   entre os dois estados é o visto — desenhar dois símbolos sem relação faria
   procurar a diferença em vez de vê-la. */
const IconVisto = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.7 2.7L16 9.6" />
  </svg>
)
const IconAberto = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="12" r="9" />
  </svg>
)

/* O importado é o mesmo globo do selo azul dos cartões, e o urgente é o mesmo
   triângulo rust. Símbolo repetido entre o filtro e a obra filtrada é o que
   permite ligar um ao outro sem legenda. */
const IconImportado = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.2 9.6h17.6M3.2 14.4h17.6" strokeLinecap="round" />
    <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
  </svg>
)
const IconUrgente = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.2 21 19.4H3L12 4.2Z" />
    <path d="M12 10v3.6M12 16.4h.01" />
  </svg>
)
