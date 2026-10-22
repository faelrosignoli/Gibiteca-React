import { AnimatePresence, motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { TEMAS } from '../lib/temas.js'

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
          className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[460px] h-full sm:h-auto flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto flex-1">Tema</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>

            {/* `radiogroup`: são faces da MESMA escolha, não botões soltos.
                Sem isso o leitor de tela anuncia "Moss, botão" sem dizer de
                que pergunta aquilo é resposta.

                O POP-UP NÃO FECHA AO ESCOLHER. A troca de tema repinta a
                página inteira atrás do véu, e fechar junto tiraria da vista
                justamente o que mudou — além de impedir experimentar os temas
                sem reabrir o menu a cada um. */}
            <div className="px-5 sm:px-6 py-5 overflow-auto">
              <div role="radiogroup" aria-label="Tema do site" className="flex flex-col gap-2.5">
                {TEMAS.map(({ v, rotulo, cores, sobre, arte }) => {
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
                      className={`grupo-faixa relative w-full overflow-hidden rounded-grande aspect-[40/7] flex items-center px-5 text-left
                        transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
                        hover:-translate-y-px active:scale-[.99]
                        outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        focus-visible:ring-offset-surface focus-visible:ring-ink/40
                        ${escolhido ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : ''}`}
                      style={{ background: fundo(cores), color: sobre }}
                    >
                      {/* A ILUSTRAÇÃO DE HOVER.
                          Entra por cima da cor cheia, nunca no lugar dela: a
                          cor continua sendo o fundo, e a arte é uma camada que
                          aparece e some. Arte com transparência deixa a cor do
                          tema aparecer por baixo — que é o jeito de ela nunca
                          competir com o rótulo.

                          `aria-hidden`: é decoração. O nome acessível da faixa
                          já é o nome do tema. */}
                      {arte && (
                        <span
                          aria-hidden="true"
                          className="faixa-arte"
                          /* A URL entra como VARIÁVEL, não como `background-image`.
                             Quem decide se ela vira imagem é o CSS, dentro do
                             `@media (hover: hover)` — assim o celular, que nunca
                             vai ver o hover, também nunca baixa o arquivo.

                             E ENTRA ABSOLUTA, resolvida aqui no JS. Não é
                             preciosismo: `url()` dentro de uma custom property é
                             resolvido contra a FOLHA DE ESTILO que usa o `var()`,
                             não contra o documento nem contra onde a variável foi
                             declarada.

                             Com `base: './'`, o `BASE_URL` é `./`. Em
                             desenvolvimento o Vite injeta o CSS como <style> no
                             documento, então `./tema-moss.webp` cai na raiz e
                             tudo funciona. Publicado, o CSS é um arquivo em
                             `/assets/index-xxxx.css` — e o mesmo `./` passa a
                             apontar para `/assets/tema-moss.webp`, que não
                             existe. O hover simplesmente não pintava nada, sem
                             erro nenhum no console.

                             `new URL(..., document.baseURI)` tira a relatividade
                             do caminho antes de ele encostar no CSS, e aí não
                             importa de onde a folha está sendo servida. */
                          style={{
                            '--arte': `url("${new URL(`${import.meta.env.BASE_URL}${arte}`, document.baseURI).href}")`,
                          }}
                        />
                      )}

                      {/* `relative` no rótulo e no visto: sem isso eles ficam
                          na mesma camada da arte, que é posicionada, e somem
                          atrás dela no hover. */}
                      <span className="relative font-display font-extrabold uppercase text-secao leading-none">
                        {rotulo}
                      </span>

                      {/* O visto, só no escolhido. Ele repete o que o anel já
                          diz — de propósito: anel é forma, visto é símbolo, e
                          quem não distingue um anel fino de uma borda ainda
                          reconhece um visto. Quem ouve recebe o `aria-checked`,
                          que não depende de nenhum dos dois. */}
                      {escolhido && (
                        <span aria-hidden="true" className="absolute right-5 top-1/2 -translate-y-1/2 z-[1]">
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

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
