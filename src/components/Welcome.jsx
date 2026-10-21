import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MOLA_CALMA } from '../lib/motion.js'
import Marca from './Marca.jsx'

/* Página de boas-vindas: a capa da gibiteca.
 *
 * Uma imagem grande ocupando a tela, o logo grande um pouco abaixo do topo, e
 * um botão no rodapé que leva à porta de entrada.
 *
 * NÃO há cabeçalho aqui. O logo é o MESMO elemento do logo da barra aos olhos
 * do framer-motion — os dois carregam `layoutId="marca"` —, então ao entrar na
 * coleção a marca viaja daqui até a barra encolhendo, em vez de uma sumir e
 * outra aparecer. Quem garante que os dois nunca coexistem é o ternário do
 * App: dois elementos com o mesmo layoutId ao mesmo tempo quebram a animação.
 *
 * `aberturaNoAr` existe pelo mesmo motivo: enquanto a tela de abertura está no
 * ar, ela é quem desenha a marca, e esta precisa ficar calada.
 */

/* ------------------------------------------------------------------
   AS CAPAS. Uma por visita, sorteada.

   PARA ACRESCENTAR UMA: ponha os DOIS arquivos em `public/` e escreva aqui
   só o nome da versão de DESKTOP. Qualquer nome e qualquer formato que o
   navegador abra — a lista guarda nomes, não um padrão de numeração,
   justamente para não obrigar ninguém a renomear arte.

   A versão de CELULAR não se escreve: ela é o mesmo nome com `-m` antes da
   extensão, igual ao par `divisoria` / `divisoria-m` do rodapé.

       moore.alan.jpg   ->   moore.alan-m.jpg
       hurlant.metal.jpg ->  hurlant.metal-m.jpg

   Convenção, e não um par escrito à mão (`{d: ..., m: ...}`), porque cada
   capa TEM as duas versões — e um campo que nunca varia é um campo que só
   serve para ser esquecido. O preço: o arquivo `-m` precisa existir mesmo,
   ou no celular aquela capa falha e outra entra no lugar.

   NOME SEM BARRA NO COMEÇO. O endereço sai de `BASE_URL + nome`, e `/foto.jpg`
   viraria `//foto.jpg`, que o navegador lê como outro domínio. Subpasta pode:
   `capas/foto.jpg` acha `public/capas/foto.jpg`.

   Por que uma lista no código, e não um arquivo de manifesto em `public/`
   que desse para editar direto no GitHub sem recompilar: o manifesto seria
   uma requisição A MAIS *antes* de o navegador saber qual imagem buscar, e
   essa imagem é a coisa mais pesada e mais importante da tela. A lista vem
   junto do bundle, então o download da capa começa no primeiro render.

   A qualidade não muda em nada: cada arquivo continua indo de `public/` para
   o `dist/` byte a byte, sem reencodar. A regra de ampliação vale para as
   duas versões — ver o comentário do `.welcome__imagem` no index.css.

   E só UM arquivo é baixado por visita, não a soma: nem as outras capas, nem
   a outra versão desta. Quem garante isso é o `<picture>` lá embaixo.
   ------------------------------------------------------------------ */
export const CAPAS = [
  'moore.alan.jpg',
  'hurlant.metal.jpg',
  'ale.jodo.jpg',
  'tezuka.osamu.jpg',
  'sousa.mauricio.jpg',
]

/* O nome da versão de celular: `-m` ANTES da extensão.
   `lastIndexOf` e não `split('.')`: os nomes têm ponto no meio
   (`moore.alan.jpg`), e quebrar no primeiro ponto daria `moore-m.alan.jpg`. */
export function versaoCelular(nome) {
  const i = nome.lastIndexOf('.')
  return i < 0 ? nome + '-m' : nome.slice(0, i) + '-m' + nome.slice(i)
}

/* O sorteio evita repetir a capa da visita anterior.
 *
 * "Cada vez que abrir, uma imagem diferente" — e sorteio puro repete. Com 3
 * capas, uma visita em cada 3 cairia na mesma de antes, e a promessa quebraria
 * logo na segunda abertura. Guardando a última, a seguinte sai sempre das
 * OUTRAS.
 *
 * Isso é memória de navegador, não de usuário: é por aparelho, e some se a
 * pessoa limpar os dados. Perder essa memória não quebra nada — volta a ser
 * sorteio puro por uma visita.
 */
const CHAVE = 'gibiteca_capa'

const sorteia = (lista) => lista[Math.floor(Math.random() * lista.length)]

function lerAnterior() {
  try { return localStorage.getItem(CHAVE) } catch (e) { return null }  // navegador sem storage
}

/* Sorteia dentro de `lista` fugindo de `anterior`.
 *
 * Está separado porque DOIS caminhos precisam da mesma regra: o sorteio da
 * abertura e a troca por falha de arquivo. Quando só a abertura obedecia,
 * uma capa inexistente na lista fazia a substituta ser sorteada do zero — e
 * ela caía na capa da visita passada com frequência de 1 em N. Apareceu num
 * teste de 14 aberturas: a mesma capa duas vezes seguidas.
 *
 * `anterior` fora da lista (ou lista de um item só) não trava nada: aí o
 * sorteio volta a ser entre todas, porque repetir é melhor que não mostrar
 * capa nenhuma. */
function escolherEntre(lista, anterior) {
  if (lista.length < 2) return lista[0] || null
  const outras = lista.filter(c => c !== anterior)
  return sorteia(outras.length ? outras : lista)
}

