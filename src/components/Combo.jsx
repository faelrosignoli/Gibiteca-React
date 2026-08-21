import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_TOQUE } from '../lib/motion.js'
import { gNorm } from '../lib/helpers.js'
import {
  useLugarDaLista, useFechaAoClicarFora, useSeguirDestaque,
  CLASSE_LISTA, classeOpcao,
} from '../lib/lista-suspensa.js'

/* Campo de texto com sugestões.
 *
 * Substitui o <datalist> do navegador, que não obedece a nenhum token do app —
 * fonte do sistema, largura própria, e no Editor ele escapava do modal.
 *
 * Continua sendo TEXTO LIVRE: a lista sugere, não obriga. Editora nova, país
 * novo e autor novo entram digitando, como sempre.
 *
 * Em campo que aceita "/" (país, autores), a sugestão entra só no trecho que
 * está sendo digitado: escolher "Espanha" com "Argentina / " no campo dá
 * "Argentina / Espanha", não "Espanha". Era isso que o datalist não sabia
 * fazer — ele trocava o campo inteiro, o que tornava a lista inútil justamente
 * nos campos que aceitam vários valores.
 */

// destaca o trecho digitado dentro da sugestão. Sem dobrar acento de
// propósito: gNorm decompõe (NFD) e mudaria os índices do texto original.
function Marcado({ texto, alvo }) {
  if (!alvo) return texto
  const i = texto.toLowerCase().indexOf(alvo.toLowerCase())
  if (i < 0) return texto
  return (
    <>
      {texto.slice(0, i)}
      <mark className="bg-transparent text-moss font-semibold">{texto.slice(i, i + alvo.length)}</mark>
      {texto.slice(i + alvo.length)}
    </>
  )
}

export default function Combo({
  value = '', onChange, options = [], placeholder, multi = false, className = '',
}) {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const caixa = useRef(null)
  const campo = useRef(null)
  const lista = useRef(null)

  const lugar = useLugarDaLista(aberto, campo)
  useFechaAoClicarFora(aberto, caixa, () => setAberto(false))
  useSeguirDestaque(aberto, lista, ativo)

  // o trecho que está sendo digitado agora, e os que já foram escolhidos
  const bruto = (value || '').split('/')
  const atual = (multi ? bruto[bruto.length - 1] : value || '').trim()
  const anteriores = multi ? bruto.slice(0, -1).map(x => x.trim()).filter(Boolean) : []
  const chaveAnteriores = anteriores.join('|')

  const sugestoes = useMemo(() => {
    const usados = new Set(anteriores.map(gNorm))
    const livres = options.filter(o => o && !usados.has(gNorm(o)))
    const alvo = gNorm(atual)
    if (!alvo) return livres
    // quem começa com o que foi digitado vem antes de quem só contém
    const comeca = [], contem = []
    livres.forEach(o => {
      const n = gNorm(o)
      if (n.startsWith(alvo)) comeca.push(o)
      else if (n.includes(alvo)) contem.push(o)
    })
    return [...comeca, ...contem]
  }, [options, atual, chaveAnteriores])

  useEffect(() => { if (!aberto) setAtivo(-1) }, [aberto])

  const escolher = (op) => {
    if (!multi) onChange(op)
    else {
      const p = (value || '').split('/')
      p[p.length - 1] = op
      onChange(p.map(x => x.trim()).filter(Boolean).join(' / '))
    }
    setAberto(false)
    campo.current?.focus()
  }

  const noTeclado = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!aberto) { setAberto(true); return }
      setAtivo(a => (a + 1) % Math.max(sugestoes.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!aberto) { setAberto(true); return }
      setAtivo(a => (a <= 0 ? sugestoes.length : a) - 1)
    } else if (e.key === 'Enter') {
      if (aberto && ativo >= 0 && sugestoes[ativo]) { e.preventDefault(); escolher(sugestoes[ativo]) }
      else setAberto(false)
    } else if (e.key === 'Escape') {
      // fecha só a lista — o Editor não fecha no Esc
      if (aberto) { e.preventDefault(); e.stopPropagation(); setAberto(false) }
    } else if (e.key === 'Tab') {
      setAberto(false)
    }
  }

  return (
    <div ref={caixa} className={`relative ${aberto ? 'z-30' : ''} ${className}`}>
      <input
        ref={campo}
        className="field-input pr-10"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
        onChange={e => { onChange(e.target.value); setAberto(true); setAtivo(-1) }}
        onFocus={() => setAberto(true)}
        onKeyDown={noTeclado}
      />

      <button
        type="button" tabIndex={-1} aria-label="Ver sugestões"
        onClick={() => { setAberto(a => !a); campo.current?.focus() }}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-toque transition-colors duration-200"
      >
        <motion.svg
          className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: aberto ? 180 : 0 }} transition={MOLA_TOQUE}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {aberto && sugestoes.length > 0 && (
          <motion.ul
            ref={lista}
            role="listbox"
            initial={{ opacity: 0, y: lugar.cima ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: lugar.cima ? 4 : -4 }}
            transition={MOLA_TOQUE}
            style={{ maxHeight: lugar.altura }}
            className={`${CLASSE_LISTA} ${lugar.cima ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          >
            {sugestoes.map((op, i) => (
              <li key={op} role="option" aria-selected={i === ativo}>
                <button
                  type="button" tabIndex={-1}
                  // sem isso o input perde o foco antes do clique registrar
                  onMouseDown={e => e.preventDefault()}
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => escolher(op)}
                  className={classeOpcao(i === ativo)}
                >
                  <Marcado texto={op} alvo={atual} />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
