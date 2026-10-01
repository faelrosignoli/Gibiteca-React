import { motion } from 'framer-motion'
import logo from '../assets/logo.png'

/* Tela de abertura.
 *
 * O logo aparece grande no meio e, ao sair, VAI ATÉ o cabeçalho encolhendo —
 * não é uma coisa que some e outra que aparece, é a mesma marca mudando de
 * lugar. Quem faz isso é o `layoutId="marca"`: quando esta imagem desmonta e a
 * do cabeçalho monta com o mesmo id, o framer-motion anima entre os dois
 * retângulos.
 *
 * Duas consequências que o resto do código precisa respeitar:
 *
 *   1. o cabeçalho NÃO pode desenhar o logo enquanto a abertura está no ar —
 *      dois elementos com o mesmo layoutId ao mesmo tempo quebram a animação;
 *   2. a imagem daqui não pode ter animação de saída, senão o AnimatePresence
 *      a segura montada e cai no mesmo problema. Só o fundo faz fade.
 */
export default function Abertura({ aberto }) {
  return (
    <>
      {/* O fundo é quem desaparece; a marca não desaparece, ela viaja.
       *
       * Fica SEMPRE montado, e some por transição de CSS (`.veu-abertura`).
       * Era um `AnimatePresence` com fade em JS, e isso dava a tela branca:
       * se a thread principal travasse durante os 340ms — recarregar no meio
       * de uma sincronia de 4 MB trava —, o fade parava no meio, nunca
       * "terminava", e o AnimatePresence segurava a camada creme montada
       * cobrindo o app inteiro. Sem presença condicional não há o que
       * segurar. */}
      <div className="veu-abertura" data-fora={aberto ? '0' : '1'} aria-hidden="true" />

      {aberto && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center pointer-events-none">
          <motion.img
            layoutId="marca"
            src={logo}
            alt="Minha Gibiteca"
            className="h-24 sm:h-28 w-auto max-w-[70vw] object-contain"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>
      )}
    </>
  )
}