export default function Welcome({ onEntrar, aberturaNoAr = false }) {
  /* A capa da visita passada, lida UMA vez. Tem de ficar guardada: o efeito
     abaixo sobrescreve o registro assim que esta visita escolhe a sua, e o
     caminho de erro ainda vai precisar saber qual era. */
  const [anterior] = useState(lerAnterior)

  /* Sorteia UMA vez, na montagem. Em `useState` e não em variável de módulo
     porque módulo só roda uma vez por carregamento de página — e aí voltar
     para a abertura dentro da mesma sessão traria sempre a mesma capa. */
  const [capa, setCapa] = useState(() => escolherEntre(CAPAS, anterior))

  /* A gravação fica no efeito, não no sorteio: em modo estrito o React roda o
     inicializador de estado DUAS vezes e fica com o primeiro resultado. Se o
     sorteio gravasse, o registro guardaria a capa descartada — e a próxima
     visita evitaria a imagem errada. */
  useEffect(() => {
    if (!capa) return
    try { localStorage.setItem(CHAVE, capa) } catch (e) { /* */ }
  }, [capa])

  /* Arquivo que não carregou cai fora — mas em DOIS degraus, porque há duas
   * perdas de tamanhos bem diferentes.
   *
   * 1. Faltou só a versão de CELULAR (`-m`): fica a de desktop. Ela é mais
   *    pesada do que devia num telefone, e ainda assim é a capa certa —
   *    melhor que trocar a foto inteira porque um arquivo não subiu. É o
   *    estado normal enquanto as versões de celular não existem.
   *
   * 2. Faltou a capa mesmo: tenta outra. Acabando as capas, fica o papel com
   *    o logo — melhor que um ícone de imagem quebrada em tela cheia.
   *
   * Quem diz QUAL arquivo falhou é o `currentSrc`: ele traz o endereço que o
   * `<picture>` escolheu de verdade, que no celular não é o `src`.
   *
   * O conjunto de capas sem celular fica em ESTADO, não em ref: ele muda o
   * que se desenha (o `<source>` some). Já o de capas mortas fica em ref —
   * esse não desenha nada, e em estado só custaria um render a mais. */
  const falharam = useRef(new Set())
  const [semCelular, setSemCelular] = useState(() => new Set())

  const aoFalhar = (e) => {
    const quebrou = (e.target.currentSrc || '').split('/').pop()
    if (quebrou === versaoCelular(capa) && !semCelular.has(capa)) {
      setSemCelular(s => new Set(s).add(capa))
      return
    }
    falharam.current.add(capa)
    const restantes = CAPAS.filter(c => !falharam.current.has(c))
    setCapa(escolherEntre(restantes, anterior))
  }

  return (
    <main className="welcome">
      {/* `<picture>` e não duas imagens com CSS escondendo uma: assim o
          navegador baixa SÓ o arquivo que casa com a consulta de mídia.
          Escondendo por CSS, os dois viriam — e aqui cada um é uma foto
          inteira.

          O corte é 640px, o mesmo do `sm:` do Tailwind, do `useEhDesktop()`
          e da divisória do rodapé.

          A `key` fica no `<picture>`, não no `<img>`: trocando de capa é o
          par inteiro que muda, e reaproveitar o elemento faria o navegador
          decidir a fonte uma vez só.

          O `object-fit` continua valendo: quem recebe a classe é o `<img>`, e
          ele é `position: absolute` — se ancora no `.welcome`, não no
          `<picture>`, que fica solto no meio sem atrapalhar. */}
      {capa && (
        /* A `key` carrega o degrau junto do nome. Trocar só os filhos do
           `<picture>` não faria o navegador escolher a fonte de novo — essa
           decisão é tomada uma vez, quando o elemento nasce. Mudando a chave,
           nasce outro. */
        <picture key={capa + (semCelular.has(capa) ? '#d' : '')}>
          {!semCelular.has(capa) && (
            <source media="(max-width: 639.98px)" srcSet={`${import.meta.env.BASE_URL}${versaoCelular(capa)}`} />
          )}
          <img
            src={`${import.meta.env.BASE_URL}${capa}`}
            alt=""
            aria-hidden="true"
            className="welcome__imagem"
            onError={aoFalhar}
          />
        </picture>
      )}

      {/* O logo fica abaixo do topo de propósito: é daqui que ele sobe até a
          barra. Começar colado no alto tornaria a viagem quase imperceptível,
          e é justamente o deslocamento que conta a história. */}
      <div className="welcome__marca">
        {!aberturaNoAr && (
          <motion.span layoutId="marca" transition={MOLA_CALMA} className="relative inline-flex">
            <Marca className="w-[min(78vw,420px)] h-auto" />
          </motion.span>
        )}
      </div>

      {/* Sem véu atrás do botão: a imagem chega limpa até a borda de baixo. */}
      <div className="welcome__rodape">
        {/* Só o texto, sem o disco da seta. O `.cta` nasceu com padding
            assimétrico (bastante à esquerda, pouco à direita) justamente para
            abrigar esse disco; sem ele o botão ficaria torto, e o
            `.welcome__botao` devolve a simetria.

            O texto fica em caixa alta por CSS e não escrito em maiúsculas:
            assim o nome acessível continua "Entrar", do jeito que se
            fala. */}
        <button type="button" className="cta cta-carimbo welcome__botao" onClick={onEntrar}>
          Entrar
        </button>
      </div>
    </main>
  )
}
