import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'

/* Perguntas e avisos do app, no lugar de confirm() e alert() do navegador.
 * Não fecha no clique fora, Esc responde "não" e o foco começa na saída
 * segura — o nativo travava a aba, e aqui o acidente é a coleção inteira. */

const Ctx = createContext(null)

/* Em `perigo` o botão cheio é o CANCELAR; a ação destrutiva fica de contorno. */
const TONS = {
  perigo: { faixa: 'bg-tinta-rust', titulo: 'text-rust',         sim: 'neo-btn neo-btn-rust', nao: 'neo-btn neo-btn-moss' },
  aviso:  { faixa: 'bg-tinta-gold', titulo: 'text-ink',          sim: 'neo-btn neo-btn-moss', nao: 'neo-btn' },
  neutro: { faixa: 'bg-paper-2',    titulo: 'text-acento-texto', sim: 'neo-btn neo-btn-moss', nao: 'neo-btn' },
}

/** `perguntar({...})` devolve Promise<boolean>; `avisar({...})` devolve Promise<void>. */
export function usePergunta() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePergunta precisa estar dentro de <PerguntaProvider>')
  return ctx
}

export function PerguntaProvider({ children }) {
  const [pergunta, setPergunta] = useState(null)
  const responder = useRef(null)

  const fechar = useCallback((resposta) => {
    const r = responder.current
    responder.current = null
    setPergunta(null)
    r?.(resposta)
  }, [])

  const perguntar = useCallback((p) => new Promise((resolve) => {
    responder.current?.(false)   // pergunta em cima de pergunta: a anterior responde "não"
    responder.current = resolve
    setPergunta({ confirmar: 'Confirmar', cancelar: 'Cancelar', tom: 'neutro', ...p })
  }), [])

  const avisar = useCallback((p) => perguntar({
    confirmar: 'Entendi', tom: 'aviso', ...p, soAviso: true,
  }).then(() => undefined), [perguntar])

  return (
    <Ctx.Provider value={{ perguntar, avisar }}>
      {children}
      <Caixa pergunta={pergunta} aoResponder={fechar} />
    </Ctx.Provider>
  )
}

function Caixa({ pergunta, aoResponder }) {
  const cartaoRef = useRef(null)
  const saidaRef = useRef(null)
  const focoAnterior = useRef(null)

  // foco entra na saída segura e volta para onde estava ao fechar
  useEffect(() => {
    if (!pergunta) return
    focoAnterior.current = document.activeElement
    const t = setTimeout(() => saidaRef.current?.focus(), 0)
    return () => {
      clearTimeout(t)
      const antes = focoAnterior.current
      if (antes && typeof antes.focus === 'function') antes.focus()
    }
  }, [pergunta])

  // Esc responde "não"; Tab circula só dentro da caixa
  useEffect(() => {
    if (!pergunta) return
    const aoTeclar = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); aoResponder(false); return }
      if (e.key !== 'Tab') return
      const focaveis = cartaoRef.current?.querySelectorAll('button:not([disabled])')
      if (!focaveis || !focaveis.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
    }
    window.addEventListener('keydown', aoTeclar, true)
    return () => window.removeEventListener('keydown', aoTeclar, true)
  }, [pergunta, aoResponder])

  const tom = TONS[pergunta?.tom] || TONS.neutro

  return (
    <AnimatePresence>
      {pergunta && (
        <motion.div
          /* acima da gaveta (80) e do aviso flutuante (90); sem onClick: clicar fora não responde */
          className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }}
          transition={FADE}
        >
          <motion.div
            ref={cartaoRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pergunta-titulo"
            aria-describedby={pergunta.corpo ? 'pergunta-corpo' : undefined}
            /* cartão centrado nos dois tamanhos: tela cheia no celular esconderia
               justamente a obra sobre a qual se pergunta */
            className="w-full max-w-[460px] bg-surface rounded-grande border border-separador
                       overflow-hidden shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 16, opacity: 0.4, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={MOLA_GAVETA}
          >
            <div className={`px-5 sm:px-6 pt-5 pb-4 ${pergunta.corpo ? 'border-b border-linha' : ''} ${tom.faixa}`}>
              <h2 id="pergunta-titulo" className={`font-cartaz font-semibold uppercase text-secao ${tom.titulo}`}>
                {pergunta.titulo}
              </h2>
            </div>

            {/* corpo só nos avisos; as confirmações dizem tudo no título */}
            {pergunta.corpo && (
              <div id="pergunta-corpo" className="px-5 sm:px-6 py-4 text-corpo text-ink-soft leading-relaxed">
                {pergunta.corpo}
              </div>
            )}

            <div className="flex justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-separador">
              {pergunta.soAviso ? (
                <button ref={saidaRef} type="button" className={tom.sim} onClick={() => aoResponder(true)}>
                  {pergunta.confirmar}
                </button>
              ) : (
                <>
                  <button ref={saidaRef} type="button" className={tom.nao} onClick={() => aoResponder(false)}>
                    {pergunta.cancelar}
                  </button>
                  <button type="button" className={tom.sim} onClick={() => aoResponder(true)}>
                    {pergunta.confirmar}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
