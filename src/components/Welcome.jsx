import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MOLA_CALMA, useEhDesktop } from '../lib/motion.js'
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

   PARA ACRESCENTAR UMA: ponha os DOIS arquivos em `src/assets/capas/`. Não
   se escreve nada aqui — a lista É a pasta, lida na hora de compilar.
   Qualquer nome e qualquer formato que o navegador abra: a pasta guarda
   nomes, não um padrão de numeração, justamente para não obrigar ninguém a
   renomear arte.

   A versão de CELULAR é o mesmo nome com `-m` antes da extensão, igual ao
   par `divisoria` / `divisoria-m` do rodapé:

       moore.alan.jpg     ->   moore.alan-m.jpg
       hurlant.metal.jpg  ->   hurlant.metal-m.jpg

   Convenção, e não um par escrito à mão (`{d: ..., m: ...}`): o nome já diz
   o que o arquivo é, e um campo que nunca varia é um campo que só serve para
   ser esquecido.

   CAPA DE UM ARQUIVO SÓ TAMBÉM VALE, e não é descuido: há arte que só
   funciona deitada e arte que só funciona em pé. Quem tem só a de desktop
   não é oferecida ao celular, e quem tem só a `-m` não é oferecida ao
   computador — ver `capasDe()` logo abaixo.

   POR QUE EM `src/assets/` E NÃO EM `public/`. Site estático não responde
   "o que tem nessa pasta?": o que está em `public/` chega ao navegador como
   arquivos soltos, sem índice, então em tempo de execução não há como
   descobrir uma capa nova. Daria para gerar um manifesto e buscá-lo, mas ele
   seria uma requisição A MAIS *antes* de o navegador saber qual imagem pedir
   — e essa imagem é a coisa mais pesada e mais importante da tela. Lida na
   compilação, a lista já vem dentro do bundle, e o download da capa começa
   no primeiro render.

   `import.meta.glob` com `eager` NÃO embute imagem em JavaScript: ele troca
   cada arquivo por um endereço, uma linha de texto. Os bytes continuam indo
   inteiros para o `dist/`, sem reencodar, só ganhando um sufixo no nome — o
   que é de graça e ainda resolve um problema que `public/` tinha: trocar a
   arte mantendo o nome deixava quem já visitou vendo a antiga, de cache.

   A regra de ampliação vale para as duas versões — ver o comentário do
   `.welcome__imagem` no index.css.

   E só UM arquivo é baixado por visita, não a soma: nem as outras capas, nem
   a outra versão desta. Quem garante isso é o `<picture>` lá embaixo.
   ------------------------------------------------------------------ */

/* A pasta inteira, lida na compilação: a chave é o caminho do arquivo, e o
   valor é o endereço dele no site publicado.

   Os formatos estão listados um a um, e não como `*`, para a lista não
   engolir o `.psd` ou o `.txt` que alguém deixe ali junto da arte. */
