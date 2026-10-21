import { AnimatePresence, motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'

/* O PASSO A PASSO DO GITHUB, num lugar só.
 *
 * Dois lugares mostram exatamente este texto: o painel de Perfil, onde ele
 * fica atrás de "Como fazer?" ao lado dos campos que vai explicar, e o aviso
 * de "o servidor ainda não está no ar" da tela de entrada, onde não há campo
 * nenhum — só a explicação.
 *
 * Copiado nos dois, bastaria o GitHub renomear um menu para um deles ficar
 * ensinando um caminho que não existe mais. Instrução desatualizada é pior que
 * instrução nenhuma: a pessoa procura o botão, não acha, e conclui que errou.
 */
export function PassosGitHub() {
  return (
    <div className="text-apoio text-ink-soft bg-surface-2 border border-separador rounded-medio px-3.5 py-3 leading-relaxed">
      <p className="mb-2">
        Isto salva sua coleção <b className="text-acento-texto">no seu próprio repositório</b>, para ela ficar igual em qualquer aparelho.
        Você precisa de um <b className="text-acento-texto">token</b> do GitHub (uma chave de acesso limitada).
      </p>
      <b className="text-acento-texto">Passo a passo:</b> 1) Acesse <b>github.com/settings/tokens</b> → <b>Fine-grained tokens</b> → <b>Generate new token</b>.
      2) Em <b>Repository access</b>, escolha <b>Only select repositories</b> e marque o repositório da sua gibiteca.
      3) Em <b>Permissions → Repository permissions → Contents</b>, mude para <b>Read and write</b>.
      4) Gere, copie e cole abaixo. <br />O GitHub só mostra o token uma vez — se vazar, revogue na mesma página.
    </div>
  )
}

/* A VERSÃO EM POP-UP, para quem ainda não entrou.
 *
 * Na tela de entrada não existe painel de Perfil para abrir — ele vive do
 * outro lado do login. Então o mesmo texto chega numa janela, com o aviso de
 * que a conexão em si se faz depois, lá dentro.
 *
 * O "cole abaixo" do passo 4 fica sem o "abaixo" aqui, e é por isso que existe
 * o parágrafo final dizendo onde os campos estão: sem ele, o passo a passo
 * termina mandando colar numa tela que a pessoa não está vendo.
 */
export default function PopupTutorialGitHub({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[520px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Conectar ao GitHub</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 sm:px-6 py-5 flex flex-col gap-3">
              <PassosGitHub />
              <p className="text-apoio text-ink-faint leading-relaxed">
                Os campos para colar ficam dentro do aplicativo, em{' '}
                <b className="text-acento-texto">☰ › Seus dados › Perfil</b>. Entre primeiro e
                faça a conexão por lá — o token não sai do seu aparelho.
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
