import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { MAIORIDADE } from '../lib/conta.js'
import { esquecerFicha } from '../lib/ficha.js'
import PopupDocumentos from './Documentos.jsx'
import { usePergunta } from './Pergunta.jsx'

/* CONFIGURAÇÕES.
 *
 * Nasceu para tirar duas portas do ☰. Capas e Backup eram itens de primeiro
 * nível ao lado de Fila, Listas e Estatísticas — e não são da mesma família:
 * aquelas três são jeitos de OLHAR a coleção, estas duas são manutenção do
 * aplicativo. Um menu que mistura "ver minhas listas" com "exportar o arquivo"
 * obriga a ler os nove rótulos toda vez.
 *
 * Aqui dentro elas reencontram os companheiros naturais: o ajuste de conteúdo,
 * os documentos, a versão e a limpeza. Tudo o que é sobre o APP, e nada sobre
 * o acervo.
 *
 * ---- O MOLDE É O MESMO ----
 *
 * Mesma moldura, mesma entrada, mesmo título em caixa alta do Tema e do
 * Backup. Dois pop-ups abertos do mesmo menu que chegassem de jeitos
 * diferentes fariam o menu parecer duas coisas.
 */

/* A linha de Configurações: rótulo à esquerda, o que for à direita.
 *
 * Uma forma só para coisas de naturezas diferentes — um botão que abre outra
 * tela, um interruptor, um dado que só se lê. É o que deixa a lista ser
 * varrida de cima a baixo sem o olho ter de reaprender onde olhar a cada
 * linha. */
function Linha({ rotulo, apoio, children, onClick, perigo }) {
  const Caixa = onClick ? 'button' : 'div'
  return (
    <Caixa
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`w-full text-left flex items-center gap-4 py-3.5 border-b border-linha last:border-b-0
        ${onClick ? 'transition-colors hover:text-acento-texto' : ''}
        ${perigo ? 'hover:!text-rust' : ''}`}
    >
      <span className="min-w-0 flex-1">
        <span className={`block text-obra ${perigo ? 'text-rust' : 'text-ink'}`}>{rotulo}</span>
        {apoio && <span className="block mt-0.5 text-apoio text-ink-faint leading-snug">{apoio}</span>}
      </span>
      {children}
    </Caixa>
  )
}

/* O interruptor. Alvo de 44px e `role="switch"`, que é o que diz a um leitor
   de tela que isto liga e desliga — e não que é uma opção entre várias. */
