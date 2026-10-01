import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_TOQUE } from '../lib/motion.js'
import { gNorm, splitLista } from '../lib/helpers.js'
import {
  useLugarDaLista, useFechaAoClicarFora, useSeguirDestaque,
  CLASSE_LISTA, classeOpcao,
} from '../lib/lista-suspensa.js'

/* Lista de pessoas (autor, artista) como etiquetas.
 *
 * Antes era um campo de texto com "/" no meio: digitar seis nomes virava uma
 * linha única, longa demais para caber no campo, em que corrigir o terceiro
 * nome exigia caçar a barra certa no meio da frase. Errar uma barra juntava
 * dois nomes num só, e aí o filtro de autor passava a listar "Alan Moore
 * Dave Gibbons" como se fosse uma pessoa.
 *
 * Aqui cada nome é uma etiqueta fechada, com × próprio. O que o componente
 * entrega para fora continua sendo a MESMA string separada por " / " — o
 * modelo de dados, os filtros, o diário e os backups não mudam nada.
 *
 * Fecha um nome com Enter, vírgula, ponto e vírgula ou Tab. Colar uma lista
 * inteira ("Alan Moore, Dave Gibbons; John Higgins") abre todas de uma vez.
 */

const SEPARADORES = /[\/,;\n]/

export default function Pessoas({
  value = '', onChange, options = [], placeholder = 'Digite um nome e aperte Enter',
}) {
  const nomes = splitLista(value)
  const [texto, setTexto] = useState('')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const caixa = useRef(null)
  const campo = useRef(null)
  const lista = useRef(null)

  const lugar = useLugarDaLista(aberto, caixa)
  useFechaAoClicarFora(aberto, caixa, () => setAberto(false))
  useSeguirDestaque(aberto, lista, ativo)

  const chaveNomes = nomes.join('|')
  const sugestoes = useMemo(() => {
    const usados = new Set(nomes.map(gNorm))
    const livres = options.filter(o => o && !usados.has(gNorm(o)))
    const alvo = gNorm(texto.trim())
    if (!alvo) return livres
    // quem começa com o que foi digitado vem antes de quem só contém
    const comeca = [], contem = []
    livres.forEach(o => {
      const nn = gNorm(o)
      if (nn.startsWith(alvo)) comeca.push(o)
      else if (nn.includes(alvo)) contem.push(o)
    })
    return [...comeca, ...contem]
  }, [options, texto, chaveNomes])

  // para fora continua saindo a string de sempre, separada por " / "
  const entregar = (arr) => onChange(arr.join(' / '))

  /* Aceita um nome só ou uma lista colada. Repetido não entra duas vezes —
     com acento ou sem, maiúscula ou não. */
  const adicionar = (bruto) => {
    const novos = String(bruto).split(SEPARADORES).map(x => x.trim()).filter(Boolean)
    if (!novos.length) return false
    const atual = nomes.slice()
    const vistos = new Set(atual.map(gNorm))
    novos.forEach(x => { if (!vistos.has(gNorm(x))) { vistos.add(gNorm(x)); atual.push(x) } })
    if (atual.length !== nomes.length) entregar(atual)
    return true
  }

  const remover = (i) => { entregar(nomes.filter((_, j) => j !== i)); campo.current?.focus() }

  const escolher = (op) => {
    adicionar(op)
    setTexto(''); setAtivo(-1)
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
    } else if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault()
      if (aberto && ativo >= 0 && sugestoes[ativo]) { escolher(sugestoes[ativo]); return }
      if (adicionar(texto)) setTexto('')
    } else if (e.key === 'Tab') {
      // fechar o nome no Tab, mas sem roubar a navegação do formulário
      if (texto.trim()) { adicionar(texto); setTexto('') }
      setAberto(false)
    } else if (e.key === 'Backspace' && !texto && nomes.length) {
      e.preventDefault(); remover(nomes.length - 1)
    } else if (e.key === 'Escape') {
      // fecha só a lista — o Editor não fecha no Esc
      if (aberto) { e.preventDefault(); e.stopPropagation(); setAberto(false) }
    }
  }

  return (
    <div ref={caixa} className={`relative ${aberto ? 'z-30' : ''}`}>
      {/* a caixa inteira é o campo: clicar em qualquer vão leva o cursor para
          o texto, como num campo de verdade */}
      <div
        onClick={() => campo.current?.focus()}
        className="field-input !py-1.5 !px-1.5 min-h-[42px] flex flex-wrap items-center gap-1.5 cursor-text"
      >
        {nomes.map((nome, i) => (
          <span key={nome + i}
            className="inline-flex items-center gap-1 max-w-full rounded-full bg-tinta-moss border border-moss-line pl-2.5 pr-1 py-0.5 text-apoio text-ink">
            <span className="truncate">{nome}</span>
            <button
              type="button" tabIndex={-1}
              onClick={e => { e.stopPropagation(); remover(i) }}
              aria-label={`Tirar ${nome}`} title={`Tirar ${nome}`}
              className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-ink-faint hover:text-rust hover:bg-surface transition-colors duration-200"
            >
              <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </span>
        ))}

        <input
          ref={campo}
          className="flex-1 min-w-[90px] bg-transparent border-0 outline-none px-1.5 py-1 text-corpo text-ink placeholder:text-ink-mute"
          value={texto}
          placeholder={nomes.length ? 'Mais um…' : placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={aberto}
          aria-autocomplete="list"
          onChange={e => { setTexto(e.target.value); setAberto(true); setAtivo(-1) }}
          onFocus={() => setAberto(true)}
          // sair do campo não pode comer o nome que já estava escrito
          onBlur={() => { if (texto.trim()) { adicionar(texto); setTexto('') } }}
          onPaste={e => {
            const colado = e.clipboardData.getData('text')
            if (!SEPARADORES.test(colado)) return      // nome único: deixa o campo cuidar
            e.preventDefault(); adicionar(colado); setTexto('')
          }}
          onKeyDown={noTeclado}
        />
      </div>

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
                  <Marcado texto={op} alvo={texto.trim()} />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

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
