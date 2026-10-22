import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { MOLA_GAVETA, FADE, MOLA_TOQUE } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { useFicha } from '../lib/ficha.js'
import { lerMensagem, classificar, movimentoDaEntrada, MOVIMENTOS } from '../lib/diario.js'

/* A FICHA DE ATIVIDADES.
 *
 * Substitui o painel de Atividades. Mesma função — mostrar o que aconteceu com
 * a coleção — e a mesma fonte: os commits que a própria sincronização cria no
 * repositório. O app não guarda histórico nenhum; a verdade continua no
 * GitHub, e aqui só se desenha.
 *
 * ---- POR QUE TROCAR UMA LINHA DO TEMPO POR UMA FICHA ----
 *
 * A linha do tempo anterior era uma COLUNA de eventos com bolinha e fio: um
 * formato que serve para contar uma história, em que o que importa é a ordem e
 * a passagem do tempo. Mas ninguém lê um histórico de coleção como história.
 * Lê-se procurando: "quando foi que entrou isso?", "o que eu mexi semana
 * passada?", "subi aquelas capas ou não?".
 *
 * Procurar precisa de COLUNA FIXA, não de fluxo. A ficha de empréstimo que
 * mora na contracapa de livro de biblioteca já é exatamente isso: uma coluna
 * de datas carimbadas à esquerda e o movimento à direita, uma linha por vez.
 * O olho desce pela coluna da data e só entra na linha quando a data interessa
 * — o que a bolinha e o fio não deixavam fazer, porque ali a data vinha DEPOIS
 * do texto, em letra miúda.
 *
 * E o app se chama Gibiteca. A ficha é o objeto que uma biblioteca tem.
 *
 * ---- A ORGANIZAÇÃO VEM DO TIPO, QUE PRECISOU SER RECONSTRUÍDO ----
 *
 * O `diario.js` sabe a natureza de cada mudança quando escreve a frase, mas o
 * commit só leva o texto — a mensagem tem de ser legível no GitHub. Então o
 * tipo é reconstruído na leitura (`classificar`), o que tem a vantagem de
 * valer para o histórico que JÁ EXISTE no repositório de quem usa o app.
 *
 * É esse tipo que permite as duas coisas que a tela antiga não tinha: a
 * etiqueta em cada linha e o filtro por movimento.
 */

const DIA = 86400000

/* Quantos detalhes uma linha abre sozinha sob filtro. Uma dúzia é o que cabe
   na tela sem empurrar a linha seguinte para fora — acima disso, abrir deixa
   de ser conveniência e vira perda de contexto. */
const LIMITE_AUTO = 12
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const ROTULO = Object.fromEntries(MOVIMENTOS.map(m => [m.v, m.rotulo]))

function periodoDe(data, agora) {
  const d = new Date(data)
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0)
  const q = d.getTime()
  if (q >= hoje.getTime()) return 'Hoje'
  if (q >= hoje.getTime() - DIA) return 'Ontem'
  if (q >= hoje.getTime() - 7 * DIA) return 'Últimos 7 dias'
  if (d.getFullYear() === new Date(agora).getFullYear()) return 'Este ano'
  return String(d.getFullYear())
}

/* A data em duas linhas, do jeito que uma ficha carimbada traz: o dia em cima,
   a hora embaixo. Montada à mão e não com `toLocaleDateString`, que em pt-BR
   devolve "19 de out." — três palavras numa coluna de 88px. */
const diaDe  = (q) => { const d = new Date(q); return String(d.getDate()).padStart(2, '0') + ' ' + MESES[d.getMonth()] }
const horaDe = (q) => new Date(q).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/* A etiqueta do movimento. Todas na MESMA tinta, de propósito: oito cores
   fariam a ficha parecer um gráfico, e a organização aqui vem da coluna e do
   filtro, não de um código de cores que ninguém decora. */
function Etiqueta({ v }) {
  if (!v) return null
  return (
    <span className="shrink-0 rounded-pequeno border border-ink/20 px-1.5 py-px
                     font-rotulo text-rotulo uppercase font-bold text-acento-texto">
      {ROTULO[v] || v}
    </span>
  )
}

