import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { DOCUMENTOS, DOC_VERSAO, DOC_DESDE } from '../lib/termos.js'

/* OS DOCUMENTOS: termos de uso e política de privacidade.
 *
 * Componente próprio, e não um pedaço do cadastro, porque DOIS lugares
 * precisam deles: o cadastro, onde se aceita, e a central de ajuda, onde se
 * relê depois. Copiado nos dois, um ganharia uma correção e o outro não — e
 * documento jurídico com duas versões na mesma tela é pior que documento
 * nenhum.
 *
 * MESMO MOLDE DO TEMA E DO BACKUP: mesma moldura, mesma entrada, mesmo título
 * em caixa alta. Pop-ups que chegam de jeitos diferentes fazem o app parecer
 * vários apps.
 *
 * ABRE POR CIMA sem desmontar quem chamou: no cadastro, o que já foi digitado
 * continua lá. Um link que levasse para outra página perderia o formulário, e
 * perder um formulário para ler o que se vai aceitar é o jeito mais curto de
 * ninguém ler.
 *
 * DOIS DOCUMENTOS, DUAS ABAS, UMA VERSÃO. Eles são aceitos no mesmo clique e
 * carregam o mesmo número de versão — separá-los em dois pop-ups faria parecer
 * que se pode aceitar um sem o outro.
 */
export default function PopupDocumentos({ open, onClose, inicial = 'termos' }) {
  const [aba, setAba] = useState(inicial)
  const corpoRef = useRef(null)

  /* Reabrir volta para a aba pedida por quem chamou: o cadastro manda para os
     termos, a ajuda pode mandar para a privacidade. Sem isto, a aba ficaria na
     última lida, que não é a que a pessoa acabou de clicar. */
  useEffect(() => { if (open) setAba(inicial) }, [open, inicial])

  /* Trocar de aba volta ao topo. O corpo rola, e os dois textos são longos —
     entrar na privacidade no meio de uma seção, porque os termos estavam
     rolados, parece documento truncado. */
  useEffect(() => { if (corpoRef.current) corpoRef.current.scrollTop = 0 }, [aba])

  const doc = DOCUMENTOS.find(d => d.id === aba) || DOCUMENTOS[0]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[620px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">{doc.titulo}</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>

            {/* `tablist` de verdade, não dois botões soltos: quem ouve precisa
                saber que são duas faces da mesma coisa, e que uma está
                selecionada. */}
            <div role="tablist" aria-label="Documentos" className="flex gap-1 px-5 sm:px-6 pt-3 pb-1 border-b border-linha">
              {DOCUMENTOS.map(d => (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={aba === d.id}
                  onClick={() => setAba(d.id)}
                  className={`relative px-3 py-2 text-corpo font-medium rounded-medio transition-colors
                    ${aba === d.id ? 'text-ink' : 'text-ink-mute hover:text-ink-soft'}`}
                >
                  {d.titulo}
                  {/* O fio da aba ativa carrega `layoutId`, então ele DESLIZA
                      de uma aba para a outra em vez de piscar. Existe uma vez
                      só no DOM — dois elementos com o mesmo id ao mesmo tempo
                      quebrariam a animação. */}
                  {aba === d.id && (
                    <motion.span
                      layoutId="abaDoc"
                      className="absolute left-2 right-2 -bottom-[5px] h-[2px] bg-moss rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            <div ref={corpoRef} className="flex-1 overflow-auto px-5 sm:px-6 py-5 flex flex-col gap-5">
              {doc.secoes.map(s => (
                <section key={s.n} className="flex flex-col gap-1.5">
                  <h4 className="font-rotulo text-rotulo uppercase text-ink-soft">
                    {s.n}. {s.t}
                  </h4>
                  {s.p.map((texto, i) => (
                    <p key={i} className="text-corpo text-ink-faint leading-relaxed">{texto}</p>
                  ))}
                </section>
              ))}

              {/* Versão e data VISÍVEIS, não só guardadas no aceite: é isto que
                  diz qual texto está sendo lido, e é o que permite comparar
                  com a versão registrada no perfil. */}
              <p className="text-apoio text-ink-mute pt-1 border-t border-linha mt-1 pt-3">
                Versão {DOC_VERSAO} · em vigor desde {DOC_DESDE}
              </p>
            </div>

            <div className="flex justify-end px-5 sm:px-6 py-3.5 border-t border-separador">
              <button type="button" className="neo-btn" onClick={onClose}>Fechar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
