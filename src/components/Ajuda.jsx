import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { FADE, MOLA_GAVETA, MOLA_TOQUE } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { CONTATO, PRAZO_RESPOSTA } from '../lib/termos.js'
import { FAQ, CAMPOS_CONTESTAVEIS, textoDaContestacao, mailtoDaContestacao } from '../lib/ajuda.js'
import PopupDocumentos from './Documentos.jsx'

/* A CENTRAL DE AJUDA.
 *
 * Três assuntos numa porta só: as perguntas que se repetem, o jeito de avisar
 * que um dado de obra está errado, e o e-mail de contato.
 *
 * POR QUE JUNTOS. Quem procura ajuda não sabe de antemão em qual dos três o
 * problema dele cai — e três itens separados no menu obrigariam a adivinhar.
 * Entrando por um lugar só, a pessoa varre e acha; e o FAQ, que resolve a
 * maioria, fica no caminho de quem ia escrever um e-mail.
 *
 * E O CONTATO FICA VISÍVEL SEMPRE, no rodapé do painel, não escondido no fim
 * de uma lista: um FAQ sem saída vira beco para quem tem a décima terceira
 * pergunta.
 */
export default function Ajuda({ open, onClose, onNotice }) {
  const [aberta, setAberta] = useState(null)       // qual pergunta está expandida
  const [docs, setDocs] = useState(null)           // 'termos' | 'privacidade' | null

  /* Reabrir o painel começa do começo: com a última pergunta ainda aberta, a
     tela voltaria rolada no meio de uma resposta que já foi lida. */
  useEffect(() => { if (open) setAberta(null) }, [open])

  /* Os grupos saem da própria lista, em vez de estarem escritos aqui: assim
     acrescentar uma pergunta de um grupo novo não pede edição em dois lugares.
     `useMemo` porque a lista é constante — refazer o agrupamento a cada render
     seria trabalho por nada. */
  const grupos = useMemo(() => {
    const m = new Map()
    for (const item of FAQ) {
      if (!m.has(item.g)) m.set(item.g, [])
      m.get(item.g).push(item)
    }
    return [...m.entries()]
  }, [])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
            initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          >
            <motion.div
              className="w-full sm:max-w-[620px] h-full sm:h-auto sm:max-h-[88vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
              initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={MOLA_GAVETA}
            >
              <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
                <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Ajuda</h3>
                <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
              </div>

              <div className="flex-1 overflow-auto px-5 sm:px-6 py-5 flex flex-col gap-6">
                {/* ---- PERGUNTAS ---- */}
                {grupos.map(([grupo, itens]) => (
                  <section key={grupo} className="flex flex-col gap-1">
                    <h4 className="font-rotulo text-rotulo uppercase text-ink-faint mb-1">{grupo}</h4>
                    {itens.map(item => {
                      const estaAberta = aberta === item.q
                      return (
                        <div key={item.q} className="border-b border-linha last:border-0">
                          {/* Uma aberta por vez. Com todas abertas, o painel
                              vira um texto corrido de duas mil palavras e a
                              lista deixa de servir para varrer. */}
                          <button
                            type="button"
                            aria-expanded={estaAberta}
                            onClick={() => setAberta(q => (q === item.q ? null : item.q))}
                            className="w-full flex items-start gap-3 py-3 text-left"
                          >
                            <span className={`flex-1 text-corpo font-medium leading-snug transition-colors
                              ${estaAberta ? 'text-ink' : 'text-ink-soft'}`}>
                              {item.q}
                            </span>
                            <motion.span
                              className="text-ink-mute shrink-0 mt-0.5 inline-flex"
                              animate={{ rotate: estaAberta ? 180 : 0 }} transition={MOLA_TOQUE}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </motion.span>
                          </button>

                          <AnimatePresence initial={false}>
                            {estaAberta && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={MOLA_TOQUE}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-col gap-2 pb-4 pr-7">
                                  {item.a.map((par, i) => (
                                    <p key={i} className="text-apoio text-ink-faint leading-relaxed">{par}</p>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </section>
                ))}

                {/* ---- CONTESTAÇÃO ---- */}
                <Contestacao onNotice={onNotice} />

                {/* ---- DOCUMENTOS ---- */}
                <section className="flex flex-col gap-2 pt-1 border-t border-separador">
                  <h4 className="font-rotulo text-rotulo uppercase text-ink-faint pt-4">Documentos</h4>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="neo-btn" onClick={() => setDocs('termos')}>Termos de uso</button>
                    <button type="button" className="neo-btn" onClick={() => setDocs('privacidade')}>Política de privacidade</button>
                  </div>
                </section>
              </div>

              {/* ---- CONTATO ----
                  No rodapé fixo, e não no fim da rolagem: é a saída para quem
                  não achou a resposta, e quem não achou a resposta é
                  justamente quem não vai rolar até o fim. */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-separador flex flex-wrap items-center justify-between gap-2">
                <p className="text-apoio text-ink-faint leading-relaxed">
                  Não achou? Escreva — respondemos em até {PRAZO_RESPOSTA}.
                </p>
                {/* `<a>` e não `<button>`: é navegação para fora, e o botão
                    direito precisa oferecer "copiar endereço". */}
                <a href={`mailto:${CONTATO}`} className="neo-btn neo-btn-moss whitespace-nowrap">
                  {CONTATO}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PopupDocumentos open={!!docs} inicial={docs || 'termos'} onClose={() => setDocs(null)} />
    </>
  )
}

/* ------------------------------------------------------------------
   CONTESTAR OS DADOS DE UMA OBRA

   O catálogo vai deixar de ser preenchido por quem usa e passar a vir pronto.
   No dia em que isso acontecer, a pessoa que encontra "desenho: Fulano" onde
   deveria estar "Ciclano" não tem mais onde corrigir — e o dado errado fica
   errado para todo mundo. Este formulário é a porta que substitui o campo de
   edição que vai sumir.

   HOJE ELE ABRE UM E-MAIL, porque não há servidor para receber. O formato do
   texto já é o que um servidor leria: rótulo e valor, uma linha cada. Quando
   houver API, muda o destino do botão e nada mais — nem os campos, nem o
   texto, nem o que a pessoa aprendeu a preencher.

   E TAMBÉM COPIA, porque `mailto:` falha calado em muito navegador e em quase
   todo webmail aberto numa aba. Um botão que não faz nada visível é pior que
   não ter botão: a pessoa acha que enviou.
   ------------------------------------------------------------------ */
const rot = 'font-rotulo text-rotulo uppercase text-ink-soft pl-0.5'

function Contestacao({ onNotice }) {
  const { obras } = useStore()
  const [aberto, setAberto] = useState(false)
  const [d, setD] = useState({ obra: '', campo: 'autoria', atual: '', correto: '', fonte: '' })
  const [erro, setErro] = useState('')

  const set = (k, v) => { setD(x => ({ ...x, [k]: v })); setErro('') }

  /* Só o que falta de verdade. Pedir a fonte seria o ideal e afastaria quem
     tem razão e não tem link; "o que está lá hoje" às vezes é justamente o
     que a pessoa não consegue descrever. O mínimo é: qual obra, e o que
     deveria estar escrito. */
  const faltando = !d.obra.trim() || !d.correto.trim()

  const enviar = () => {
    if (faltando) { setErro('Diga ao menos qual é a obra e qual seria a informação correta.'); return }
    window.location.href = mailtoDaContestacao(d)
  }

  const copiar = async () => {
    if (faltando) { setErro('Diga ao menos qual é a obra e qual seria a informação correta.'); return }
    try {
      await navigator.clipboard.writeText(textoDaContestacao(d))
      onNotice?.('Texto copiado — cole num e-mail para ' + CONTATO)
    } catch (e) {
      setErro('O navegador não deixou copiar. Selecione o texto à mão, ou use o botão de e-mail.')
    }
  }

  return (
    <section className="flex flex-col gap-3 pt-1 border-t border-separador">
      <div className="pt-4">
        <h4 className="font-rotulo text-rotulo uppercase text-ink-faint">Dados de uma obra estão errados?</h4>
        <p className="text-apoio text-ink-faint leading-relaxed mt-1">
          Conte o que está incorreto e qual seria a informação certa. Cada contestação é
          analisada antes de qualquer mudança.
        </p>
      </div>

      {!aberto ? (
        <button type="button" className="neo-btn self-start" onClick={() => setAberto(true)}>
          Contestar um dado
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={rot} htmlFor="ct-obra">Qual obra</label>
            {/* `list` e não um `<select>` das obras da coleção: o erro pode
                estar numa obra que você NÃO tem — e um select fecharia a porta
                justamente para quem está só consultando o catálogo. A lista
                sugere, sem obrigar. */}
            <input
              id="ct-obra" className="field-input" list="ct-obras"
              value={d.obra} onChange={e => set('obra', e.target.value)}
              placeholder="Título, e a edição se souber"
            />
            <datalist id="ct-obras">
              {obras.slice(0, 200).map(o => <option key={o.id} value={o.titulo} />)}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label className={rot} htmlFor="ct-campo">O que está errado</label>
            <select id="ct-campo" className="field-input" value={d.campo} onChange={e => set('campo', e.target.value)}>
              {CAMPOS_CONTESTAVEIS.map(c => <option key={c.v} value={c.v}>{c.rotulo}</option>)}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={rot} htmlFor="ct-atual">Está registrado como</label>
              <input id="ct-atual" className="field-input" value={d.atual}
                onChange={e => set('atual', e.target.value)} placeholder="O que aparece hoje" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={rot} htmlFor="ct-correto">O correto seria</label>
              <input id="ct-correto" className="field-input" value={d.correto}
                onChange={e => set('correto', e.target.value)} placeholder="A informação certa" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={rot} htmlFor="ct-fonte">Fonte (opcional)</label>
            <input id="ct-fonte" className="field-input" value={d.fonte}
              onChange={e => set('fonte', e.target.value)}
              placeholder="Onde conferir: créditos da edição, site da editora, link…" />
            <p className="text-apoio text-ink-mute leading-relaxed">
              Não é obrigatório, mas uma fonte faz a correção entrar bem mais rápido.
            </p>
          </div>

          {erro && <p className="text-apoio text-rust leading-snug pl-0.5">{erro}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="neo-btn neo-btn-moss" onClick={enviar}>Enviar por e-mail</button>
            <button type="button" className="neo-btn" onClick={copiar}>Copiar o texto</button>
            <button type="button" className="neo-btn ml-auto" onClick={() => setAberto(false)}>Cancelar</button>
          </div>

          {/* O aviso do estado de hoje. Sem ele, "Enviar por e-mail" parece
              um envio para um sistema — e a pessoa fecharia a aba achando
              que a contestação foi registrada em algum lugar. */}
          <p className="text-apoio text-ink-mute leading-relaxed">
            Enquanto não há servidor, a contestação vai por e-mail mesmo: o botão abre o seu
            programa de e-mail já preenchido, para {CONTATO}.
          </p>
        </div>
      )}
    </section>
  )
}
