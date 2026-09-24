import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../lib/store.jsx'
import { FADE } from '../lib/motion.js'

/* Aviso de que o navegador recusou a gravação.
 *
 * Existe porque o contrário — falhar calado — é o pior estado possível deste
 * app: a obra aparece na tela, a pessoa acha que salvou, e ao recarregar
 * descobre que não. Enquanto a falha durar, o aviso fica; não é dispensável,
 * porque o risco não passa até os dados irem para algum lugar durável.
 */
export default function AvisoSemEspaco({ onNuvem, onBackup }) {
  const { semEspaco } = useStore()
  return (
    <AnimatePresence>
      {semEspaco && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={FADE}
          role="alert"
          className="mx-auto w-full max-w-[1320px] px-3 sm:px-4"
        >
          <div className="rounded-medio border border-rust bg-tinta-rust px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="font-display text-obra text-ink">Este navegador não conseguiu guardar a coleção</div>
              <p className="text-corpo text-ink-soft leading-relaxed mt-0.5">
                Ela ficou grande demais para o espaço que o navegador reserva. As alterações{' '}
                <b>só existem nesta aba</b> — se fechar ou recarregar, elas somem.
                Mande para a nuvem ou baixe um backup agora.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" className="neo-btn" onClick={onBackup}>Baixar backup</button>
              <button type="button" className="neo-btn neo-btn-moss" onClick={onNuvem}>Abrir a nuvem</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
