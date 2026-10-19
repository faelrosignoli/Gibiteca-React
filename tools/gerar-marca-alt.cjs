/* Gera MarcaAlt.jsx a partir das artes alternativas — uma por tema.
 *
 *   node tools/gerar-marca-alt.cjs
 *
 * Todas as artes ficam no MESMO componente e todas vão para o DOM: quem
 * escolhe qual aparece é o CSS (`[data-tema]`), não o React — assim trocar de
 * tema repinta na hora, sem esperar redesenho.
 *
 * PARA ACRESCENTAR UM TEMA: ponha `src/assets/marca-alt-<tema>.svg`, escreva o
 * nome em TEMAS aqui embaixo, e acrescente a regra de visibilidade no
 * index.css (procure por `.alt-`). São os três lugares, e nenhum componente
 * precisa saber do assunto.
 *
 * DUAS EXIGÊNCIAS SOBRE A ARTE:
 *
 * 1. TEXTO EM CURVAS. Com texto vivo o navegador troca a fonte por uma do
 *    sistema, e em máquina sem a família certa vira quadradinho. O script
 *    recusa o arquivo em vez de gerar algo que só funciona na máquina de quem
 *    exportou.
 *
 * 2. viewBox COLADO NA TINTA. A arte é desenhada dentro de uma prancha grande
 *    (4000×1080 nos exports atuais), e guardar essa prancha faria a marca
 *    aparecer pequena no meio de um vão — ela preenche a caixa do logo, e o
 *    vão entra na conta. O script AVISA quando a prancha parece folgada, mas
 *    não corrige: corrigir pediria um interpretador de `path`, e o número
 *    certo sai em um comando no navegador:
 *
 *      const g = document.querySelector('svg g');  g.getBBox()
 *
 *    ou, para medir um arquivo direto:
 *
 *      fetch('/src/assets/marca-alt-X.svg').then(r=>r.text()).then(t=>{ ... })
 *
 *    Foi assim que saíram os valores do candy e do midnight.
 */
const fs = require('fs')
const R = __dirname + '/../'

/* A ordem aqui é a ordem no DOM, e não importa: só uma fica visível. */
const TEMAS = ['moss', 'nockout', 'candy', 'midnight']

/* Prancha “folgada”: a arte ocupa menos que esta fração da largura OU da
   altura do viewBox. 0.9 porque um contorno justo encosta nas quatro bordas
   por definição — qualquer folga real cai bem abaixo disso. */
const FOLGA = 0.9

function corpo(tema) {
  const arq = 'marca-alt-' + tema + '.svg'
  const caminho = R + 'src/assets/' + arq
  if (!fs.existsSync(caminho)) throw new Error('falta src/assets/' + arq)
  const svg = fs.readFileSync(caminho, 'utf8')

  if (/<text[\s>]/.test(svg)) {
    throw new Error(arq + ' ainda tem <text>: reexporte com o texto convertido em curvas.')
  }

  const d = [...svg.matchAll(/<path[^>]*?\sd="([^"]+)"\s*\/?>/g)].map(m => m[1])
  if (!d.length) throw new Error('nenhum <path> em ' + arq)

  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1]
  if (!vb) throw new Error(arq + ' sem viewBox')

  /* Aviso de prancha folgada. A conta é grosseira de propósito — ela só
     pergunta "este viewBox parece a prancha inteira do editor?", e a prancha
     é sempre um número redondo grande começando em 0 0. */
  const [x, y, w, h] = vb.trim().split(/\s+/).map(Number)
  if (x === 0 && y === 0 && w >= 1000 && h >= 1000) {
    console.warn('  AVISO (' + arq + '): viewBox "' + vb + '" parece a prancha inteira, não o\n' +
                 '         contorno da arte. A marca vai aparecer pequena, com vão em volta.\n' +
                 '         Meça com getBBox() no navegador e grave o contorno justo.')
  }

  return { tema, vb, qtd: d.length, jsx: d.map(x => '        <path d="' + x + '" />').join('\n') }
}

const artes = TEMAS.map(corpo)

const svgs = artes.map(a =>
`      <svg viewBox="${a.vb}" className={\`marca-alt alt-${a.tema} \${className}\`} aria-hidden="true" focusable="false">
${a.jsx}
      </svg>`).join('\n')

const arquivo =
`/* A segunda marca — a que aparece no hover do logo.
 *
 * Uma arte por tema, TODAS no DOM. Quem mostra a do tema em uso e esconde as
 * outras é o CSS (\`[data-tema]\`), não o React: trocar de tema repinta na
 * hora, sem esperar redesenho, do mesmo jeito que as tintas e o acento.
 *
 * A troca no hover também é CSS puro (\`.grupo-marca:hover\`) — não há estado
 * de React nenhum aqui. Hover é o tipo de coisa que o navegador já resolve, e
 * passar isso por \`useState\` só adicionaria renderização a cada passada de
 * mouse sobre o cabeçalho.
 *
 * Cada viewBox é o CONTORNO da arte, não a prancha do editor: a marca
 * preenche a caixa do logo, e vão guardado no viewBox vira vão na tela.
 *
 * Gerado por tools/gerar-marca-alt.cjs a partir de src/assets/marca-alt-*.svg.
 * Para trocar a arte, substitua o SVG e rode o script — não edite os caminhos
 * aqui à mão.
 */
export default function MarcaAlt({ className = '' }) {
  return (
    <>
${svgs}
    </>
  )
}
`

fs.writeFileSync(R + 'src/components/MarcaAlt.jsx', arquivo.replace(/\n/g, '\r\n'))
console.log('MarcaAlt.jsx gerado:')
artes.forEach(a => console.log('  ' + a.tema.padEnd(10) + a.qtd + ' paths   viewBox ' + a.vb))
