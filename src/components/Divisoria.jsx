/* A faixa ilustrada que separa a paginação do rodapé.
 *
 * Fica num <img>, e não inline como a Marca, por peso: inline, a arte entraria
 * no bundle de JS e pesaria mais do que a divisória vale. Em <img> o navegador
 * busca o arquivo uma vez, guarda em cache e nunca passa pelo JS.
 *
 * NÃO DEPENDE DE TEMA. A arte é a mesma no Moss e no Nockout — decisão de
 * desenho. Antes havia quatro arquivos (tema × largura) e um `useStore()` aqui
 * só para escolher entre eles; com a arte única sobraram dois arquivos, e o
 * componente deixou de ler o store.
 *
 * A LARGURA vem de um <picture>, e não de um hook de viewport, porque o
 * navegador resolve isso melhor: ele baixa só a fonte que casa com a media
 * query — um hook montaria o <img> depois do primeiro render, e trocar o `src`
 * no resize já teria baixado o arquivo errado antes.
 *
 * O corte é 640px, o mesmo do `sm:` do Tailwind e do useEhDesktop().
 *
 * BASE_URL, não "/": o build sai com base relativa para rodar em subpasta
 * (GitHub Pages), e um caminho absoluto quebraria lá.
 *
 * aria-hidden + alt vazio: é enfeite. Não há informação aqui que um leitor de
 * tela perca, e anunciar "imagem" no fim de cada página só atrapalha.
 */
const BASE = `${import.meta.env.BASE_URL}divisoria`

export default function Divisoria() {
  return (
    <div className="divisoria mt-11" aria-hidden="true">
      <picture>
        <source media="(max-width: 639.98px)" srcSet={`${BASE}-m.svg`} />
        <img src={`${BASE}.svg`} alt="" />
      </picture>
    </div>
  )
}
