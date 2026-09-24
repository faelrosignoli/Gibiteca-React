import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { FADE } from '../lib/motion.js'

/* Aviso de que o navegador recusou a gravação.
 *
 * Existe porque o contrário — falhar calado — é o pior estado possível deste
 * app: a obra aparece na tela, a pessoa acha que salvou, e ao recarregar
 * descobre que não.
 *
 * Dá para fechar: um aviso grudado na tela para sempre vira paisagem, e aí
 * não avisa mais nada. Mas fechar vale para a falha de AGORA — na próxima o
 * aviso volta, porque o risco voltou. É por isso que o store conta as falhas
 * em vez de guardar só um sim/não.
 */
export default function AvisoSemEspaco({ onNuvem, onBackup }) {
  const { semEspaco, falhasAoGuardar, dadoIlegivel } = useStore()
  const [dispensadoEm, setDispensadoEm] = useState(0)
  const [ilegivelDispensado, setIlegivelDispensado] = useState(false)
  const visivel = semEspaco && falhasAoGuardar > dispensadoEm
  const mostraIlegivel = dadoIlegivel && !ilegivelDispensado

  return (
    <>
    {/* Havia coleção guardada e ela não abriu. Antes isto virava uma estante
        vazia sem explicação — o susto de achar que tudo se perdeu. */}
    <AnimatePresence>
      {mostraIlegivel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={FADE}
          role="alert"
          className="mx-auto w-full max-w-[1320px] px-3 sm:px-4 pt-4 sm:pt-6"
        >
          <div className="rounded-medio border border-rust bg-tinta-rust pl-4 pr-2 py-3 flex flex-wrap items-start gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="font-display text-obra text-ink">A coleção guardada neste navegador não pôde ser lida</div>
              <p className="text-corpo text-ink-soft leading-relaxed mt-0.5">
                A estante começou vazia por isso — <b>não porque os dados sumiram</b>.
                Puxe da nuvem ou restaure um backup. Nada foi enviado por cima do que está lá.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" className="neo-btn neo-btn-moss" onClick={onNuvem}>Abrir a nuvem</button>
              <button
                type="button" aria-label="Dispensar aviso" title="Dispensar"
                onClick={() => setIlegivelDispensado(true)}
                className="neo-icon !w-9 !h-9 shrink-0"
              >×</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={FADE}
          role="alert"
          className="mx-auto w-full max-w-[1320px] px-3 sm:px-4 pt-4 sm:pt-6"
        >
          <div className="rounded-medio border border-rust bg-tinta-rust pl-4 pr-2 py-3 flex flex-wrap items-start gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="font-display text-obra text-ink">Este navegador não conseguiu guardar a coleção</div>
              <p className="text-corpo text-ink-soft leading-relaxed mt-0.5">
                Ela ficou grande demais para o espaço que o navegador reserva. As alterações{' '}
                <b>só existem nesta aba</b> — se fechar ou recarregar, elas somem.
                Mande para a nuvem ou baixe um backup agora.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" className="neo-btn" onClick={onBackup}>Baixar backup</button>
              <button type="button" className="neo-btn neo-btn-moss" onClick={onNuvem}>Abrir a nuvem</button>
              <button
                type="button"
                onClick={() => setDispensadoEm(falhasAoGuardar)}
                aria-label="Dispensar aviso"
                title="Dispensar — volta se acontecer de novo"
                className="neo-icon !w-9 !h-9 shrink-0"
              >×</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