function Chave({ ligado, onChange, rotulo, travado }) {
  return (
    <button
      type="button" role="switch" aria-checked={ligado} aria-label={rotulo}
      disabled={travado}
      onClick={() => onChange(!ligado)}
      className={`shrink-0 w-[46px] h-[26px] rounded-full border transition-colors relative
        ${travado ? 'bg-paper-2 border-linha opacity-45 cursor-not-allowed'
          : ligado ? 'bg-moss border-moss' : 'bg-paper-2 border-contorno'}`}
    >
      <span
        className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-surface shadow-[0_1px_3px_rgba(33,33,33,.4)]
          transition-[left] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${ligado ? 'left-[22px]' : 'left-[2px]'}`}
      />
    </button>
  )
}

const Seta = () => (
  <svg className="w-4 h-4 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export default function Configuracoes({ open, onClose, onBulk, onBackup, onNotice }) {
  const { perguntar } = usePergunta()
  const { perfil, setPerfil, podeAdulto, conta } = useStore()
  const [docs, setDocs] = useState(null)      // 'termos' | 'privacidade' | null

  /* LIMPAR CACHE É O OPOSTO DE APAGAR A COLEÇÃO, e a tela precisa dizer isso
   * antes de alguém clicar — "cache" é palavra que assusta justamente quem tem
   * mais a perder.
   *
   * O que sai: o histórico guardado da ficha de atividades, os avisos já
   * dispensados e o que o navegador tiver em `caches` (service worker).
   *
   * O que NÃO sai, e é o que importa: a coleção, a conta, a sessão e a
   * configuração da nuvem. Nenhuma dessas chaves é tocada aqui — e é por isso
   * que elas estão nomeadas no comentário em vez de o código varrer tudo o que
   * começa com `gibiteca_`. Varrer por prefixo levaria a coleção junto no dia
   * em que alguém acrescentasse uma chave nova sem pensar nisto. */
  const limpar = async () => {
    const ok = await perguntar({ titulo: 'Limpar o cache?', confirmar: 'Limpar' })
    if (!ok) return

    esquecerFicha()
    try { localStorage.removeItem('gibiteca_aviso_servidor') } catch (e) { /* modo privado */ }
    try {
      if (typeof caches !== 'undefined') {
        const nomes = await caches.keys()
        await Promise.all(nomes.map(n => caches.delete(n)))
      }
    } catch (e) { /* o navegador pode recusar; o resto já saiu */ }

    onNotice?.('Cache limpo. A coleção não foi tocada.')
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
            className="w-full sm:max-w-[460px] h-full sm:h-auto sm:max-h-[88vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Configurações</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 sm:px-6 py-2">

              {/* ---- CONTEÚDO ---- */}
              {/* A TRAVA DE IDADE.
                   Os Termos e a Ajuda já prometiam: só quem informou a data de
                   nascimento e tem ${MAIORIDADE} anos ou mais consegue ligar. Aqui
                   ela aparece; quem impede de verdade é o `verAdulto` do
                   store, que toda capa consulta — trava só no botão cairia na
                   primeira restauração de backup de outra conta.

                   A frase do impedimento FICA, ao contrário das outras que
                   saíram do painel: ela não repete o rótulo, diz por que o
                   interruptor não obedece. Interruptor morto sem explicação é
                   a tela escondendo o motivo de quem mais precisa dele. */}
              <Linha
                rotulo="Exibir conteúdo adulto"
                apoio={podeAdulto ? null : (conta.nascimento
                  ? `Disponível a partir dos ${MAIORIDADE} anos.`
                  : 'Informe a data de nascimento no seu perfil para liberar.')}
              >
                <Chave
                  ligado={!!perfil.mostrarAdulto && podeAdulto}
                  travado={!podeAdulto}
                  rotulo="Exibir conteúdo adulto"
                  onChange={v => setPerfil({ ...perfil, mostrarAdulto: v })}
                />
              </Linha>

              {/* ---- AS DUAS QUE VIERAM DO ☰ ----
                  Fecham este pop-up e abrem o delas. Empilhar painel sobre
                  painel faria duas camadas de véu e dois × no mesmo canto. */}
              <Linha rotulo="Capas" onClick={() => { onClose(); onBulk?.() }}><Seta /></Linha>
              <Linha rotulo="Backup" onClick={() => { onClose(); onBackup?.() }}><Seta /></Linha>

              {/* ---- DOCUMENTOS ----
                  Abrem POR CIMA, e não fechando: são leitura de apoio, e quem
                  os abre daqui quer voltar para cá. */}
              <Linha rotulo="Termos de uso" onClick={() => setDocs('termos')}><Seta /></Linha>
              <Linha rotulo="Política de privacidade" onClick={() => setDocs('privacidade')}><Seta /></Linha>

              {/* ---- VERSÃO ----
                  Sai do package.json em tempo de build (`__VERSAO__`), e não
                  cravada aqui: número de versão escrito à mão é número de
                  versão que um dia mente. */}
              <Linha rotulo="Versão">
                <span className="font-mono text-corpo text-ink-faint tabular-nums">v{__VERSAO__}</span>
              </Linha>

              <Linha
                rotulo="Limpar cache"
                apoio="Não mexe na sua coleção."
                onClick={limpar}
                perigo
              />
            </div>
          </motion.div>

          <PopupDocumentos open={!!docs} inicial={docs || 'termos'} onClose={() => setDocs(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
