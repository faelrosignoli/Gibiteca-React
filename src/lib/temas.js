/* OS TEMAS, em dados.
 *
 * Saiu de dentro do `Tema.jsx` para ser a fonte única dos quatro hex. Hex
 * repetido em dois arquivos é hex que num dia qualquer deixa de ser o mesmo.
 *
 * AS CORES SÃO AS DAS ILUSTRAÇÕES, medidas dos arquivos, não escolhidas à
 * parte. É isto que faz a animação de hover funcionar: a arte tem o mesmo
 * fundo chapado da faixa, então enquanto ela gira a cunha que sobra descobre
 * exatamente a mesma cor. Mexer num hex daqui sem mexer na arte faz aparecer
 * um retângulo girando dentro da faixa.
 *
 * Ficam cravadas em hex, e não em variável CSS, de propósito: a amostra do
 * Candy tem de ser menta mesmo quando o site está no Midnight, senão a lista
 * inteira vira a mesma cor e a escolha deixa de ser uma escolha. É o único
 * lugar do projeto onde cor não sai de variável CSS, e é por isso.
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
 * Quem monta o endereço (`Tema.jsx`) ainda o torna ABSOLUTO antes de pôr na
 * variável CSS — caminho relativo dentro de `url()` numa custom property é
 * resolvido contra a folha de estilo, não contra o documento, e publicado isso
 * aponta para dentro de `/assets/`. A explicação inteira está lá.
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
   * DECIDIDO, não provisório: o #B5CDC5 foi lido do pixel do arquivo, e é o
   * mesmo nas duas partes da ilustração. Devolver as três cores à lista aqui
   * quebraria o giro — a arte continuaria menta e a faixa viraria degradê. */
  { v: 'candy',    rotulo: 'Candy',    cores: ['#B5CDC5'],                        sobre: '#212121', arte: 'tema-candy.webp' },
  { v: 'midnight', rotulo: 'Midnight', cores: ['#280137'],                        sobre: '#F3F1F6', arte: 'tema-midnight.webp' },
]
