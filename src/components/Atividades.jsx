import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MOLA_GAVETA, FADE } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { ghCommits } from '../lib/cloud.js'
import { lerMensagem } from '../lib/diario.js'

/* Linha do tempo das alterações.
 *
 * Não guarda histórico nenhum: lê os commits que a própria sincronização já
 * cria no repositório. A fonte da verdade continua sendo o GitHub — o app só
 * desenha.
 *
 * O desenho segue o painel de Atividades do Drive, e por bons motivos:
 *  - o evento é a AÇÃO, não cada item: um envio com 5 mudanças é uma entrada
 *    só, com as 5 aninhadas embaixo. Senão um dia de arrumação enterra o resto;
 *  - as mudanças aparecem como fichas indentadas sob a entrada, em vez de
 *    repetir a data em cada linha;
 *  - agrupamento por período, do recente para o antigo;
 *  - é leitura, não controle: sem desfazer, sem botões por item.
 */

const DIA = 86400000

function grupoDe(data, agora) {
  const d = new Date(data)
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0)
  const q = d.getTime()
  if (q >= hoje.getTime()) return 'Hoje'
  if (q >= hoje.getTime() - DIA) return 'Ontem'
  if (q >= hoje.getTime() - 7 * DIA) return 'Nos últimos 7 dias'
  if (d.getFullYear() === new Date(agora).getFullYear()) return 'Este ano'
  return String(d.getFullYear())
}

const hora = (d) => new Date(d).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })

export default function Atividades({ open, onClose }) {
  const { cloud } = useStore()
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!open) return
    const noEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', noEsc)
    return () => document.removeEventListener('keydown', noEsc)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !cloud.connected) return
    let vivo = true
    setCarregando(true); setErro('')
    ghCommits(cloud, cloud.path)
      .then(lista => { if (vivo) setItens(lista) })
      .catch(e => { if (vivo) setErro(String(e.message || e)) })
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [open, cloud])

  const agora = Date.now()
  const grupos = []
  itens.forEach(it => {
    if (!it.quando) return
    const g = grupoDe(it.quando, agora)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.titulo === g) ultimo.itens.push(it)
    else grupos.push({ titulo: g, itens: [it] })
  })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[66] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-veu backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
        >
          <motion.div
            className="w-full sm:max-w-[560px] h-full sm:h-auto sm:max-h-[88vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(35,39,28,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-separador">
              <h3 className="font-display text-secao text-moss">Atividades</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4">
              {!cloud.connected && (
                <p className="text-corpo text-ink-soft leading-relaxed">
                  O histórico vem do repositório da nuvem — cada alteração sua já vira uma versão lá.
                  Conecte a nuvem para ver a linha do tempo.
                </p>
              )}

              {cloud.connected && carregando && (
                <div className="py-8 text-center text-corpo text-ink-faint">Buscando o histórico…</div>
              )}

              {cloud.connected && !carregando && erro && (
                <div className="rounded-medio border border-separador bg-paper px-4 py-3 text-corpo text-ink-soft">{erro}</div>
              )}

              {cloud.connected && !carregando && !erro && grupos.length === 0 && (
                <div className="py-8 text-center text-corpo text-ink-faint">Nada registrado ainda.</div>
              )}

              {grupos.map(g => (
                <div key={g.titulo} className="mb-6 last:mb-0">
                  <div className="font-display text-obra text-ink mb-3">{g.titulo}</div>

                  <div className="flex flex-col gap-4">
                    {g.itens.map(it => {
                      const { assunto, itens: detalhes } = lerMensagem(it.mensagem)
                      return (
                        <div key={it.sha} className="flex gap-3">
                          {/* marcador da linha do tempo */}
                          <div className="flex flex-col items-center shrink-0 pt-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-moss shrink-0" />
                            <span className="w-px flex-1 bg-linha mt-1" />
                          </div>

                          <div className="min-w-0 flex-1 pb-1">
                            <div className="text-corpo text-ink leading-snug break-words">{assunto}</div>
                            <div className="font-mono text-rotulo uppercase text-ink-faint mt-1">{hora(it.quando)}</div>

                            {/* as mudanças da leva, aninhadas — uma entrada por
                                envio, não uma por obra */}
                            {detalhes.length > 0 && (
                              <div className="mt-2 flex flex-col gap-1.5">
                                {detalhes.map((d, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="mt-2 w-3 h-px bg-separador shrink-0" />
                                    <span className="rounded-pequeno border border-linha bg-paper px-2.5 py-1 text-apoio text-ink-soft break-words">
                                      {d}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
