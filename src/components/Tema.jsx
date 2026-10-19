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
 * CADA TEMA É UMA FAIXA, pintada com as cores dele e empilhada sobre as
 * outras. Antes eram duas palavras lado a lado, e a palavra era a amostra:
 * dava para dois temas e quebrava no terceiro. A faixa mostra a cor no
 * tamanho em que ela vai ser vista — um fundo —, e empilhar deixa a lista
 * crescer sem ninguém mexer no layout.
 */

/* [valor, rótulo, cores]
 *
 * As cores são o que o tema PARECE, não o que ele usa por dentro: um tema de
 * três cores mostra as três em degradê, um de uma mostra a cor cheia. Elas
 * ficam cravadas em hex de propósito — a faixa do Candy tem de ser rosa
 * mesmo quando o site está no Midnight, senão a lista inteira vira a mesma
 * cor e a escolha deixa de ser uma escolha.
 *
 * `sobre` é a tinta do nome em cima da faixa. É escolhida por contraste, não
 * por gosto: #23271C (ink) sobre o rosa do Candy dá 5,8:1, e o papel sobre o
 * Midnight dá 16,3:1. Conferido com a mesma conta do WCAG que o resto do
 * projeto usa.
 */
const TEMAS = [
  { v: 'moss',     rotulo: 'Moss',     cores: ['#4B5D3A'],                        sobre: '#F4F0E6' },
  { v: 'nockout',  rotulo: 'Nockout',  cores: ['#FF5000'],                        sobre: '#23271C' },
  { v: 'candy',    rotulo: 'Candy',    cores: ['#DF8888', '#EBB273', '#B5CDC5'],  sobre: '#23271C' },
  { v: 'midnight', rotulo: 'Midnight', cores: ['#280137'],                        sobre: '#F3F1F6' },
]

/* Uma cor vira cor cheia; mais de uma, degradê na diagonal.
   `135deg` e não `90deg`: na horizontal as três faixas do Candy leem como
   três botões colados; na diagonal leem como uma superfície só. */
const fundo = (cores) =>
  cores.length === 1 ? cores[0] : `linear-gradient(135deg, ${cores.join(', ')})`

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

            {/* `radiogroup`: são faces da MESMA escolha, não botões soltos.
                Sem isso o leitor de tela anuncia "Moss, botão" sem dizer de
                que pergunta aquilo é resposta. */}
            <div className="px-5 sm:px-6 py-5 overflow-auto">
              <div role="radiogroup" aria-label="Tema do site" className="flex flex-col gap-2.5">
                {TEMAS.map(({ v, rotulo, cores, sobre }) => {
                  const escolhido = tema === v
                  return (
                    <button
                      key={v} role="radio" aria-checked={escolhido}
                      onClick={() => setTema(v)}
                      /* O que marca o escolhido é um ANEL por fora, não um
                         contorno por dentro: a faixa é a cor, e um contorno
                         comeria uma fatia dela. O anel usa a tinta do app, não
                         a do tema — ele é a voz da interface dizendo "é este",
                         e teria de mudar de cor a cada faixa para ser visto. */
                      className={`relative w-full rounded-grande px-5 py-6 text-left
                        transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
                        hover:-translate-y-px active:scale-[.99]
                        outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        focus-visible:ring-offset-surface focus-visible:ring-ink/40
                        ${escolhido ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : ''}`}
                      style={{ background: fundo(cores), color: sobre }}
                    >
                      <span className="font-display font-extrabold uppercase text-secao leading-none">
                        {rotulo}
                      </span>

                      {/* O visto, só no escolhido. Ele repete o que o anel já
                          diz — de propósito: anel é forma, visto é símbolo, e
                          quem não distingue um anel fino de uma borda ainda
                          reconhece um visto. Quem ouve recebe o `aria-checked`,
                          que não depende de nenhum dos dois. */}
                      {escolhido && (
                        <span aria-hidden="true" className="absolute right-5 top-1/2 -translate-y-1/2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12.5l5 5L20 6.5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* O pop-up NÃO fecha ao escolher. A troca de tema repinta a
                  página inteira atrás do véu, e fechar junto tiraria da vista
                  justamente o que mudou — além de impedir experimentar os
                  temas sem reabrir o menu a cada um. */}
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
