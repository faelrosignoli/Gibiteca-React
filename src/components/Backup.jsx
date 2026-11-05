import { useRef } from 'react'
import Moldura from './Moldura.jsx'
import { AnimatePresence, motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { baixarBackup } from '../lib/backup.js'
import { usePergunta } from './Pergunta.jsx'

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
  const { perguntar } = usePergunta()
  const { obras, editoras, fila, listas, loadBackup } = useStore()
  const fileRef = useRef(null)

  const exportar = () => {
    baixarBackup(obras, editoras, fila, listas)
    onNotice?.('Backup salvo.')
  }

  /* Três portas: o arquivo abre? tem coleção dentro? quer mesmo trocar? */
  const aoEscolher = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onerror = () => onNotice?.('Não deu para ler o arquivo.')
    r.onload = async () => {
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

      // os números são o aviso: "substitui 554 por 2" diz mais que "não tem desfazer"
      const certeza = await perguntar({
        titulo: `Substituir ${obras.length === 1 ? '1 obra' : obras.length + ' obras'} daqui por ${dados.obras.length} do arquivo?`,
        tom: 'perigo',
        confirmar: 'Restaurar',
      })
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
    <Moldura aberto={open} onFechar={onClose} z="z-[60]" largura="sm:max-w-[460px]">
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
    </Moldura>
  )
}