/* UMA LINHA DA FICHA.
 *
 * O detalhe nasce FECHADO. Aberto por padrão, um envio de 110 capas jogava 110
 * linhas na tela e enterrava o resto do histórico — a ficha deixava de servir
 * para o que existe, que é olhar de relance. O assunto já responde ("Subiu 110
 * capas para a nuvem"); a lista é para quem for conferir.
 *
 * `carimbada` é só a entrada mais recente. Uma ficha de biblioteca tem muitos
 * carimbos, mas aqui ele não registra o movimento (a linha já faz isso): ele
 * diz ONDE VOCÊ ESTÁ. Dois carimbos e ele deixaria de dizer qualquer coisa.
 */
function Linha({ item, carimbada, filtro }) {
  const { assunto, itens } = lerMensagem(item.mensagem)
  const [aberto, setAberto] = useState(false)

  /* Sob filtro, a linha mostra só os detalhes daquele movimento — e abre
     sozinha, porque filtrar para depois ter de clicar em cada linha e ver o
     que casou seria pedir o trabalho duas vezes.

     MAS SÓ ATÉ UM PONTO. Filtrando por Capa, a leva de 110 abria inteira e
     empurrava as outras linhas de capa para fora da tela — o mesmo
     enterramento que o fechado-por-padrão existe para evitar, só que agora
     dentro do recorte que a pessoa pediu justamente para enxergar melhor.
     Passando de uma dúzia, a linha continua sendo um resumo com a contagem
     já filtrada, e abre no clique como qualquer outra. */
  const detalhes = filtro ? itens.filter(t => classificar(t) === filtro) : itens
  const temDetalhe = detalhes.length > 0
  const autoAbre = !!filtro && temDetalhe && detalhes.length <= LIMITE_AUTO
  const mostra = autoAbre || aberto
  const mov = filtro || movimentoDaEntrada(assunto, itens)

  const Corpo = (
    <>
      <span className="block text-corpo text-ink leading-snug break-words">{assunto}</span>
      <span className="mt-1.5 flex items-center gap-2 flex-wrap">
        <Etiqueta v={mov} />
        {temDetalhe && (
          <span className="font-rotulo text-rotulo uppercase text-ink-faint">
            {detalhes.length} {detalhes.length > 1 ? 'itens' : 'item'}
          </span>
        )}
      </span>
    </>
  )

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3 border-b border-ink/15 last:border-b-0">
      {/* ---- a coluna da data ---- */}
      <div className="shrink-0">
        {carimbada ? (
          /* O carimbo: moldura dupla em rust e torto, como carimbo de mão
             nunca sai reto. `rotate` e não `skew` — um carimbo gira, não
             entorta. */
          <span className="inline-flex flex-col items-center rounded-pequeno border-2 border-rust
                           px-1.5 py-1 text-rust -rotate-3 origin-left">
            <span className="font-mono text-apoio font-bold leading-none">{diaDe(item.quando)}</span>
            <span className="font-mono text-rotulo leading-none mt-1 opacity-80">{horaDe(item.quando)}</span>
          </span>
        ) : (
          <>
            <div className="font-mono text-apoio text-ink-soft leading-none">{diaDe(item.quando)}</div>
            <div className="font-mono text-rotulo text-ink-mute leading-none mt-1.5">{horaDe(item.quando)}</div>
          </>
        )}
      </div>

      {/* ---- a coluna do movimento ---- */}
      <div className="min-w-0">
        {temDetalhe && !autoAbre ? (
          <button
            type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto}
            className="w-full text-left flex items-start gap-2 group"
          >
            <span className="min-w-0 flex-1">{Corpo}</span>
            <motion.svg
              className="w-4 h-4 shrink-0 mt-0.5 text-ink-faint group-hover:text-ink transition-colors"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              animate={{ rotate: aberto ? 180 : 0 }} transition={MOLA_TOQUE}
            >
              <path d="M6 9l6 6 6-6" />
            </motion.svg>
          </button>
        ) : (
          <div>{Corpo}</div>
        )}

        <AnimatePresence initial={false}>
          {mostra && temDetalhe && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={MOLA_TOQUE}
              className="overflow-hidden"
            >
              <ul className="mt-2.5 flex flex-col gap-1.5 border-l border-ink/15 pl-3">
                {detalhes.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {/* Sob filtro a etiqueta seria a mesma em todas as linhas,
                        e etiqueta que não distingue nada é ruído. */}
                    {!filtro && <Etiqueta v={classificar(d)} />}
                    <span className="text-apoio text-ink-soft leading-snug break-words">{d}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* O aviso que ocupa a ficha quando não há linhas. Sempre na mesma caixa, para
   a tela não mudar de forma entre carregar, falhar e estar vazia. */
function Recado({ children }) {
  return <div className="px-5 py-10 text-center text-corpo text-ink-faint leading-relaxed">{children}</div>
}

export default function FichaAtividades({ open, onClose }) {
  const { cloud } = useStore()
  const { itens, carregando, erro } = useFicha(cloud, open)
  const [filtro, setFiltro] = useState(null)

  useEffect(() => {
    if (!open) return
    const noEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', noEsc)
    return () => document.removeEventListener('keydown', noEsc)
  }, [open, onClose])

  /* O filtro volta para "tudo" ao fechar: reabrir e achar a ficha recortada
     por uma escolha de três dias atrás é a tela mentindo sobre o que mostra. */
  useEffect(() => { if (!open) setFiltro(null) }, [open])

  /* QUANTAS LINHAS cada movimento tem. Conta ENTRADAS, não mudanças: o número
     do chip tem de bater com o que o clique vai mostrar, e o clique mostra
     linhas. "Capa 2" num histórico de 110 capas está certo — foram dois
     momentos em que se mexeu em capa. */
  const { comQuando, contagem } = useMemo(() => {
    const lista = itens.filter(i => i.quando)
    const conta = {}
    lista.forEach(i => {
      const { assunto, itens: det } = lerMensagem(i.mensagem)
      new Set((det.length ? det : [assunto]).map(classificar))
        .forEach(v => { conta[v] = (conta[v] || 0) + 1 })
    })
    return { comQuando: lista, contagem: conta }
  }, [itens])

  const visiveis = useMemo(() => {
    if (!filtro) return comQuando
    return comQuando.filter(i => {
      const { assunto, itens: det } = lerMensagem(i.mensagem)
      return (det.length ? det : [assunto]).some(t => classificar(t) === filtro)
    })
  }, [comQuando, filtro])

  const agora = Date.now()
  const periodos = []
  visiveis.forEach(it => {
    const p = periodoDe(it.quando, agora)
    const ultimo = periodos[periodos.length - 1]
    if (ultimo && ultimo.titulo === p) ultimo.itens.push(it)
    else periodos.push({ titulo: p, itens: [it] })
  })

  const maisRecente = visiveis.length ? visiveis[0].sha : null
  const pronto = cloud.connected && !carregando && !erro

  /* ---- O VÉU E O CARTÃO SÃO IRMÃOS, NÃO PAI E FILHO ----
   *
   * Em todo outro pop-up da casa o painel mora DENTRO do véu, e o clique fora
   * fecha por comparação de alvo. Aqui não dá: o cartão carrega um `layoutId`,
   * e elemento com `layoutId` dentro de um `AnimatePresence` TRAVA a saída.
   *
   * O que acontecia: ao fechar, o `AnimatePresence` segurava o véu esperando o
   * filho terminar; o filho tinha uma animação de layout pendente contra a
   * prévia, que acabara de remontar reivindicando o mesmo id; a animação nunca
   * resolvia e o véu ficava no DOM para sempre, invisível (`--veu-forca: 0`) e
   * por cima de tudo. Medido: o nó continuava lá 2,5s depois do clique em
   * fechar.
   *
   * Separados, cada um faz uma coisa só. O véu entra e sai por opacidade,
   * dentro do `AnimatePresence`. O cartão monta e desmonta seco, FORA dele —
   * e é o framer-motion que, vendo o mesmo `layoutId` nascer no outro canto da
   * tela, leva o retângulo de um lugar ao outro. Nos dois sentidos: abrindo,
   * quem nasce é o pop-up e ele vem da prévia; fechando, quem nasce é a prévia
   * e ela vem do pop-up.
   */
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[66] veu-canelado"
            initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {open && (
        <div className="fixed inset-0 z-[67] flex items-start sm:items-center justify-center
                        px-0 sm:px-3 py-0 sm:py-6 pointer-events-none">
          {/* ---- O MESMO CARTÃO, EM TAMANHO GRANDE ----

              O pop-up NÃO é uma tela com outro desenho: é a ficha do rodapé
              aumentada. Mesmo papel, mesmo cabeçalho em caixa alta com a régua
              dupla, mesma coluna de datas em mono, mesmas pautas finas, mesmo
              carimbo. Quem clica no cartão tem de reconhecer o que abriu — e a
              única maneira de reconhecer é ser a mesma coisa, só que cabendo
              mais.

              Daí `bg-paper` no lugar de `bg-surface` e sem canto arredondado:
              o cartão é uma folha, e folha não tem canto redondo.

              DUAS COISAS NÃO VIERAM JUNTO, e as duas por motivo:

                · A INCLINAÇÃO. O cartão do rodapé está torto porque está
                  largado sobre a faixa. Este está sendo lido, de frente; texto
                  longo torto é difícil de ler e o giro brigaria com a rolagem.
                · O RECORTE DO BOLSO. Ele é o vazio por onde o cartão sai do
                  bolso. Fora do bolso, não há o que recortar — e não há faixa
                  escura atrás para a meia-lua mostrar. */}
          <motion.div
            layoutId={ID_FICHA}
            transition={MOLA_GAVETA}
            /* No celular a folha ocupa a tela, como todos os painéis da casa —
               3:2 em 375px daria um cartão de 235px de altura, pequeno demais
               para ler. Da `sm` para cima vale a proporção. */
            className={`pointer-events-auto w-full h-full sm:h-auto sm:w-[min(94vw,840px,132vh)] ${PROPORCAO_SM}
                        flex flex-col bg-paper text-ink overflow-hidden
                        sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.6)]`}
          >
            {/* O CABEÇALHO DO CARTÃO, igual ao da prévia: o nome em rótulo
                caixa alta à esquerda, o contador à direita, e a régua GROSSA
                embaixo, que é o que toda ficha impressa tem separando o
                timbre do miolo. */}
            <div className="shrink-0 px-5 sm:px-6 pt-4 pb-2 flex items-baseline gap-3 border-b-2 border-ink/80">
              <h3 className="font-rotulo text-obra uppercase font-bold tracking-wider flex-1 min-w-0 truncate">
                Ficha de atividades
              </h3>
              {pronto && comQuando.length > 0 && (
                <span className="font-mono text-apoio text-ink-faint shrink-0">
                  {comQuando.length}{comQuando.length >= 40 ? '+' : ''} reg.
                </span>
              )}
              <button
                className="shrink-0 -mr-1.5 -mt-1 w-8 h-8 inline-flex items-center justify-center rounded-full
                           text-ink-faint hover:text-ink hover:bg-toque transition-colors"
                onClick={onClose} aria-label="Fechar"
              >×</button>
            </div>

            {/* A identificação do volume — aqui, o repositório. Responde "esses
                dados são de onde?" antes de alguém perguntar. */}
            {pronto && comQuando.length > 0 && (
              <div className="shrink-0 px-5 sm:px-6 py-2 border-b border-ink/15">
                <span className="font-mono text-rotulo text-ink-faint truncate block">{cloud.owner}/{cloud.repo}</span>
              </div>
            )}

            {/* ---- O FILTRO POR MOVIMENTO ----
                Os movimentos SEM NENHUMA linha ficam visíveis e apagados, não
                somem: sumindo, o número de alvos mudaria a cada recorte e a
                mão, que aprende posição antes de rótulo, erraria o botão. É a
                mesma regra da cascata do painel de filtros. */}
            {pronto && comQuando.length > 0 && (
              <div className="shrink-0 px-5 sm:px-6 py-3 border-b border-ink/15 flex flex-wrap gap-1.5">
                <ChipMov ativo={!filtro} onClick={() => setFiltro(null)} n={comQuando.length}>Tudo</ChipMov>
                {MOVIMENTOS.map(m => (
                  <ChipMov
                    key={m.v}
                    ativo={filtro === m.v}
                    vazio={!contagem[m.v]}
                    n={contagem[m.v] || 0}
                    onClick={() => setFiltro(filtro === m.v ? null : m.v)}
                  >
                    {m.rotulo}
                  </ChipMov>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-auto">
              {!cloud.connected && (
                <Recado>A ficha está limpa, nenhuma atividade foi realizada ainda.</Recado>
              )}
              {cloud.connected && carregando && <Recado>Buscando a ficha…</Recado>}
              {cloud.connected && !carregando && erro && (
                <div className="m-5 rounded-pequeno border border-ink/20 bg-toque px-4 py-3 text-corpo text-ink-soft">{erro}</div>
              )}
              {pronto && comQuando.length === 0 && <Recado>A ficha está limpa, nenhuma atividade foi realizada ainda.</Recado>}
              {pronto && comQuando.length > 0 && visiveis.length === 0 && (
                <Recado>Nenhuma atividade de <b className="text-ink-soft">{ROTULO[filtro]}</b> nesta ficha.</Recado>
              )}

              {periodos.map(p => (
                <section key={p.titulo}>
                  {/* A QUEBRA DE PERÍODO mora na COLUNA DA DATA, não flutuando
                      por cima da lista: assim a coluna continua sendo uma
                      coluna de tempo de cima a baixo, e o olho que desce por
                      ela não precisa sair do lugar para saber onde está. */}
                  {/* `minmax(88px,auto)` e não `88px` cravado: "Últimos 7 dias"
                      não cabe na largura da coluna de datas e quebrava em duas
                      linhas. Assim o rótulo curto alinha com a coluna e o
                      comprido empurra a régua, que é quem tem folga de sobra. */}
                  <div className="grid grid-cols-[minmax(88px,auto)_minmax(0,1fr)] gap-3 px-5 sm:px-6 pt-4 pb-1.5 items-center">
                    <span className="font-rotulo text-rotulo uppercase font-bold text-ink-faint whitespace-nowrap">{p.titulo}</span>
                    <span className="h-px bg-ink/15" />
                  </div>
                  <div className="px-5 sm:px-6">
                    {p.itens.map(it => (
                      <Linha key={it.sha} item={it} carimbada={it.sha === maisRecente} filtro={filtro} />
                    ))}
                  </div>
                </section>
              ))}
              <div className="h-4" />
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

/* O chip do filtro. `aria-pressed`, não `aria-checked`: cada um liga e desliga
   por conta própria — não escolher nenhum não é uma opção, é a ausência de
   uma. Mesmo princípio do painel de filtros da coleção.

   TINTA, NÃO ACENTO, no escolhido. O cartão só usa duas cores: a tinta da
   escrita e o rust do carimbo. Um chip verde aqui seria a única coisa da ficha
   que não saiu da caneta nem do carimbo. Preenchido em tinta ele lê como
   escolhido pela mesma razão que o carimbo lê como carimbo: é o contraste, não
   a cor.

   Canto quadrado, como todo o resto do cartão. */
function ChipMov({ ativo, vazio, n, onClick, children }) {
  return (
    <button
      type="button" onClick={vazio ? undefined : onClick}
      aria-pressed={ativo} disabled={vazio}
      className={`inline-flex items-center gap-1.5 rounded-pequeno border px-2 h-7
        font-rotulo text-rotulo uppercase font-bold transition-colors
        ${ativo ? 'bg-ink text-paper border-ink'
          : vazio ? 'border-ink/10 text-ink-mute cursor-default'
          : 'border-ink/25 text-ink-soft hover:bg-toque'}`}
    >
      {children}
      <span className={ativo ? 'opacity-60' : 'text-ink-faint'}>{n}</span>
    </button>
  )
}

/* ------------------------------------------------------------------
   A PRÉVIA, no rodapé.

   A ficha saiu do ☰ e passou a morar aqui, aberta. É a diferença entre um
   histórico que existe e um histórico que se vê: no menu, ninguém abre
   "Atividades" sem já estar procurando alguma coisa — e quem não sabe que o
   app registra o que você faz nunca vai procurar.

   No rodapé ela não pede clique nenhum para informar. As últimas linhas estão
   escritas; o clique é só para ver o resto.

   ---- POR QUE É UM CARTÃO CLARO SOBRE A FAIXA ESCURA ----

   Porque é um objeto, não uma seção. A ficha de empréstimo é uma coisa colada
   na contracapa — tem papel próprio, borda própria e está um pouco torta. Uma
   lista desenhada direto sobre o #212121 seria mais uma parte do rodapé; o
   cartão é algo que foi POSTO ali.

   ---- A TINTA VOLTA AO NORMAL AQUI DENTRO ----

   O rodapé inverte `--tinta` para papel, e dentro dele `text-ink` é claro e
   `border-linha` é um fio claro. Num cartão de papel, os dois sumiriam. A
   classe `.tinta-normal` devolve a rampa ao escuro para esta ilha — é o mesmo
   mecanismo da inversão, usado ao contrário.
   ------------------------------------------------------------------ */

const LINHAS_NA_PREVIA = 5

/* ------------------------------------------------------------------
   A PROPORÇÃO, E O OBJETO ÚNICO.

   ---- 3:2 NOS DOIS TAMANHOS ----

   A prévia e o pop-up têm a MESMA proporção. Antes a prévia era um cartão
   largo e baixo e o pop-up um painel alto; mesmo com o mesmo desenho por
   dentro, eram duas folhas de formatos diferentes, e duas folhas de formatos
   diferentes nunca são a mesma folha.

   O número saiu da própria prévia: 380 de largura com cabeçalho, cinco linhas
   e o rodapezinho dão 253 de altura — 3:2 com três pixels de erro. Foi só
   cravar o que já estava lá e mandar o pop-up obedecer.

   NO POP-UP A LARGURA TEM TRÊS TETOS: `94vw` para não encostar nas bordas,
   `840px` para não virar uma folha gigante numa tela larga, e `132vh` — que é
   `88vh × 1,5`. O terceiro existe porque limitar a ALTURA por `max-h` quebraria
   a proporção em janela baixa: o cartão ficaria achatado justamente onde a
   semelhança importa. Limitando a largura, a razão se mantém sempre.

   ---- A TRANSIÇÃO ----

   Um `layoutId` só. Quando o pop-up abre, a prévia DESMONTA e o framer-motion
   leva o mesmo retângulo de lá para cá, crescendo. Não são dois cartões — é um
   cartão que mudou de lugar e de tamanho, que é a única forma de a tela contar
   que são a mesma ficha.

   É por isso que a prévia precisa saber que o pop-up está aberto: as duas
   visíveis ao mesmo tempo denunciam que são dois objetos. O espaço dela fica
   reservado (o quadro de fora mantém a proporção), então o rodapé não pula
   quando ela sai.

   A INCLINAÇÃO MORA NO QUADRO DE FORA, não no cartão animado: transform
   próprio num elemento com `layoutId` briga com o transform que o framer-motion
   usa para animar. Assim o giro é do bolso, e a folha que viaja está sempre
   reta.
   ------------------------------------------------------------------ */
/* As duas escritas por extenso, e não montadas com `sm:${…}`: o Tailwind varre
   o CÓDIGO-FONTE atrás de nomes de classe inteiros e não resolve template
   literal nenhum. Interpolado, o `sm:aspect-[3/2]` simplesmente não seria
   gerado, e o pop-up sairia sem proporção no desktop. */
const PROPORCAO = 'aspect-[3/2]'
const PROPORCAO_SM = 'sm:aspect-[3/2]'
const ID_FICHA = 'ficha-de-atividades'

/* BUSCA NA MONTAGEM, e não quando o rodapé entra na tela.
 *
 * A primeira versão esperava um `IntersectionObserver` para economizar uma
 * chamada à API nas visitas que nunca descem até aqui. Saiu por dois motivos,
 * e o segundo é o que decide:
 *
 *   1. uma chamada autenticada ao GitHub, assíncrona, contra um limite de
 *      5000 por hora, não é uma economia que pague o risco;
 *   2. ENQUANTO O OBSERVADOR NÃO DISPARA não há como distinguir "ainda não li"
 *      de "não há nada", e o cartão afirmava "Ficha nova, nenhum movimento
 *      ainda" para quem tem histórico. Um observador que não dispare — aba em
 *      segundo plano, página não pintada — deixa essa mentira na tela para
 *      sempre.
 *
 * O cache de módulo (`useFicha`) é quem evita a busca repetida de verdade.
 */
export function FichaPrevia({ onAbrir, aberta }) {
  const { cloud } = useStore()
  const { itens, carregando, erro } = useFicha(cloud, cloud.connected)

  const linhas = itens.filter(i => i.quando).slice(0, LINHAS_NA_PREVIA)

  const recado =
    carregando       ? 'Buscando a ficha…'
    : erro           ? 'Não deu para ler a ficha agora.'
    : !linhas.length ? 'Sua ficha está limpa. Por enquanto.'
    : null

  /* O quadro de fora guarda o lugar e carrega a inclinação; o cartão por
     dentro é o que viaja para o pop-up. Com a prévia fora, o espaço continua
     ocupado e o rodapé não pula. */
  return (
    <div className={`w-[380px] max-w-full ${PROPORCAO} relative -rotate-[.7deg]`}>
      {/* SEM `AnimatePresence` aqui, de propósito.
          Embrulhada nele, a prévia ficava montada esperando uma animação de
          saída que não existe — e as duas fichas apareciam juntas na tela, que
          é exatamente o que esta transição existe para evitar. Com `layoutId`
          o desmonte tem de ser seco: o pop-up registra o mesmo id, lê a última
          posição conhecida da prévia e cresce de lá. */}
      {!aberta && (
        <motion.div
          layoutId={ID_FICHA}
          transition={MOLA_GAVETA}
          className="group absolute inset-0 flex flex-col tinta-normal bg-paper text-ink px-4 pt-3 pb-7
                     shadow-[0_24px_50px_-24px_rgba(0,0,0,.8)]">

        {/* O cabeçalho do cartão, com a régua dupla que toda ficha impressa
            tem: uma linha grossa separando o título do miolo. */}
        <div className="flex items-baseline justify-between gap-3 pb-1.5 border-b-2 border-ink/80">
          <span className="font-rotulo text-rotulo uppercase font-bold tracking-wider">Ficha de atividades</span>
          {linhas.length > 0 && (
            <span className="font-mono text-rotulo text-ink-faint shrink-0">
              {itens.length}{itens.length >= 40 ? '+' : ''} reg.
            </span>
          )}
        </div>

        {recado ? (
          <p className="flex-1 flex items-center text-apoio text-ink-faint leading-relaxed">{recado}</p>
        ) : (
          <ul className="flex-1 min-h-0 overflow-hidden">
            {linhas.map((it, i) => {
              const { assunto } = lerMensagem(it.mensagem)
              return (
                <li key={it.sha} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2.5 items-center
                                            py-2 border-b border-ink/15 last:border-b-0">
                  {i === 0 ? (
                    <span className="inline-flex justify-center rounded-pequeno border-2 border-rust
                                     px-1 py-0.5 text-rust -rotate-3 origin-left
                                     font-mono text-rotulo font-bold leading-none">
                      {diaDe(it.quando)}
                    </span>
                  ) : (
                    <span className="font-mono text-rotulo text-ink-faint leading-none">{diaDe(it.quando)}</span>
                  )}
                  <span className="text-apoio text-ink-soft leading-snug truncate">{assunto}</span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="shrink-0 pt-2.5 border-t border-dashed border-ink/20 flex items-center justify-end gap-1.5
                        font-rotulo text-rotulo uppercase font-bold text-acento-texto">
          Ver a ficha completa
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </div>

        {/* O RECORTE DO BOLSO, a meia-lua por onde o cartão é puxado.
            `var(--ink)` e não `bg-ink`: depois da inversão do rodapé, o token
            `ink` do Tailwind é PAPEL ali dentro. O recorte precisa da cor da
            faixa, que é a variável crua.

            Vai DENTRO do cartão que viaja, e não no quadro de fora: ele é
            recorte DESTA folha, e tem de sair de cena junto com ela — um bolso
            sem cartão dentro é um buraco no rodapé. */}
        <span aria-hidden="true"
              className="absolute left-1/2 -translate-x-1/2 -bottom-px w-[72px] h-4 rounded-t-full"
              style={{ background: 'var(--ink)' }} />

        {/* O ALVO cobre o cartão inteiro, em vez de o cartão ser um <button>.
            Um botão embrulhando a lista daria a ele um nome acessível feito da
            emenda de cinco frases de histórico — ilegível para quem ouve. Assim
            o nome é uma frase só, e o alvo continua sendo o cartão todo. */}
        <button
          type="button" onClick={onAbrir}
          aria-label="Abrir a ficha de atividades completa"
          className="absolute inset-0 w-full h-full
                     outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                     focus-visible:ring-offset-[#212121] focus-visible:ring-paper"
        />
        </motion.div>
      )}
    </div>
  )
}
