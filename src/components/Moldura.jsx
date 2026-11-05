import { AnimatePresence, motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'

/* A MOLDURA DOS MODAIS — o véu, o cartão, a entrada e a saída.
 *
 * Era a mesma coisa copiada em nove arquivos: as mesmas classes, a mesma
 * animação, o mesmo clique-fora. Mudar uma sombra virava caçada em nove
 * lugares, e esquecer um deixava uma janela diferente das outras.
 *
 * O que varia de verdade entre elas é pouco, e são as props: a largura, a
 * altura máxima e a camada. As classes chegam prontas (`sm:max-w-[620px]`)
 * em vez de virem como número, porque o Tailwind só gera o que vê escrito.
 *
 * `fechaFora={false}` é para quem tem formulário preenchido — o Editor —,
 * onde perder o cadastro por um clique no vazio custa caro.
 *
 * NÃO serve para as gavetas (Filtros, Fila, Listas, Detalhe): aquelas entram
 * pela lateral, se arrastam para fechar e têm controle de arrasto próprio.
 * Forçá-las aqui dentro encheria esta peça de exceções até ela não explicar
 * mais nada.
 */
export default function Moldura({
  aberto, onFechar, children,
  z = 'z-[60]', largura = 'sm:max-w-[460px]', altura = '', fechaFora = true,
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className={`fixed inset-0 ${z} flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado`}
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }}
          transition={FADE}
          onClick={fechaFora ? (e) => { if (e.target === e.currentTarget) onFechar() } : undefined}
        >
          <motion.div
            className={`w-full ${largura} h-full sm:h-auto ${altura} flex flex-col bg-surface
                        sm:rounded-grande sm:border sm:border-separador overflow-hidden
                        sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]`}
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
