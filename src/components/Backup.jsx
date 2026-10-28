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
  const { obras, editoras, fila, listas, loadBackup } = useStore()
  const fileRef = useRef(null)

  const exportar = () => {
    baixarBackup(obras, editoras, fila, listas)
    onNotice?.('Backup salvo.')
  }

  /* Restaurar passa por três portas, e cada uma responde uma pergunta
     diferente — porque as três falhas são diferentes:
       1. o arquivo abre?           (JSON quebrado, .txt renomeado)
       2. tem uma coleção dentro?   (JSON legítimo que não é desta casa)
       3. você quer mesmo trocar?   (substitui tudo, sem desfazer)
     Antes havia só a primeira: um JSON qualquer passava batido, não trocava
     nada, e o app ainda dizia "Coleção restaurada". */
  const aoEscolher = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onerror = () => onNotice?.('Não deu para ler o arquivo.')
    r.onload = () => {
      let dados
      try {
        dados = JSON.parse(String(r.result))
      } catch (err) {
        onNotice?.('Esse arquivo não abre: não é um backup da Gibiteca.')
        return
      }

      if (!Array.isArray(dados && dados.obras)) {
        onNotice?.('Esse arquivo não tem uma coleção dentro. Use o que sai de “Exportar coleção”.')
        return
      }

      /* Os números vêm antes do clique, e são a parte que importa: "substitui
         554 por 2" é um aviso; "isso não tem desfazer" é só uma frase. */
      const certeza = confirm(
        'Restaurar SUBSTITUI a coleção deste navegador.\n\n' +
        'Aqui: ' + obras.length + ' obra(s).\n' +
        'No arquivo: ' + dados.obras.length + ' obra(s).\n\n' +
        'Isso não tem desfazer. Exporte antes, se tiver dúvida.'
      )
      if (!certeza) return

      if (!loadBackup(dados)) {
        onNotice?.('Não deu para restaurar esse arquivo.')
        return
      }
      onNotice?.('Coleção restaurada.')
      onClose()
    }
    r.readAsText(f)
    e.target.value = ''
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[460px] h-full sm:h-auto flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
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
