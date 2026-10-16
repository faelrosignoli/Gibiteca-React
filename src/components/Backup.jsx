import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { baixarBackup } from '../lib/backup.js'

/* Pop-up do backup.
 *
 * Exportar e restaurar eram dois itens soltos na lista do menu, parecidos
 * demais para a diferença que têm: um grava um arquivo, o outro SUBSTITUI a
 * coleção inteira. Juntos aqui, cada um ganha espaço para dizer o que faz
 * antes de ser clicado.
 *
 * Em coluna, e não lado a lado: botões irmãos de larguras iguais convidam ao
 * clique rápido, e restaurar não é ação para clique rápido.
 */
export default function Backup({ open, onClose, onNotice }) {
  const { obras, editoras, loadBackup } = useStore()
  const fileRef = useRef(null)

  const exportar = () => {
    baixarBackup(obras, editoras)
    onNotice?.('Backup salvo.')
  }

  const aoEscolher = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        loadBackup(JSON.parse(String(r.result)))
        onNotice?.('Coleção restaurada.')
        onClose()
      } catch (err) {
        onNotice?.('Não deu para ler o arquivo: ' + (err && err.message))
      }
    }
    r.readAsText(f)
    e.target.value = ''
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-veu backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[460px] h-full sm:h-auto flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(35,39,28,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Backup</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>

            <input ref={fileRef} type="file" accept="application/json" hidden onChange={aoEscolher} />

            <div className="flex flex-col gap-3 px-5 sm:px-6 py-5">
              <button type="button" className="cta w-full justify-center !pr-5" onClick={exportar}>
                Exportar coleção
              </button>
              <p className="text-apoio text-ink-faint leading-relaxed -mt-1">
                Salva tudo num arquivo no seu computador.
              </p>

              {/* `cta-ghost` e não a mesma pílula escura: restaurar SUBSTITUI a
                  coleção inteira, e dois botões idênticos convidariam a clicar
                  no errado. O peso visual menor é o aviso. */}
              <button type="button" className="cta cta-ghost w-full justify-center !pr-5 mt-2" onClick={() => fileRef.current?.click()}>
                Importar coleção
              </button>
              <p className="text-apoio text-ink-faint leading-relaxed -mt-1">
                Substitui o que está aqui pelo conteúdo do arquivo. Exporte antes, se tiver dúvida.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
