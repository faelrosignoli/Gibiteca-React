/* Gera MarcaRodape.jsx a partir de src/assets/logo-rodape.svg.
 *
 *   node tools/gerar-marca-rodape.cjs
 *
 * POR QUE UMA SEGUNDA MARCA, e não a mesma com outra classe:
 *
 * A `Marca` do cabeçalho tem DUAS camadas — a sombra deslocada atrás e as
 * letras vazadas na frente —, e é disso que ela vive: a barra do topo inverte
 * a tinta ao rolar e cada camada troca de cor por conta própria. O rodapé não
 * tem esse jogo. Ali a faixa é escura o tempo todo, e a sombra de uma marca
 * que já está sobre o escuro vira um borrão atrás das letras.
 *
 * Esta versão é CHAPADA: um desenho só, de uma cor só. É a arte oficial
 * entregue para esse uso, e o componente existe para ela ter um lugar em vez
 * de virar um `if` dentro da outra marca.
 *
 * A COR vem do CSS (`.marca-rodape`, no index.css), que a prende a
 * `rgb(var(--tinta))`. No rodapé a tinta está invertida — `.rodape` define
 * `--tinta: var(--paper)` —, então a marca sai cor de papel sem este arquivo
 * saber de rodapé nenhum. Posta em qualquer outro lugar, ela sai na tinta
 * daquele lugar.
 *
 * O viewBox é o CONTORNO da arte, não a prancha de 4000x1080 do editor: vão
 * guardado no viewBox vira vão na tela, e a marca apareceria pequena dentro
 * da própria caixa. O numero sai de `svg.getBBox()` no navegador — o mesmo
 * caminho descrito no gerar-marca-alt.cjs.
 */
const fs = require('fs')
const R = __dirname + '/../'
const ARQ = 'src/assets/logo-rodape.svg'

const svg = fs.readFileSync(R + ARQ, 'utf8')

if (/<text[\s>]/.test(svg)) {
  throw new Error(ARQ + ' ainda tem <text>: reexporte com o texto convertido em curvas.')
}

const d = [...svg.matchAll(/<path[^>]*?\sd="([^"]+)"\s*\/?>/g)].map(m => m[1])
if (!d.length) throw new Error('nenhum <path> em ' + ARQ)

const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1]
if (!vb) throw new Error(ARQ + ' sem viewBox')

const [x, y, w, h] = vb.trim().split(/\s+/).map(Number)
if (x === 0 && y === 0 && w >= 1000 && h >= 1000) {
  console.warn('  AVISO: viewBox "' + vb + '" parece a prancha inteira, não o contorno\n' +
               '         da arte. Meça com getBBox() no navegador e grave o contorno justo.')
}

const arquivo =
`/* A marca CHAPADA — a versão oficial que o rodapé usa.
 *
 * Uma camada só, de uma cor só. A \`Marca\` do cabeçalho tem sombra deslocada
 * atrás das letras, e sobre a faixa escura do rodapé essa sombra vira borrão.
 *
 * A cor vem do CSS (\`.marca-rodape\`), presa a \`rgb(var(--tinta))\`: no
 * rodapé a tinta está invertida, então a marca sai cor de papel sem este
 * arquivo saber onde está.
 *
 * Gerado por tools/gerar-marca-rodape.cjs a partir de src/assets/logo-rodape.svg.
 * Para trocar a arte, substitua o SVG e rode o script — não edite os \`d\` aqui.
 */
export default function MarcaRodape({ className = '' }) {
  return (
    <svg
      viewBox="${vb}"
      className={\`marca-rodape \${className}\`}
      role="img"
      aria-label="Minha Gibiteca"
      focusable="false"
    >
${d.map(p => '      <path d="' + p + '" />').join('\n')}
    </svg>
  )
}
`

fs.writeFileSync(R + 'src/components/MarcaRodape.jsx', arquivo.replace(/\n/g, '\r\n'))
console.log('MarcaRodape.jsx gerado: ' + d.length + ' paths   viewBox ' + vb)
