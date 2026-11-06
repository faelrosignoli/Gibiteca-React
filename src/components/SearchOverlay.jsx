import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_CALMA, FADE } from '../lib/motion.js'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { coverOf, capaVelada, initials, classeTinta, edOf } from '../lib/helpers.js'
import { lerBuscas, guardarBusca, lerVistos, obrasVistas } from '../lib/recentes.js'

/* UMA MINIATURA DO QUE FOI VISTO.
   A capa +18 continua velada aqui, e com o selo: a busca não pode ser a
   brecha por onde passa o que a trava de idade esconde no resto do app. */
function Miniatura({ obra, velada, onAbrir }) {
  const capa = coverOf(obra)
  return (
    <button
      type="button" onClick={() => onAbrir(obra)}
      title={obra.nome} aria-label={`Abrir ${obra.nome}`}
      /* Sem moldura: a capa é a arte, e um fio em volta de cada uma vira
         grade. O canto é o mesmo do cartão da grade (rounded-pequeno), e o
         hover cresce um tico — nada de engrossar borda. */
      className="relative w-full aspect-square flex items-center justify-center
                 transition-transform duration-200 hover:scale-[1.06]"
    >
      {capa
        ? <img src={capa} alt="" loading="lazy"
            className={`absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain
                        rounded-pequeno shadow-[0_8px_16px_-10px_rgba(33,33,33,.5)] ${velada ? 'capa-velada' : ''}`} />
        : <div className={`w-full h-full rounded-pequeno flex items-center justify-center ${classeTinta(edOf(obra) || obra.nome)}`}>
            <span className="font-display font-semibold text-obra text-sobre-tinta">{initials(obra.nome)}</span>
          </div>}
      {velada && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-rust
                           bg-surface/85 text-rust font-rotulo text-rotulo font-bold tracking-tight">+18</span>
        </span>
      )}
    </button>
  )
}

function IconRelogio() {
  return (
    <svg className="w-[14px] h-[14px] shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
}

export default function SearchOverlay({ open, onClose, onAbrirObra }) {
  const { filters, setFilter, obras, verAdulto } = useStore()
  const inputRef = useRef(null)

  /* Os dois históricos são lidos ao ABRIR, não a cada tecla: são cache, e
     reler o localStorage a cada letra digitada não paga nada. */
  const [buscas, setBuscas] = useState([])
  const [vistos, setVistos] = useState([])
  useEffect(() => {
    if (!open) return
    setBuscas(lerBuscas())
    setVistos(obrasVistas(lerVistos(), obras))
  }, [open, obras])

  /* O × é "cancelar a busca", não "sair da tela": apaga o termo e fecha.
     Antes ele só fechava, e a coleção continuava filtrada por um texto que
     não estava mais à vista — dava a impressão de que obras tinham sumido.
     O Esc continua só fechando, para quem quer conferir o resultado. */
  const limparEFechar = () => { setFilter('q', ''); onClose() }

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
 className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[8vh] veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1, pointerEvents: 'auto' }}
          /* pointerEvents sai no INSTANTE em que a saida comeca (nao e animavel,
             o framer aplica de uma vez). Se o fade travar — thread ocupada, aba
             em segundo plano —, a camada fica presa no DOM, e sem isso ela
             engoliria todo clique do app com a tela aparentemente normal. */
          exit={{ '--veu-forca': 0, pointerEvents: 'none' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
 className="w-full max-w-[620px]"
            initial={{ y: -12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -12, opacity: 0, scale: 0.98 }}
            transition={MOLA_CALMA}
          >
            {/* O `relative` é do CAMPO, não do conjunto. Com o painel de
                recentes embaixo, um `relative` por fora fazia a lupa e o ×,
                que são `top-1/2`, descerem para o meio dos dois. */}
            <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              ref={inputRef}
              value={filters.q}
              onChange={e => setFilter('q', e.target.value)}
              /* O Enter é o que transforma o que foi digitado em busca
                 recente: é ali que a pessoa diz "era isto que eu queria".
                 Guardar a cada tecla encheria a lista com os pedaços de uma
                 palavra só. */
              onKeyDown={e => { if (e.key === 'Enter') { guardarBusca(filters.q); onClose() } }}
              placeholder="Buscar por título, editora, roteirista ou desenhista…"
 className="w-full rounded-full border border-separador bg-surface shadow-amb pl-12 pr-14 py-4 text-obra text-ink outline-none shadow-[0_24px_54px_-20px_rgba(0,0,0,.55)]"
            />
            <button
              onClick={limparEFechar} aria-label="Limpar a busca e fechar"
              title="Limpar a busca e fechar"
 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-toque hover:bg-toque text-ink-soft flex items-center justify-center text-obra"
            >✕</button>
            </div>

            {/* O PAINEL SÓ EXISTE ANTES DE DIGITAR. Com texto no campo quem
                responde é a coleção atrás, e manter histórico à frente dela
                seria competir com o próprio resultado.

                No celular empilha: duas colunas em 375px dariam miniaturas do
                tamanho de um selo. */}
            {!filters.q.trim() && (buscas.length > 0 || vistos.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={FADE}
                /* Translúcido: o painel é o segundo ator da tela, e o campo
                   acima continua sólido. O que aparece atrás dele já vem
                   borrado pelo véu, então o texto continua legível. */
                className="mt-3 rounded-grande border border-separador bg-surface/70 backdrop-blur-xl shadow-amb
                           px-5 py-4 grid gap-5 sm:grid-cols-2"
              >
                {buscas.length > 0 && (
                  <div className="flex flex-col gap-2 min-w-0">
                    {buscas.map(termo => (
                      <button
                        key={termo} type="button"
                        onClick={() => { setFilter('q', termo); guardarBusca(termo); onClose() }}
                        className="flex items-center gap-2.5 text-left text-corpo text-ink-soft
                                   hover:text-ink transition min-w-0"
                      >
                        <IconRelogio />
                        <span className="truncate">{termo}</span>
                      </button>
                    ))}
                  </div>
                )}

                {vistos.length > 0 && (
                  <div className="min-w-0">
                    <div className="font-rotulo text-rotulo uppercase text-ink-mute mb-2">Vistos por último</div>
                    <div className="grid grid-cols-3 gap-2">
                      {vistos.map(obra => (
                        <Miniatura
                          key={obra.id} obra={obra}
                          velada={capaVelada(obra, verAdulto)}
                          onAbrir={(o) => { onAbrirObra?.(o); onClose() }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
