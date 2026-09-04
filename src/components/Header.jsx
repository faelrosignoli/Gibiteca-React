import { useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_TOQUE, useEhDesktop } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import logo from '../assets/logo.png'

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

/* Logo do celular.
 *
 * Fica FORA do bloco fixo de propósito: ele pertence ao topo da página e some
 * ao rolar. Só a pílula de botões acompanha a rolagem — é o que precisa estar
 * sempre à mão numa coleção grande.
 */
export function LogoMobile({ aberturaNoAr = false }) {
  const aoInicio = useVoltarAoInicio()
  const ehDesktop = useEhDesktop()
  return (
    <div className="sm:hidden flex justify-center px-3 pt-8 pb-4">
      <button
        type="button"
        onClick={aoInicio}
        aria-label={ROTULO_LOGO}
        className="rounded-full transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[.97]"
      >
        {/* o layoutId só vai em UM dos dois logos — o que está visível.
            Dois com o mesmo id ao mesmo tempo quebram a viagem da marca. */}
        {!aberturaNoAr && (
          <motion.img layoutId={ehDesktop ? undefined : 'marca'}
            src={logo} alt="Minha Gibiteca"
            className="h-16 w-auto max-w-[78vw] object-contain pointer-events-none" />
        )}
      </button>
    </div>
  )
}

/* Barra única do topo.
 *
 *   desktop:  Busca · Filtros · Estatísticas · LOGO · Galeria/Lista · ☰
 *   celular:  LOGO grande, e abaixo a pílula só com os botões
 *
 * A pílula é opaca e não tem desfoque: o que flutua sobre o conteúdo é ela, e
 * só ela — não há faixa de fundo atravessando a tela.
 *
 * Nuvem, Capas e Backup vivem dentro do ☰ — são operações raras. O ponto de
 * estado da sincronização foi para o próprio ☰: a ação pode se esconder, o
 * aviso não pode.
 */
export default function Header({ onCloud, onBulk, onFilters, onStats, onSearch, filterCount, aberturaNoAr = false }) {
  const { obras, editoras, loadBackup, sync, view, setView, filters } = useStore()
  const aoInicio = useVoltarAoInicio()
  const ehDesktop = useEhDesktop()
  const fileRef = useRef(null)
  const [menu, setMenu] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const foraDoMenu = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenu(false) }
    const noEsc = (e) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('mousedown', foraDoMenu)
    document.addEventListener('keydown', noEsc)
    return () => {
      document.removeEventListener('mousedown', foraDoMenu)
      document.removeEventListener('keydown', noEsc)
    }
  }, [menu])

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { loadBackup(JSON.parse(r.result)) } catch (_) { alert('Arquivo inválido.') } }
    r.readAsText(f); e.target.value = ''
  }
  const exportJSON = () => {
    const data = { version: 1, exported: new Date().toISOString(), obras, editoras }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'gibiteca-backup-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMenu(false)
  }

  const acoes = [
    { rotulo: rotuloNuvem(sync), icone: <IconCloud />, ponto: sync, aoClicar: () => { setMenu(false); onCloud?.() } },
    { rotulo: 'Enviar capas', icone: <IconImage />, aoClicar: () => { setMenu(false); onBulk?.() } },
    { rotulo: 'Baixar backup (.json)', icone: <IconBaixar />, aoClicar: exportJSON },
    { rotulo: 'Restaurar backup (.json)', icone: <IconRestaurar />, aoClicar: () => { setMenu(false); fileRef.current?.click() } },
  ]

  return (
    <header className="px-3 sm:px-4 pt-0 sm:pt-5 pb-0">
      <div className="mx-auto w-full max-w-[1320px]">
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />

        {/* A pílula. No celular guarda só os botões, espalhados nas pontas.
            A partir de sm: vira grade de três colunas, e a do meio põe o logo
            no centro exato, independente da largura dos dois lados. */}
        <div className="flex items-center justify-between gap-1.5 rounded-full border border-linha bg-paper shadow-island px-2 sm:px-4 py-2
                        sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4">

          {/* ---- esquerda: busca, filtros, estatísticas ---- */}
          <div className="order-1 flex items-center gap-1.5 sm:justify-self-start">
            <button className="pill-btn !px-3" onClick={onSearch} title="Buscar" aria-label="Buscar">
              <IconBusca />
              {filters.q ? <span className="w-[7px] h-[7px] rounded-full bg-moss" /> : null}
            </button>

            <button className="pill-btn !px-3 md:!px-4" onClick={onFilters} title="Filtros">
              <IconFiltros />
              <span className="hidden md:inline">Filtros</span>
              {filterCount
                ? <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-moss text-white text-rotulo font-bold">{filterCount}</span>
                : null}
            </button>

            <button className="pill-btn !px-3 md:!px-4" onClick={onStats} title="Estatísticas">
              <IconStats />
              <span className="hidden md:inline">Estatísticas</span>
            </button>
          </div>

          {/* ---- centro: logo ---- */}
          <div className="hidden sm:flex order-1 sm:order-2 sm:w-auto justify-center">
            <button
              type="button"
              onClick={aoInicio}
              aria-label={ROTULO_LOGO}
              title={ROTULO_LOGO}
              className="shrink-0 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px active:scale-[.97]"
            >
              {!aberturaNoAr && (
                <motion.img layoutId={ehDesktop ? 'marca' : undefined}
                  src={logo} alt="Minha Gibiteca"
                  className="h-9 sm:h-10 w-auto max-w-[56vw] sm:max-w-none object-contain pointer-events-none" />
              )}
            </button>
          </div>

          {/* ---- direita: galeria/lista e o menu ---- */}
          <div className="order-3 flex items-center gap-1.5 sm:justify-self-end shrink-0" ref={wrapRef}>
            <div className="relative inline-flex rounded-full border border-separador p-1">
              {[['galeria', 'Galeria'], ['lista', 'Lista']].map(([v, l]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-corpo font-semibold transition-colors ${view === v ? 'text-paper' : 'text-ink-soft hover:text-ink'}`}>
                  {view === v && (
                    <motion.span
                      layoutId="viewToggleActive"
                      className="absolute inset-0 rounded-full bg-ink"
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

            <div className="relative">
              <button
                type="button"
                className="isl-icon !w-9 !h-9 relative"
                onClick={() => setMenu(m => !m)}
                aria-label={menu ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menu}
                aria-haspopup="menu"
                title="Nuvem, capas e backup"
              >
                <Hamburguer aberto={menu} />
                {/* o aviso de sincronização acompanha o menu que agora guarda a Nuvem */}
                <SyncDot sync={sync} />
              </button>

              <AnimatePresence>
                {menu && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={MOLA_TOQUE}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 top-[calc(100%+10px)] z-40 min-w-[248px] rounded-medio border border-separador bg-surface p-2 shadow-amb-lg flex flex-col gap-0.5"
                  >
                    {acoes.map((a, i) => (
                      <motion.button
                        key={a.rotulo}
                        role="menuitem"
                        onClick={a.aoClicar}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOLA_TOQUE, delay: 0.03 + i * 0.035 }}
                        className="flex items-center gap-2.5 rounded-medio px-3 py-2.5 text-corpo font-medium text-ink hover:bg-toque text-left"
                      >
                        <span className="relative text-ink-soft shrink-0 inline-flex">
                          {a.icone}{a.ponto ? <SyncDot sync={a.ponto} /> : null}
                        </span>
                        {a.rotulo}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
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
const IconGrade = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
)
const IconLista = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
)
const IconCloud = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 16" /><path d="M8 16h9.5" /></svg>
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
