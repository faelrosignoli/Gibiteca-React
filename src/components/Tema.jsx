import { AnimatePresence, motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'

/* Pop-up do tema.
 *
 * Era um bloco dentro do ☰, com um fio separando-o do resto — ele não era um
 * item de lista como os outros, era um ajuste, e precisava de uma régua só
 * para dizer isso. Agora é um item igual aos outros, e o ajuste mora atrás da
 * porta, como o Backup. O fio foi junto: não há mais exceção para separar.
 *
 * MESMO MOLDE DO BACKUP de propósito — mesma moldura, mesma entrada, mesmo
 * título em caixa alta. Dois pop-ups abertos do mesmo menu que chegassem de
 * jeitos diferentes fariam o menu parecer duas coisas.
 *
 * Aqui as opções ficam LADO A LADO, e no Backup em coluna. Não é capricho: lá
 * são duas ações de pesos diferentes (uma delas substitui a coleção inteira),
 * e a coluna serve para afastá-las. Aqui são dois iguais — uma escolha entre
 * pares —, e lado a lado é como se lê escolha entre pares.
 */
const TEMAS = [['moss', 'Moss', '#4B5D3A'], ['nockout', 'Nockout', '#FF5000']]

export default function Tema({ open, onClose }) {
  const { tema, setTema } = useStore()

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
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Tema</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>

            {/* `radiogroup`: são duas faces da MESMA escolha, não dois botões
                soltos. Sem isso o leitor de tela anuncia "Moss, botão" sem
                dizer de que pergunta aquilo é resposta. */}
            <div className="px-5 sm:px-6 py-6">
              <div role="radiogroup" aria-label="Tema do site" className="flex gap-2">
                {TEMAS.map(([v, rotulo, cor]) => (
                  <button
                    key={v} role="radio" aria-checked={tema === v}
                    onClick={() => setTema(v)}
                    /* Sem contorno e sem bolinha: a palavra É a amostra. O que
                       marca o escolhido é a tinta — o apagado recua, o marcado
                       fica cheio. Para leitor de tela quem conta é o
                       aria-checked, que não depende de cor nem de opacidade. */
                    className="tema-palavra flex-1 rounded-medio px-2 py-4 font-display font-extrabold uppercase text-titulo
                      outline-none
                      focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-ink/30"
                    data-escolhido={tema === v ? '1' : '0'}
                    /* hex cravado de propósito: a palavra MOSTRA a cor de cada
                       tema, então não pode seguir o tema atual */
                    style={{ color: cor }}
                  >
                    {/* Duas camadas do mesmo texto: a de baixo apagada, a de
                        cima cheia e recortada por clip-path. No hover o
                        recorte abre da esquerda para a direita, e a palavra se
                        ENTINTA como pincelada — em vez de só clarear de uma
                        vez. A de cima é aria-hidden: para quem ouve, o texto é
                        um só. */}
                    <span className="tema-palavra__camadas">
                      <span className="tema-palavra__base">{rotulo}</span>
                      <span className="tema-palavra__tinta" aria-hidden="true">{rotulo}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* O pop-up NÃO fecha ao escolher. A troca de tema repinta a
                  página inteira atrás do véu, e fechar junto tiraria da vista
                  justamente o que mudou — além de impedir experimentar os dois
                  sem reabrir o menu duas vezes. */}
              <p className="mt-4 text-apoio text-ink-faint leading-relaxed">
                A escolha vale na hora e fica guardada neste navegador.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
