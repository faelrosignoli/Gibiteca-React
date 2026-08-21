import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_TOQUE } from '../lib/motion.js'
import { gNorm } from '../lib/helpers.js'
import {
  useLugarDaLista, useFechaAoClicarFora, useSeguirDestaque,
  CLASSE_LISTA, classeOpcao,
} from '../lib/lista-suspensa.js'

/* Lista fechada de escolha única — o que era <select> nos Filtros.
 *
 * Irmão do Combo, mas para o outro caso: aqui não se digita um valor novo, só
 * se escolhe um dos que existem. O <select> nativo não aceita os tokens do app
 * (a folha aberta é desenhada pelo sistema operacional), então a gaveta de
 * Filtros ficava com um pedaço de outra interface no meio dela.
 *
 * Ganho de passagem: listas longas — Editora, Autor — recebem um campo de
 * busca. No <select> nativo, achar uma editora entre trinta era rolar no olho.
 */

const COM_BUSCA_A_PARTIR_DE = 8

export default function Selecao({
  value = '', onChange, options = [], changed = false, placeholder = 'Selecionar',
  compacto = false, className = '',
}) {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const [busca, setBusca] = useState('')
  const caixa = useRef(null)
  const gatilho = useRef(null)
  const lista = useRef(null)
  const campoBusca = useRef(null)

  const lugar = useLugarDaLista(aberto, gatilho)
  useFechaAoClicarFora(aberto, caixa, () => setAberto(false))
  useSeguirDestaque(aberto, lista, ativo)

  const temBusca = options.length >= COM_BUSCA_A_PARTIR_DE
  const visiveis = useMemo(() => {
    if (!temBusca || !busca.trim()) return options
    const alvo = gNorm(busca)
    return options.filter(([, rot]) => gNorm(rot).includes(alvo))
  }, [options, busca, temBusca])

  const atual = options.find(([v]) => v === value)
  const rotuloAtual = atual ? atual[1] : placeholder

  const abrir = () => {
    // o índice se conta sobre `options`, não sobre `visiveis`: a busca acabou
    // de ser limpa, então ao abrir a lista mostra tudo de novo
    setBusca('')
    setAtivo(options.findIndex(([v]) => v === value))
    setAberto(true)
    if (temBusca) setTimeout(() => campoBusca.current?.focus(), 0)
  }
  const fechar = () => { setAberto(false); gatilho.current?.focus() }
  const escolher = (v) => { onChange(v); setAberto(false); gatilho.current?.focus() }

  const noTeclado = (e) => {
    if (e.key === 'Escape') {
      if (aberto) { e.preventDefault(); e.stopPropagation(); fechar() }
      return
    }
    if (!aberto) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo(a => (a + 1) % Math.max(visiveis.length, 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo(a => (a <= 0 ? visiveis.length : a) - 1) }
    else if (e.key === 'Home') { e.preventDefault(); setAtivo(0) }
    else if (e.key === 'End') { e.preventDefault(); setAtivo(visiveis.length - 1) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (visiveis[ativo]) escolher(visiveis[ativo][0])
    } else if (e.key === 'Tab') setAberto(false)
  }

  return (
    <div ref={caixa} className={`relative ${aberto ? 'z-30' : ''} ${className}`}>
      <button
        ref={gatilho}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={noTeclado}
        role="combobox" aria-expanded={aberto} aria-haspopup="listbox"
        className={`w-full flex items-center gap-2 rounded-full border bg-surface text-left outline-none
                    font-semibold transition-colors duration-200
                    ${compacto ? 'text-apoio pl-3 pr-1.5 py-1.5' : 'text-corpo pl-3.5 pr-2.5 py-2'}
                    ${changed ? 'border-moss text-ink' : 'border-separador text-ink hover:border-moss-3'}`}
      >
        <span className="flex-1 min-w-0 truncate">{rotuloAtual}</span>
        <motion.svg
          className="w-[14px] h-[14px] shrink-0 text-ink-faint" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: aberto ? 180 : 0 }} transition={MOLA_TOQUE}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: lugar.cima ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: lugar.cima ? 4 : -4 }}
            transition={MOLA_TOQUE}
            style={{ maxHeight: lugar.altura }}
            className={`${CLASSE_LISTA} ${lugar.cima ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          >
            {temBusca && (
              <div className="px-2 pb-1.5 pt-0.5">
                <input
                  ref={campoBusca}
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setAtivo(0) }}
                  onKeyDown={noTeclado}
                  placeholder="Buscar…"
                  className="w-full rounded-pequeno border border-separador bg-paper px-2.5 py-1.5 text-corpo text-ink outline-none focus:border-moss"
                />
              </div>
            )}
            <ul ref={lista} role="listbox">
              {visiveis.map(([v, rot], i) => (
                <li key={v} role="option" aria-selected={v === value}>
                  <button
                    type="button" tabIndex={-1}
                    onMouseDown={e => e.preventDefault()}
                    onMouseEnter={() => setAtivo(i)}
                    onClick={() => escolher(v)}
                    className={`${classeOpcao(i === ativo)} flex items-center gap-2`}
                  >
                    <span className="flex-1 min-w-0 truncate">{rot}</span>
                    {v === value && (
                      <svg className="w-[14px] h-[14px] shrink-0 text-moss" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
              {visiveis.length === 0 && (
                <li className="px-3.5 py-2 text-corpo text-ink-faint">Nada com esse nome.</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
