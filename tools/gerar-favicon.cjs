/* Gera public/favicon.svg a partir de src/assets/icone.svg.
 *
 *   node tools/gerar-favicon.cjs
 *
 * O arquivo do editor vem numa prancha de 1080x1080 com a arte centrada e
 * folga em volta. Num favicon de 16px essa folga é perda direta de
 * legibilidade: o desenho encolhe para caber num vão que ninguem ve.
 *
 * Então o script aperta a CAIXA na arte. Ele recebe o contorno medido no
 * navegador (`svg.getBBox()`) e monta um QUADRADO centrado nele — quadrado
 * porque o favicon é exibido em caixa quadrada, e um viewBox retangular
 * deixaria o navegador decidir o enquadramento.
 *
 * A COR não vem do tema do site: o favicon vive na aba do navegador, e quem
 * manda ali é o esquema do SISTEMA. Tinta sobre aba clara, creme sobre aba
 * escura, via `prefers-color-scheme` dentro do próprio SVG.
 */
const fs = require('fs')
const R = __dirname + '/../'

/* Contorno da arte, medido no navegador com svg.getBBox() sobre
   src/assets/icone.svg. Trocou a arte? Meça de novo e troque aqui. */
const BBOX = { x: 50.02, y: 50.02, w: 979.95, h: 979.95 }

const svg = fs.readFileSync(R + 'src/assets/icone.svg', 'utf8')
const d = [...svg.matchAll(/<path[^>]*?\sd="([^"]+)"\s*\/?>/g)].map(m => m[1])
if (!d.length) throw new Error('nenhum <path> em src/assets/icone.svg')

/* O quadrado: o lado é a maior dimensão da arte, centrado no centro dela. */
const lado = Math.max(BBOX.w, BBOX.h)
const cx = BBOX.x + BBOX.w / 2
const cy = BBOX.y + BBOX.h / 2
const n = v => +v.toFixed(2)
const vb = [n(cx - lado / 2), n(cy - lado / 2), n(lado), n(lado)].join(' ')

const arquivo =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">
  <!-- Caixa apertada na arte: o original vem em 0 0 1080 1080 com folga em
       volta, e num favicon de 16px essa folga vira perda de legibilidade.
       O quadrado tem o lado da maior dimensão do desenho (${n(lado)}) e fica
       centrado nele. Gerado por tools/gerar-favicon.cjs. -->
  <style>
    /* Tinta sobre barra clara, creme sobre barra escura. E o esquema do
       NAVEGADOR, nao o tema do site: o favicon vive na aba, nao na pagina. */
    path { fill: #23271C }
    @media (prefers-color-scheme: dark) { path { fill: #F4F0E6 } }
  </style>
${d.map(p => '  <path d="' + p + '"/>').join('\n')}
</svg>
`

fs.writeFileSync(R + 'public/favicon.svg', arquivo)
console.log('public/favicon.svg gerado: ' + d.length + ' paths   viewBox ' + vb +
            '   ' + Math.round(arquivo.length / 1024) + ' kB')
