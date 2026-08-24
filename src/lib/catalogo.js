/* Guia dos Quadrinhos — o melhor acervo de HQ brasileira, e o único lugar onde
 * a editora da edição nacional está certa.
 *
 * NÃO dá para consultar por código, e não por escolha nossa. Verificado com
 * `curl` no domínio:
 *
 *   - responde 403 com `Cf-Mitigated: challenge` — desafio anti-bot da
 *     Cloudflare na frente do site inteiro
 *   - manda `Cross-Origin-Resource-Policy: same-origin` e não manda
 *     `Access-Control-Allow-Origin`: CORS fechado de propósito
 *   - o robots.txt veta por nome: `User-agent: ClaudeBot` -> `Disallow: /`
 *
 * Ou seja: nem dá para acessar, nem se deve. Passar pelo desafio da Cloudflare
 * seria burlar detecção de bot. Não fazer, nem para "só conferir uma URL".
 *
 * Então o app leva a PESSOA até lá — o navegador dela abrindo um site público,
 * que é uso normal e não tem relação com a regra de robô.
 *
 * Houve aqui uma busca automática no Open Library. Saiu a pedido: trazia
 * título e autores, mas errava a editora — agrega todas as edições de uma obra
 * e devolve a original ("Dark Horse" para Funny Creek), justamente o dado que
 * faltava. Não reintroduzir sem pedido.
 */

const GUIA = 'https://www.guiadosquadrinhos.com'

/* Endereço da BUSCA do Guia para um termo.
 *
 * O padrão veio de dois exemplos reais, tirados da barra de pesquisa do site:
 *
 *   "conan"          ->  /titulos/conan
 *   "conan cimério"  ->  /titulos/conan%20cim%C3%A9rio
 *
 * Repare que /titulos/ recebe o termo CRU, só percent-encoded: espaço vira
 * %20 e o acento é preservado em UTF-8. Não é um apelido gerado pelo site —
 * é a busca dele. Por isso `encodeURIComponent` e não `slugify`: transformar
 * em "conan-cimerio" mandaria um termo que a pessoa não digitou.
 *
 * Sendo busca e não ficha fixa, título parcial funciona e não há risco de
 * cair num 404 por apelido divergente.
 *
 * O termo vai exatamente como foi escrito no campo de título — inclusive
 * pontuação. É o que se espera de "pesquisar o que eu escrevi".
 */
export function linkDoGuia(termo) {
  const t = (termo || '').toString().trim()
  if (!t) return GUIA
  return GUIA + '/titulos/' + encodeURIComponent(t)
}
