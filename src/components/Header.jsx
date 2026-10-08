import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_TOQUE, MOLA_GAVETA, useEhDesktop } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import Marca from './Marca.jsx'
import MarcaAlt from './MarcaAlt.jsx'
import { baixarBackup } from '../lib/backup.js'

/* O logo é o botão de "começar de novo": limpa os filtros (inclusive a busca)
 * e sobe para o topo. É o que se espera da marca em qualquer site — e aqui
 * resolve um beco sem saída real: com filtro apertado a estante fica vazia, e
 * o caminho de volta ficava escondido dentro da gaveta de Filtros.
 */
function useVoltarAoInicio() {
  const { resetFilters, setView } = useStore()
  return () => {
    resetFilters()
    // recomeçar é voltar à estante: se estava no modo lista, volta pra galeria
    setView('galeria')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const ROTULO_LOGO = 'Início — limpar filtros e voltar ao topo'

// [valor, rótulo, amostra] — a amostra é o hex de cada tema, não um token
const TEMAS = [['moss', 'Moss', '#4B5D3A'], ['nockout', 'Nockout', '#FF5000']]

/* Passou do topo?
 *
 * 24px, não 1px: com a cortina levando 0.9s, disparar no primeiro pixel faria
 * um tremidinho de dedo abrir e fechar o acento inteiro. O limite dá folga para
 * o ajuste de rolagem que o navegador faz sozinho. */
const LIMITE_ROLAGEM = 24
function useRolado() {
  const [rolado, setRolado] = useState(() => typeof window !== 'undefined' && window.scrollY > LIMITE_ROLAGEM)
  useEffect(() => {
    const ver = () => setRolado(window.scrollY > LIMITE_ROLAGEM)
    ver()                                   // a página pode abrir já rolada
    window.addEventListener('scroll', ver, { passive: true })
    return () => window.removeEventListener('scroll', ver)
  }, [])
  return rolado
}

/* Barra única do topo.
 *
 *   desktop:  Busca · Filtros · Estatísticas · LOGO · Galeria/Lista · ☰
 *   celular:  Busca · LOGO · ☰          (primeira linha)
 *             Filtros ········ Galeria/Lista   (segunda linha)
 *
 * No celular o logo passou para DENTRO da barra. Antes ele era um bloco solto
 * acima, que rolava embora; agora a marca acompanha a rolagem como em qualquer
 * site, e o que desceu para a segunda linha foi o que é ferramenta, não marca.
 *
 * A segunda linha fica FORA da barra fixa: ela rola embora com a página. Só a
 * marca, a busca e o ☰ acompanham a rolagem — o que é ferramenta da estante
 * fica com a estante.
 *
 * É uma BARRA de ponta a ponta. No topo da página ela é papel translúcido com
 * desfoque; quando se enche, um painel do acento sobe por dentro dela e a
 * tinta inverte. Ela se enche por DOIS motivos — a página rolou, ou o menu
 * está aberto —, e é isso que `comAcento` resolve. A mecânica está em
 * `.barra-topo`, no index.css; aqui só se liga o `data-acento`.
 */
export default function Header({ onCloud, onBulk, onAtividades, onFilters, onStats, onSearch, filterCount, aberturaNoAr = false }) {
  const { obras, editoras, loadBackup, sync, view, setView, filters, tema, setTema } = useStore()
  const aoInicio = useVoltarAoInicio()
  const rolado = useRolado()
  const ehDesktop = useEhDesktop()
  const fileRef = useRef(null)
  const barraRef = useRef(null)
  const [menu, setMenu] = useState(false)
  const [alturaBarra, setAlturaBarra] = useState(0)

  /* A barra se enche de acento por DOIS motivos: a página rolou, ou o menu
     está aberto. Com o menu aberto no topo da página ela ficava translúcida,
     e o painel branco colado numa barra quase branca não tinha onde terminar.
     Tudo que muda de cor junto com a cortina olha para isto, não para
     `rolado` — senão o fundo vira acento e os botões ficam na tinta escura. */
  const comAcento = rolado || menu

  /* O painel de tela cheia começa EMBAIXO da barra, então precisa saber a
     altura dela — que muda entre celular (duas linhas) e desktop (uma). */
  useLayoutEffect(() => {
    if (!menu || !barraRef.current) return
    const medir = () => setAlturaBarra(Math.round(barraRef.current.getBoundingClientRect().height))
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const noEsc = (e) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('keydown', noEsc)
    return () => document.removeEventListener('keydown', noEsc)
  }, [menu])

  /* Menu aberto em tela cheia trava a rolagem do fundo: sem isso o dedo
     arrasta a estante atrás do painel. */
  useEffect(() => {
    if (!menu || ehDesktop) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [menu, ehDesktop])

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { loadBackup(JSON.parse(r.result)) } catch (_) { alert('Arquivo inválido.') } }
    r.readAsText(f); e.target.value = ''
  }

  const fechar = () => setMenu(false)
  const acoesDados = [
    { rotulo: rotuloNuvem(sync), icone: <IconCloud />, ponto: sync, aoClicar: () => { fechar(); onCloud?.() } },
    { rotulo: 'Atividades', icone: <IconRelogio />, aoClicar: () => { fechar(); onAtividades?.() } },
    { rotulo: 'Enviar capas', icone: <IconImage />, aoClicar: () => { fechar(); onBulk?.() } },
    { rotulo: 'Baixar backup (.json)', icone: <IconBaixar />, aoClicar: () => { baixarBackup(obras, editoras); fechar() } },
    { rotulo: 'Restaurar backup (.json)', icone: <IconRestaurar />, aoClicar: () => { fechar(); fileRef.current?.click() } },
  ]

  const botaoFiltros = (comRotulo) => (
    <button className="pill-btn !px-3 md:!px-4" onClick={onFilters} title="Filtros">
      <IconFiltros />
      <span className={comRotulo ? "" : "hidden md:inline"}>Filtros</span>
      {filterCount
        ? <span className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-rotulo font-bold transition-colors duration-[450ms]
            ${comAcento ? 'bg-paper text-acento-texto' : 'bg-moss text-sobre-acento'}`}>{filterCount}</span>
        : null}
    </button>
  )

  /* O alternador existe UMA vez só no DOM. Ele carrega um `layoutId`, e dois
     elementos com o mesmo id ao mesmo tempo quebram a animação da pastilha —
     por isso a posição é escolhida em JS, não duplicada e escondida por CSS. */
  const alternadorVista = (
    <div className={`relative inline-flex rounded-full border p-1 transition-colors duration-[450ms] ${comAcento ? 'border-paper/35' : 'border-separador'}`}>
      {[['galeria', 'Galeria'], ['lista', 'Lista']].map(([v, l]) => (
        <button key={v} onClick={() => setView(v)} aria-label={l} aria-pressed={view === v}
          className={`relative inline-flex items-center justify-center gap-1.5 rounded-full min-w-[44px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-3 sm:px-4 py-1.5 text-corpo font-semibold transition-colors duration-[450ms]
            ${view === v
              ? (comAcento ? 'text-acento-texto' : 'text-paper')
              : (comAcento ? 'text-paper/70 hover:text-paper' : 'text-ink-soft hover:text-ink')}`}>
          {view === v && (
            <motion.span
              layoutId="viewToggleActive"
              /* sobre o acento a pastilha escura sumiria: ela inverte junto */
              className={`absolute inset-0 rounded-full transition-colors duration-[450ms] ${comAcento ? 'bg-paper' : 'bg-ink'}`}
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative inline-flex items-center gap-1.5">
            {v === 'galeria' ? <IconGrade /> : <IconLista />}
            <span className="hidden sm:inline">{l}</span>
          </span>
        </button>
      ))}
    </div>
  )

  const conteudoMenu = (
    <ConteudoMenu
      grande={!ehDesktop}
      tema={tema} setTema={setTema}
      sync={sync} acoes={acoesDados}
      onStats={() => { fechar(); onStats?.() }}
    />
  )

  return (
    <>
    <header className="barra-topo" data-acento={comAcento ? '1' : '0'} ref={barraRef}>
      <div className="mx-auto w-full max-w-[1320px] px-3 sm:px-5">
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />

        {/* ---- primeira linha: a grade de três colunas põe o logo no centro
             exato, independente da largura dos dois lados ---- */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-2 sm:py-2.5">

          {/* esquerda */}
          <div className="flex items-center gap-1.5 justify-self-start">
            {/* Sem contorno, e por isso o MESMO `isl-icon` do ☰ do outro lado —
                não uma `pill-btn` com a borda apagada. Os dois são botões de
                ícone redondos nas pontas da barra; usar a mesma classe mantém
                tamanho, cor e o comportamento sobre o acento em um lugar só.
                O ponto de "há busca ativa" vai para fora do fluxo, como o
                SyncDot do ☰: sem contorno não há espaço interno para ele. */}
            <button className="isl-icon !w-10 !h-10 sm:!w-9 sm:!h-9 relative" onClick={onSearch} title="Buscar" aria-label="Buscar">
              <IconBusca />
              {filters.q ? <span className={`absolute right-1 bottom-1 w-[7px] h-[7px] rounded-full transition-colors duration-[450ms] ${comAcento ? 'bg-paper' : 'bg-moss'}`} /> : null}
            </button>
            {ehDesktop && botaoFiltros(false)}
          </div>

          {/* centro: a marca */}
          <div className="flex justify-center min-w-0">
            <button
              type="button"
              onClick={aoInicio}
              aria-label={ROTULO_LOGO}
              title={ROTULO_LOGO}
              /* inline-flex + items-center no BOTÃO: sem isso o <span> interno é
                 elemento de linha, apoia na linha de base, e o espaço reservado
                 para o descendente empurra o logo 3px acima dos ícones. */
              className="grupo-marca inline-flex items-center shrink-0 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px active:scale-[.97]"
            >
              {!aberturaNoAr && (
                <motion.span layoutId="marca" className="relative inline-flex pointer-events-none">
                  {/* Medida pela LARGURA, não pela altura: a largura é o que aperta
                      aqui — é ela que disputa espaço com as duas pontas da barra —, e
                      é nela que a marca foi especificada. Com o viewBox encostado na
                      arte, a altura sai da proporção (6,71:1) e dá 26 e 28px. */}
                  <Marca className="w-[175px] md:w-[190px] h-auto" />
                  <MarcaAlt />
                </motion.span>
              )}
            </button>
          </div>

          {/* direita */}
          <div className="flex items-center gap-1.5 justify-self-end shrink-0">
            {ehDesktop && alternadorVista}
            <div className="relative">
              <button
                type="button"
                className="isl-icon !w-10 !h-10 sm:!w-9 sm:!h-9 relative"
                onClick={() => setMenu(m => !m)}
                aria-label={menu ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menu}
                aria-haspopup="menu"
                title="Cor do site, estatísticas, nuvem e backup"
              >
                <Hamburguer aberto={menu} />
                {/* o aviso de sincronização acompanha o menu que guarda a Nuvem */}
                <SyncDot sync={sync} />
              </button>

              {/* ---- desktop: folha suspensa ---- */}
              <AnimatePresence>
                {menu && ehDesktop && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={MOLA_TOQUE}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 top-[calc(100%+10px)] z-40 w-[290px] rounded-medio border border-separador bg-surface p-2 shadow-amb-lg"
                  >
                    {conteudoMenu}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </header>

      {/* ---- segunda linha (só celular): o que é ferramenta ----
           Fica FORA da barra: rola embora com a página, como pediram. Só a
           marca e os dois acessos acompanham a rolagem.
           Como ela está no fluxo normal e o painel do menu é fixo começando
           embaixo da barra, o painel a cobre sozinho — não precisa sumir à
           mão, e assim a página não dá um pulo ao abrir o menu. */}
      {!ehDesktop && (
        <div className="mx-auto w-full max-w-[1320px] px-3 flex items-center justify-between gap-2 py-2">
          {botaoFiltros(true)}
          {alternadorVista}
        </div>
      )}

      {/* ---- celular: painel de tela cheia, começando embaixo da barra ----
           Fica FORA do <header> de propósito: como filho dele, ele pegava a
           regra `.barra-topo > *{ position: relative }` — a que mantém o
           conteúdo acima da cortina do acento — e com isso (a) perdia o
           `fixed`, caindo no fluxo, e (b) entrava na altura da própria barra,
           que é justamente o que serve de referência para o `top` dele. */}
      <AnimatePresence>
        {menu && !ehDesktop && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={MOLA_GAVETA}
            style={{ top: alturaBarra }}
            className="fixed left-0 right-0 bottom-0 z-40 bg-surface overflow-y-auto px-5 pb-8"
          >
            {conteudoMenu}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ---------------------------------------------------------------
   O conteúdo do menu, um só para os dois formatos.

   Três assuntos, nesta ordem: a cor do site, as estatísticas e UM tópico que
   guarda tudo que é dado — nuvem, capas e backup. Eram cinco itens soltos
   competindo com o resto; agora são cinco coisas da mesma família atrás de uma
   porta só.

   O menu é o MESMO nos dois tamanhos. Estatísticas chegou a viver na barra do
   desktop, e manter os dois caminhos daria duas portas para a mesma tela.

   `grande` muda só o tamanho dos alvos: no painel de tela cheia as linhas
   precisam de altura de dedo, na folha do desktop não.
   --------------------------------------------------------------- */
function ConteudoMenu({ grande, tema, setTema, sync, acoes, onStats }) {
  const [dadosAberto, setDadosAberto] = useState(false)
  /* No painel de tela cheia as linhas são GRANDES e SEM ícone: são três
     assuntos, não uma lista de comandos, e a essa altura o ícone vira enfeite
     ao lado de uma palavra que já se lê de longe. Na folha do desktop, que é
     compacta, o ícone continua ajudando a varrer. */
  const linha = grande
    ? 'w-full flex items-center gap-3 py-5 font-display text-titulo font-semibold text-ink text-left'
    : 'w-full flex items-center gap-2.5 rounded-medio px-3 py-2.5 text-corpo font-medium text-ink text-left hover:bg-toque'
  const risco = grande ? 'border-b border-linha' : ''
  /* A cor do site não é um item da lista: é um ajuste do app, e os dois de
     baixo são lugares aonde se vai. Com o mesmo fio das outras linhas ela
     virava só mais uma fatia. O token `separador` existe para isto — tem
     presença —, e o ar em volta é metade do recado: sem ele, um fio mais
     escuro continua lendo como divisor de linha. */
  const quebra = grande
    ? 'pt-1 pb-5 mb-3 border-b border-separador'
    : 'px-1 pb-2 mb-1 border-b border-linha'

  return (
    <div className="flex flex-col">
      {/* ---- cor do site ---- */}
      <div className={quebra}>
        <span className={`block font-mono text-rotulo uppercase text-ink-faint ${grande ? 'pb-2.5' : 'px-2 pb-1.5'}`}>Cor do site</span>
        <div className="flex gap-1">
          {TEMAS.map(([v, rotulo, cor]) => (
            <button
              key={v} role="menuitemradio" aria-checked={tema === v}
              onClick={() => setTema(v)}
              /* Sem contorno e sem bolinha: a palavra É a amostra. O que marca
                 o escolhido é a opacidade — o apagado recua, o marcado fica
                 cheio. Para leitor de tela quem conta é o aria-checked, que não
                 depende de cor nem de opacidade. */
              className={`flex-1 rounded-medio px-2 font-display font-extrabold uppercase
                transition-opacity duration-200 outline-none
                focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-ink/30
                ${grande ? 'py-2.5 text-secao' : 'py-1.5 text-obra'}
                ${tema === v ? 'opacity-100' : 'opacity-30 hover:opacity-65'}`}
              /* hex cravado de propósito: a palavra MOSTRA a cor de cada tema,
                 então não pode seguir o tema atual */
              style={{ color: cor }}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* ---- estatísticas ---- */}
      <button role="menuitem" onClick={onStats} className={`${linha} ${risco}`}>
        {!grande && <span className="text-ink-soft shrink-0 inline-flex"><IconStats /></span>}
        Estatísticas
      </button>

      {/* ---- um tópico só para tudo que é dado ---- */}
      <div className={risco}>
        <button
          role="menuitem"
          aria-expanded={dadosAberto}
          onClick={() => setDadosAberto(a => !a)}
          className={linha}
        >
          {!grande && (
            <span className="relative text-ink-soft shrink-0 inline-flex">
              <IconCloud />{sync && sync !== 'off' ? <SyncDot sync={sync} /> : null}
            </span>
          )}
          Nuvem e backup
          {/* sem o ícone, o aviso de sincronização precisa de um lugar próprio:
              a ação pode se esconder atrás de uma porta, o alerta não pode */}
          {grande && sync && sync !== 'off' && (
            <span className="relative inline-flex w-[9px] h-[9px] shrink-0"><SyncDot sync={sync} /></span>
          )}
          <motion.span
            className="ml-auto text-ink-faint inline-flex"
            animate={{ rotate: dadosAberto ? 180 : 0 }} transition={MOLA_TOQUE}
          >
            <IconSeta />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {dadosAberto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={MOLA_TOQUE}
              className="overflow-hidden"
            >
              <div className={`flex flex-col ${grande ? 'pb-3 pl-7' : 'pb-1 pl-3'}`}>
                {acoes.map(a => (
                  <button
                    key={a.rotulo} role="menuitem" onClick={a.aoClicar}
                    className={grande
                      ? 'w-full flex items-center gap-3 py-2.5 text-corpo text-ink-soft text-left'
                      : 'w-full flex items-center gap-2.5 rounded-medio px-3 py-2 text-corpo text-ink-soft text-left hover:bg-toque'}
                  >
                    <span className="relative shrink-0 inline-flex">
                      {a.icone}{a.ponto ? <SyncDot sync={a.ponto} /> : null}
                    </span>
                    {a.rotulo}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* o rótulo da nuvem diz o estado, não só a categoria */
function rotuloNuvem(sync) {
  return {
    ok: 'Nuvem — em dia',
    sync: 'Nuvem — sincronizando',
    pending: 'Nuvem — envio pendente',
    err: 'Nuvem — erro ao sincronizar',
    // conflito nao pode passar calado: e o aviso de que a nuvem tem algo mais
    // novo, e que o envio foi barrado de proposito para nao apagar
    conflito: 'Nuvem — há algo mais novo lá',
  }[sync] || 'Conectar à nuvem'
}

/* Três linhas que viram um X. Só transform e opacity — as duas propriedades
   que o compositor acelera. Animar `top` custaria layout a cada quadro. */
function Hamburguer({ aberto }) {
  const linha = 'absolute left-0 top-0 h-[1.5px] w-full rounded-full bg-current origin-center'
  return (
    <span className="relative block w-[18px] h-[11.5px]" aria-hidden="true">
      <motion.span className={linha} animate={aberto ? { y: 5, rotate: 45 } : { y: 0, rotate: 0 }} transition={MOLA_TOQUE} />
      <motion.span className={linha} initial={{ y: 5 }} animate={{ y: 5, opacity: aberto ? 0 : 1, scaleX: aberto ? 0.3 : 1 }} transition={MOLA_TOQUE} />
      <motion.span className={linha} animate={aberto ? { y: 5, rotate: -45 } : { y: 10, rotate: 0 }} transition={MOLA_TOQUE} />
    </span>
  )
}

const SyncDot = ({ sync }) => {
  const c = { off: 'bg-ink-mute', ok: 'bg-moss', sync: 'bg-gold animate-pulse', pending: 'bg-gold animate-pulse', err: 'bg-rust', conflito: 'bg-rust animate-pulse' }[sync] || 'bg-ink-mute'
  if (sync === 'off' || !sync) return null
  return <span className={`absolute -right-1 -bottom-1 w-[9px] h-[9px] rounded-full border-2 border-paper ${c}`} />
}

const IconBusca = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
)
const IconFiltros = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
)
const IconStats = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
)
const IconSeta = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
)
const IconGrade = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
)
const IconLista = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
)
const IconCloud = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 16" /><path d="M8 16h9.5" /></svg>
)
const IconRelogio = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
const IconImage = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>
)
const IconBaixar = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
)
const IconRestaurar = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5-5 5 5M12 4v12" /></svg>
)
