/* OS TEMAS, em dados.
 *
 * Saiu de dentro do `Tema.jsx` quando o menu passou a mostrar as quatro cores
 * numa fileirinha de palitos ao lado da palavra "Tema". Dois lugares desenham
 * as mesmas quatro cores agora, e hex repetido em dois arquivos é hex que num
 * dia qualquer deixa de ser o mesmo — o palito do menu continuaria rosa depois
 * de o Candy virar outra coisa.
 *
 * As cores são o que o tema PARECE, não o que ele usa por dentro: um tema de
 * três cores mostra as três, um de uma mostra a cor cheia. Ficam cravadas em
 * hex de propósito — a amostra do Candy tem de ser rosa mesmo quando o site
 * está no Midnight, senão a lista inteira vira a mesma cor e a escolha deixa
 * de ser uma escolha. É o único lugar do projeto onde cor não sai de variável
 * CSS, e é por isso.
 *
 * `sobre` é a tinta do nome em cima da faixa, no pop-up. Escolhida por
 * contraste, não por gosto: #212121 sobre o rosa do Candy dá 6,15:1, e o papel
 * sobre o Midnight dá 16,3:1. Conferido com a mesma conta do WCAG que o resto
 * do projeto usa.
 */
/* `arte` é a ILUSTRAÇÃO DE HOVER de cada faixa, um arquivo em `public/`.
 *
 * Só o nome, sem barra na frente: o endereço sai de `BASE_URL + nome`, e
 * `/arte.webp` viraria `//arte.webp`, que o navegador lê como outro domínio.
 *
 * É OPCIONAL, e some sozinha: faixa sem `arte` não desenha camada nenhuma, e
 * arquivo que não existe não aparece — o navegador simplesmente não pinta um
 * `background-image` que deu 404, e fica a cor cheia de sempre. Dá para
 * acrescentar uma de cada vez sem o resto quebrar.
 *
 * As medidas e a área segura estão no comentário de `.faixa-arte`, no
 * index.css — junto do CSS que decide como a imagem é recortada, que é o que
 * define essas medidas.
 */
export const TEMAS = [
  { v: 'moss',     rotulo: 'Moss',     cores: ['#4B5D3A'],                        sobre: '#F4F0E6', arte: 'tema-moss.webp' },
  { v: 'nockout',  rotulo: 'Nockout',  cores: ['#FF5000'],                        sobre: '#212121', arte: 'tema-nockout.webp' },
  /* O CANDY EM REPOUSO É MENTA CHAPADA, não o degradê das três cores.
   *
   * Veio da própria ilustração: a arte de hover tem fundo menta, e a versão
   * de repouso que a acompanha também. Com o degradê embaixo, passar o mouse
   * trocaria rosa→damasco→menta por menta lisa com o pirulito — uma mudança
   * de fundo inteira em vez do gesto de a bala aparecer.
   *
   * O rosa e o damasco não somem do tema: voltam no redemoinho do pirulito,
   * que é onde as três cores do Candy se encontram de novo. E a tinta por
   * cima continua sendo ink, que sobre a menta dá 9,59:1.
   *
   * Para voltar ao degradê, é só devolver as três cores à lista. */
  { v: 'candy',    rotulo: 'Candy',    cores: ['#B5CDC5'],                        sobre: '#212121', arte: 'tema-candy.webp' },
  { v: 'midnight', rotulo: 'Midnight', cores: ['#280137'],                        sobre: '#F3F1F6', arte: 'tema-midnight.webp' },
]

/* A cor que REPRESENTA o tema quando só cabe uma.
 *
 * O palito do menu tem 3px de largura; não há como mostrar o degradê de três
 * cores do Candy ali dentro. A primeira da lista é a cor principal de cada
 * tema — a que dá nome ao conjunto —, então é ela que vai. */
export const corPrincipal = (tema) => tema.cores[0]
