import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { FADE } from '../lib/motion.js'

/* Avisos de risco aos dados.
 *
 * Existem porque o contrário — falhar calado — é o pior estado possível deste
 * app: a pessoa acha que salvou, recarrega, e descobre que não.
 *
 * Dá para fechar: aviso grudado na tela para sempre vira paisagem, e aí não
 * avisa mais nada. Mas fechar vale para a falha de AGORA — o store conta as
 * falhas em vez de guardar um sim/não, então uma falha nova traz o aviso de
 * volta.
 */

/* A faixa em si. Os dois avisos usavam o mesmo desenho copiado, e a cópia
 * quebrou no celular sem ninguém notar — agora há um lugar só para arrumar.
 *
 * No celular EMPILHA: texto em cima, botões embaixo, cada um na largura
 * inteira. Em linha, o grupo de botões (que não encolhe) tomava a largura e
 * espremia o texto numa coluna de uma palavra por linha. */
function Faixa({ titulo, children, acoes, aoFechar }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={FADE}
      role="alert"
      className="mx-auto w-full max-w-[1320px] px-3 sm:px-4 pt-4 sm:pt-6"
    >
      <div className="relative rounded-medio border border-rust bg-tinta-rust p-4 pr-12 sm:pr-4
                      flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="min-w-0 sm:flex-1">
          <div className="font-display text-obra text-ink">{titulo}</div>
          <p className="text-corpo text-ink-soft leading-relaxed mt-0.5">{children}</p>
        </div>

        {/* no celular os botões ocupam a linha toda, lado a lado */}
        <div className="flex items-center gap-2 sm:shrink-0 [&>button]:flex-1 sm:[&>button]:flex-none">
          {acoes}
        </div>

        {/* o × sai do fluxo: em linha ele roubava espaço de quem precisava */}
        <button
          type="button" onClick={aoFechar}
          aria-label="Dispensar aviso" title="Dispensar"
          className="neo-icon !w-9 !h-9 absolute top-2 right-2 sm:static shrink-0"
        >×</button>
      </div>
    </motion.div>
  )
}

export default function AvisoSemEspaco({ onNuvem, onBackup }) {
  const { semEspaco, falhasAoGuardar, dadoIlegivel } = useStore()
  const [dispensadoEm, setDispensadoEm] = useState(0)
  const [ilegivelDispensado, setIlegivelDispensado] = useState(false)
  const semEspacoVisivel = semEspaco && falhasAoGuardar > dispensadoEm
  const ilegivelVisivel = dadoIlegivel && !ilegivelDispensado

  return (
    <>
      {/* Havia coleção guardada e ela não abriu. Antes isto virava uma estante
          vazia sem explicação — o susto de achar que tudo se perdeu. */}
      <AnimatePresence>
        {ilegivelVisivel && (
          <Faixa
            titulo="A coleção guardada neste navegador não pôde ser lida"
            aoFechar={() => setIlegivelDispensado(true)}
            acoes={<button type="button" className="neo-btn neo-btn-moss" onClick={onNuvem}>Abrir a nuvem</button>}
          >
            A estante começou vazia por isso — <b>não porque os dados sumiram</b>.
            Puxe da nuvem ou restaure um backup. Nada foi enviado por cima do que está lá.
          </Faixa>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {semEspacoVisivel && (
          <Faixa
            titulo="Este navegador não conseguiu guardar a coleção"
            aoFechar={() => setDispensadoEm(falhasAoGuardar)}
            acoes={<>
              <button type="button" className="neo-btn whitespace-nowrap" onClick={onBackup}>Baixar backup</button>
              <button type="button" className="neo-btn neo-btn-moss whitespace-nowrap" onClick={onNuvem}>Abrir a nuvem</button>
            </>}
          >
            Ela ficou grande demais para o espaço que o navegador reserva. As alterações{' '}
            <b>só existem nesta aba</b> — se fechar ou recarregar, elas somem.
            Mande para a nuvem ou baixe um backup agora.
          </Faixa>
        )}
      </AnimatePresence>
    </>
  )
}
