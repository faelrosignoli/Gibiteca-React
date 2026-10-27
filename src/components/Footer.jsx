import MarcaRodape from './MarcaRodape.jsx'
import { FichaPrevia } from './FichaAtividades.jsx'

/* O RODAPÉ — duas colunas e nada entre elas.
 *
 * Sem margem e sem borda no topo: quem separa agora é a Divisória, que encosta
 * aqui. Os dois juntos davam um vão de 44px mais um fio, e como o pé da
 * ilustração é escuro, a fresta clara aparecia.
 *
 * `.rodape` pinta a faixa de #212121 e VIRA A TINTA DO AVESSO numa linha só —
 * a explicação inteira está no index.css. Nenhuma classe daqui muda por causa
 * disso: `text-ink-faint` continua sendo `text-ink-faint`, e é o contexto que
 * diz o que isso significa sobre fundo escuro.
 *
 * ---- O QUE SAIU, E POR QUÊ ----
 *
 * OS TRÊS NÚMEROS (obras · séries/boxes · na estante). Eles já moram no painel
 * de Estatísticas, que existe para isso. Aqui eram um resumo de um resumo, e
 * disputavam a atenção com a ficha — o rodapé ficava com dois centros.
 *
 * O FIO PONTILHADO que atravessava o meio. Ele separava a assinatura da linha
 * de copyright; com o copyright debaixo da frase, não há mais duas coisas para
 * separar, e um fio que não divide nada é só um risco.
 *
 * O "VOLTAR AO TOPO" ESCRITO. Virou a meia-lua colada no fim da página — ver
 * abaixo.
 */
export default function Footer({ onAbrirFicha, fichaAberta }) {
  return (
    <footer className="rodape relative">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-14 pt-10 pb-24">
        <div className="flex flex-wrap justify-between gap-10 items-start">

          {/* ESQUERDA: a assinatura.
              O logo no lugar do "A Gibiteca" escrito: os dois diziam a mesma
              coisa, e a marca diz melhor. Sem `layoutId` aqui — ele pertence
              ao par capa↔barra, e um terceiro com o mesmo id quebraria a
              viagem do logo. O `MarcaRodape` já traz `role="img"` com nome
              acessível, então o rodapé não perde o texto para quem ouve.

              É A MARCA CHAPADA, e não a do cabeçalho. Aquela vive de duas
              camadas — a sombra deslocada atrás das letras vazadas —, e isso
              existe porque a barra do topo inverte a tinta ao rolar. Aqui o
              fundo é escuro o tempo todo, e sombra sobre escuro é borrão.

              GRANDE: 220px contra os 150 de antes. Com os números fora, esta
              coluna ficou com três linhas de texto para encher a mesma altura
              da ficha ao lado — e assinatura pequena ao lado de um cartão
              cheio faz o cartão parecer o assunto do rodapé. */}
          <div className="max-w-[460px]">
            <MarcaRodape className="w-[220px] max-w-full h-auto mb-4" />
            <p className="text-ink-soft text-corpo leading-relaxed">
              Sua organização pessoal, pra nunca perder o fio da meada.
            </p>
            {/* O copyright subiu para cá, debaixo da frase: as duas são a mesma
                voz — quem fez e o que é. Separados por um fio na outra ponta do
                rodapé, pareciam assuntos diferentes. */}
            <p className="mt-3 text-apoio text-ink-faint">
              © {new Date().getFullYear()} · Gibiteca · feito com 📚 e 🚬
            </p>
          </div>

          {/* DIREITA: a ficha de atividades, e nada mais. */}
          <FichaPrevia onAbrir={onAbrirFicha} aberta={fichaAberta} />
        </div>
      </div>

      <BotaoTopo />
    </footer>
  )
}

/* A MEIA-LUA DO FIM DA PÁGINA.
 *
 * Colada na borda de baixo, centrada, com a seta dentro. Era uma pílula escrita
 * "Voltar ao topo ↑" numa linha própria; virou ícone porque a seta para cima no
 * pé de uma página é das poucas convenções que não precisam de legenda — e
 * porque a linha que a segurava deixou de existir.
 *
 * A FORMA RIMA COM O RECORTE DO BOLSO da ficha, logo acima: a mesma meia-lua,
 * o mesmo gesto de puxar. Ali ela é o vazio por onde o cartão sai; aqui é a
 * aba por onde a página volta. Duas metades do mesmo vocabulário, e por isso a
 * segunda não precisa se explicar.
 *
 * `tinta-normal` porque ela é uma peça de PAPEL sobre a faixa escura, como o
 * cartão: sem isso, `text-ink` ali dentro seria claro e a seta sumiria no
 * próprio fundo claro da aba.
 *
 * Fica no rodapé, e não presa à viewport: botão flutuante acompanharia a
 * rolagem e brigaria com o "Nova obra", que já mora no canto. Aqui ela é o fim
 * do documento — você chega nela, não esbarra nela.
 */
function BotaoTopo() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Voltar ao topo"
      aria-label="Voltar ao topo"
      className="tinta-normal group absolute left-1/2 -translate-x-1/2 bottom-0
                 w-[68px] h-[34px] rounded-t-full bg-paper text-ink
                 inline-flex items-start justify-center pt-2
                 transition-[height,padding] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
                 hover:h-[40px] hover:pt-2.5
                 outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                 focus-visible:ring-offset-[#212121] focus-visible:ring-paper"
    >
      {/* A seta sobe junto com a aba no hover: o botão inteiro faz o gesto que
          a ação faz. Nada roda em laço — tem início, fim e motivo. */}
      <svg className="w-[18px] h-[18px] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}
