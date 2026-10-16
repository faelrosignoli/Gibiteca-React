/* Gera as faixas da divisória (paginação → rodapé).
 *
 *   node tools/gerar-ilustra.cjs
 *
 * SÃO DOIS ARQUIVOS, por LARGURA e não por tema: `divisoria.svg` (telas
 * largas) e `divisoria-m.svg` (celular). A arte é a mesma no Moss e no
 * Nockout — foi decisão de desenho, e o código seguiu: a divisória deixou de
 * ter eixo de tema, e com ele sumiram metade dos arquivos e a dependência do
 * componente em relação ao tema escolhido.
 *
 * AS CORES DA ARTE NÃO SE TOCAM. Houve uma versão deste script com tabela de
 * cores por tema; era errado. A arte é de quem desenhou, e um gerador que
 * decide a cor faz o arquivo de saída mentir sobre o de entrada. Aqui as
 * declarações de `fill` e `opacity` saem do próprio SVG, como vieram.
 *
 * O que o gerador faz, e por isso a arte não vai direto do editor para o
 * public/:
 *
 *   1. Joga fora caminhos `fill: none`, que não desenham nada. Nos exports
 *      atuais não há nenhum, mas já houve 48 de 79 num deles — o editor volta
 *      a produzi-los sem aviso.
 *   2. Troca os nomes de classe por nomes que dizem o PAPEL. Os do editor
 *      (`cls-1`, `cls-2`…) são sorteados a cada export: quem abrir o arquivo
 *      depois não tem como saber o que é o quê.
 *   3. Fixa o `preserveAspectRatio` (ver o comentário que vai no arquivo).
 *
 * Para trocar a arte, substitua o SVG em src/assets/ e rode de novo.
 */
const fs = require('fs')
const path = require('path')

const RAIZ = path.join(__dirname, '..')
const ARQUIVOS = ['divisoria', 'divisoria-m']

/* O primeiro seletor de uma lista chega sem o ponto (ele fica fora do grupo
   de captura) e os seguintes chegam com ele. */
const PONTO = /^\./
const REGRA = /\.([\w-]+(?:\s*,\s*\.[\w-]+)*)\s*\{([^}]*)\}/g
const nomes = sel => sel.split(',').map(c => c.trim().replace(PONTO, ''))

/* Luminância relativa, só para saber qual cor é a mais escura. Não mexe em
   nada do desenho — serve para ESCOLHER O NOME da classe. */
const lum = hex => {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return 1
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const canal = i => {
    const c = parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2)
}

function gerar(base) {
  const fonte = path.join(RAIZ, 'src/assets/' + base + '.svg')
  if (!fs.existsSync(fonte)) {
    console.error('ERRO: falta src/assets/' + base + '.svg')
    process.exit(1)
  }
  const bruto = fs.readFileSync(fonte, 'utf8')

  /* A arte não pode trazer texto vivo: sem a fonte instalada o navegador troca
     por outra e o desenho muda de forma. Mesma regra do gerador da marca. */
  if (/<text[\s>]/.test(bruto)) {
    console.error('ERRO (' + base + '): a arte tem <text>. Converta para curvas.')
    process.exit(1)
  }

  const vb = (bruto.match(/viewBox="([^"]+)"/) || [])[1]
  if (!vb) { console.error('ERRO (' + base + '): SVG sem viewBox.'); process.exit(1) }

  /* Cada classe do editor vira { fill, opacity } COMO ESTÁ no arquivo. */
  const decl = new Map()
  for (const m of bruto.matchAll(REGRA)) {
    const [, sel, corpo] = m
    const fill = (corpo.match(/fill:\s*([^;}]+)/) || [])[1]
    const op = (corpo.match(/opacity:\s*([^;}]+)/) || [])[1]
    for (const c of nomes(sel)) {
      const d = decl.get(c) || {}
      if (fill) d.fill = fill.trim()
      if (op) d.opacity = op.trim()
      decl.set(c, d)
    }
  }

  const todos = [...bruto.matchAll(/<path\b[^>]*\/>/g)].map(m => m[0])
  const classeDe = p => (p.match(/class="([^"]+)"/) || [])[1] || ''
  const mantidos = todos.filter(p => (decl.get(classeDe(p)) || {}).fill !== 'none')

  /* A MAIS ESCURA é a silhueta; o resto é acento. Isto é só NOME: nenhuma cor
     é lida de tabela nem reescrita. Caminho sem classe fica SEM classe — no
     SVG isso é preto, e é a cor que a arte tem. */
  const combos = [...new Set(mantidos.map(p => {
    const d = decl.get(classeDe(p))
    return d && d.fill ? d.fill + '|' + (d.opacity || '') : null
  }).filter(Boolean))]
  const maisEscura = combos.slice().sort((a, b) => lum(a.split('|')[0]) - lum(b.split('|')[0]))[0]

  const papeis = new Map()
  for (const chave of combos) {
    const [, op] = chave.split('|')
    const raiz = chave === maisEscura ? 'silhueta' : (op ? 'acento-meio' : 'acento')
    const usados = new Set(papeis.values())
    let nome = raiz
    for (let n = 2; usados.has(nome); n++) nome = raiz + '-' + n
    papeis.set(chave, nome)
  }
  const nomeDe = p => {
    const d = decl.get(classeDe(p))
    if (!d || !d.fill) return ''
    return papeis.get(d.fill + '|' + (d.opacity || '')) || ''
  }

  const corpo = mantidos.map(p => {
    const nome = nomeDe(p)
    const limpo = p.replace(/\s*class="[^"]*"/, '')
    return '  ' + (nome ? limpo.replace('<path', `<path class="${nome}"`) : limpo)
  })

  const estilo = [...papeis].map(([chave, nome]) => {
    const [fill, op] = chave.split('|')
    return '    .' + nome + ' { fill: ' + fill + (op ? '; opacity: ' + op : '') + ' }'
  })

  const saida = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" preserveAspectRatio="xMidYMax meet">',
    '  <!-- GERADO por tools/gerar-ilustra.cjs — não edite à mão.',
    '       Fonte: src/assets/' + base + '.svg',
    '',
    '       As cores são as da arte original, copiadas do SVG de origem.',
    '',
    '       meet, não slice: a cena inteira aparece em qualquer largura. Cortar',
    '       daria figuras maiores, mas o desenho é composto de ponta a ponta —',
    '       o corte come as bordas e deixa o miolo, que é o trecho mais vazio.',
    '',
    '       O Y em Max: se algum dia alguém impuser altura fixa aqui, o que se',
    '       preserva é a BASE do desenho, que é onde a faixa encosta no rodapé. -->',
    ...(estilo.length ? ['  <style>', ...estilo, '  </style>'] : []),
    ...corpo,
    '</svg>', ''
  ].join('\n')

  fs.writeFileSync(path.join(RAIZ, 'public/' + base + '.svg'), saida)
  const descartados = todos.length - mantidos.length
  console.log('  public/' + base + '.svg — ' + (saida.length / 1024).toFixed(1) + ' kB, ' +
    mantidos.length + ' paths (' + descartados + ' descartados), ' +
    vb.split(' ').slice(2).join('×') + ', cores: ' +
    [...papeis.keys()].map(k => k.replace('|', ' @')).join(' + '))
}

for (const a of ARQUIVOS) gerar(a)