const ARQUIVOS = import.meta.glob('../assets/capas/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/* O nome da versão de celular: `-m` ANTES da extensão.
   `lastIndexOf` e não `split('.')`: os nomes têm ponto no meio
   (`moore.alan.jpg`), e quebrar no primeiro ponto daria `moore-m.alan.jpg`. */
export function versaoCelular(nome) {
  const i = nome.lastIndexOf('.')
  return i < 0 ? nome + '-m' : nome.slice(0, i) + '-m' + nome.slice(i)
}

const ehVersaoCelular = (nome) => {
  const i = nome.lastIndexOf('.')
  return (i < 0 ? nome : nome.slice(0, i)).endsWith('-m')
}

/* O nome SEM o `-m`. É ele que identifica a capa, tenha ela as duas versões
   ou uma só — então `foo.jpg` e `foo-m.jpg` são a MESMA capa, e uma pasta com
   só o `-m` ainda tem uma capa chamada `foo.jpg`. */
function nomeBase(nome) {
  const i = nome.lastIndexOf('.')
  return i < 0 ? nome.slice(0, -2) : nome.slice(0, i - 2) + nome.slice(i)
}

/* A LISTA. Uma entrada por capa, com os dois endereços — e `null` no que
   faltar. Monta-se juntando os arquivos pelo nome base, e não procurando o
   par de cada um: assim o arquivo `-m` sozinho vira capa em vez de sumir.

   Ordenada por nome para o sorteio não depender da ordem em que o Vite
   devolveu os arquivos. */
export const CAPAS = (() => {
  const porNome = new Map()
  for (const caminho of Object.keys(ARQUIVOS).sort()) {
    const arquivo = caminho.slice(caminho.lastIndexOf('/') + 1)
    const celular = ehVersaoCelular(arquivo)
    const nome = celular ? nomeBase(arquivo) : arquivo
    const capa = porNome.get(nome) || { nome, d: null, m: null }
    capa[celular ? 'm' : 'd'] = ARQUIVOS[caminho]
    porNome.set(nome, capa)
  }
  return [...porNome.values()]
})()

/* QUEM ENTRA NO SORTEIO DESTA TELA.
 *
 * Capa sem `-m` não é oferecida ao celular; capa que só tem `-m` não é
 * oferecida ao computador. Cada arte aparece só onde cabe, porque esticar
 * estraga: uma foto de 377px de largura ocupando uma tela de 1920 chega a
 * cinco vezes o tamanho, e vira grão.
 *
 * O preço, dito em voz alta: telefone e computador sorteiam de conjuntos
 * DIFERENTES, e uma pasta só de arte deitada deixa o celular sem capa
 * nenhuma — papel com o logo, que é o fundo de poço de sempre. */
export const capasDe = (ehDesktop) => CAPAS.filter(c => (ehDesktop ? c.d : c.m))

/* O sorteio evita repetir a capa da visita anterior.
 *
 * "Cada vez que abrir, uma imagem diferente" — e sorteio puro repete. Com 3
 * capas, uma visita em cada 3 cairia na mesma de antes, e a promessa quebraria
 * logo na segunda abertura. Guardando a última, a seguinte sai sempre das
 * OUTRAS.
 *
 * O que fica guardado é o NOME do arquivo, não o endereço: o endereço ganha um
 * sufixo novo a cada compilação, e a memória da visita passada morreria em
 * toda publicação.
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
  const outras = lista.filter(c => c.nome !== anterior)
  return sorteia(outras.length ? outras : lista)
}

export default function Welcome({ onEntrar, aberturaNoAr = false }) {
  /* A capa da visita passada, lida UMA vez. Tem de ficar guardada: o efeito
     abaixo sobrescreve o registro assim que esta visita escolhe a sua, e o
     caminho de erro ainda vai precisar saber qual era. */
  const [anterior] = useState(lerAnterior)

  /* A largura decide de QUAL conjunto se sorteia. Lida uma vez, na montagem:
     o inicializador de `useState` só roda no primeiro render, então girar o
     telefone depois não refaz o sorteio — e não deve mesmo, a capa da visita
     já foi escolhida. */
  const ehDesktop = useEhDesktop()
  const [elegiveis] = useState(() => capasDe(ehDesktop))

  /* Sorteia UMA vez, na montagem. Em `useState` e não em variável de módulo
     porque módulo só roda uma vez por carregamento de página — e aí voltar
     para a abertura dentro da mesma sessão traria sempre a mesma capa. */
  const [capa, setCapa] = useState(() => escolherEntre(elegiveis, anterior))

  /* A gravação fica no efeito, não no sorteio: em modo estrito o React roda o
     inicializador de estado DUAS vezes e fica com o primeiro resultado. Se o
     sorteio gravasse, o registro guardaria a capa descartada — e a próxima
     visita evitaria a imagem errada. */
  useEffect(() => {
    if (!capa) return
    try { localStorage.setItem(CHAVE, capa.nome) } catch (e) { /* */ }
  }, [capa])

  /* Arquivo que não carregou cai fora — mas em DOIS degraus, porque há duas
   * perdas de tamanhos bem diferentes.
   *
   * 1. Quebrou a versão de CELULAR de uma capa que TEM as duas: fica a de
   *    desktop. Ela é mais pesada do que devia num telefone, e ainda assim é
   *    a capa certa — melhor que trocar a foto inteira porque um arquivo veio
   *    ruim. O `-m` AUSENTE nem chega aqui: a pasta é lida na compilação, e
   *    capa sem `-m` nem é oferecida ao celular. Este degrau cobre o arquivo
   *    que existe e não abre — upload truncado, arte corrompida.
   *
   * 2. Quebrou a capa mesmo: tenta outra. Acabando as capas, fica o papel com
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
    const arquivoCelular = capa.m ? capa.m.split('/').pop() : null
    /* `capa.d &&`: sem a de desktop não há para onde cair, e insistir deixaria
       a tela com a imagem quebrada. Aí vale o degrau 2. */
    if (capa.d && arquivoCelular && quebrou === arquivoCelular && !semCelular.has(capa.nome)) {
      setSemCelular(s => new Set(s).add(capa.nome))
      return
    }
    falharam.current.add(capa.nome)
    const restantes = elegiveis.filter(c => !falharam.current.has(c.nome))
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
        <picture key={capa.nome + (semCelular.has(capa.nome) ? '#d' : '')}>
          {/* O `<source>` só faz sentido quando existem AS DUAS: é ele que
              escolhe entre uma e outra. Com um arquivo só, a escolha já foi
              feita lá em cima, por `capasDe()`, e o que resta é mostrá-lo. */}
          {capa.d && capa.m && !semCelular.has(capa.nome) && (
            <source media="(max-width: 639.98px)" srcSet={capa.m} />
          )}
          <img
            src={capa.d || capa.m}
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
