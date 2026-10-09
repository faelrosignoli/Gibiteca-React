import { useStore } from '../lib/store.jsx'

/* A faixa ilustrada que separa a paginação do rodapé.
 *
 * Fica num <img>, e não inline como a Marca, por peso: o Nockout sozinho são
 * ~50 kB de paths. Inline, as artes entrariam no bundle de JS e pesariam mais
 * que a divisória inteira vale. Em <img> o navegador busca só a que vai usar,
 * guarda em cache e nunca passa pelo JS.
 *
 * O TEMA vem do store, porque só o React sabe dele. A LARGURA vem de um
 * <picture>, e não de um hook de viewport, porque o navegador resolve isso
 * melhor: ele baixa só a fonte que casa com a media query — um hook montaria
 * o <img> depois do primeiro render, e trocar o `src` no resize já teria
 * baixado o arquivo errado antes.
 *
 * O corte é 640px, o mesmo do `sm:` do Tailwind e do useEhDesktop().
 *
 * O par -m SEMPRE existe: quando não há arte própria de celular, o gerador
 * escreve uma cópia. Por isso aqui não há condicional — não dá para o
 * <source> apontar para um arquivo que não está lá.
 *
 * BASE_URL, não "/": o build sai com base relativa para rodar em subpasta
 * (GitHub Pages), e um caminho absoluto quebraria lá.
 *
 * aria-hidden + alt vazio: é enfeite. Não há informação aqui que um leitor de
 * tela perca, e anunciar "imagem" no fim de cada página só atrapalha.
 */
export default function Divisoria() {
  const { tema } = useStore()
  const base = `${import.meta.env.BASE_URL}ilustra-${tema}`
  return (
    <div className="divisoria mt-11" aria-hidden="true">
      <picture>
        <source media="(max-width: 639.98px)" srcSet={`${base}-m.svg`} />
        <img src={`${base}.svg`} alt="" />
      </picture>
    </div>
  )
}
