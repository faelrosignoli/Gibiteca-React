/* Contraste WCAG. O projeto exige: acento-texto >= 4.5:1 sobre o papel,
   sobre-acento >= 4.5:1 sobre o preenchimento, tinta >= 4.5:1 com branco. */
const lin = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const L = hex => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ct = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const diz = (n, a, b, min) => {
  const v = ct(a, b)
  console.log((v >= min ? '  ok  ' : ' FALHA ') + n.padEnd(34) + a + ' / ' + b + '  = ' + v.toFixed(2) + ':1  (min ' + min + ')')
  return v >= min
}
module.exports = { L, ct, diz }
if (require.main === module) {
  let tudoOk = true
  const T = {
    moss:     { paper:'#F4F0E6', fill:'#4B5D3A', texto:'#4B5D3A', sobre:'#F4F0E6' },
    nockout:  { paper:'#F0F0F0', fill:'#FF5000', texto:'#C23A00', sobre:'#23271C' },
    candy:    { paper:'#F7F2F0', fill:'#DF8888', texto:'#A8434A', sobre:'#23271C' },
    midnight: { paper:'#F3F1F6', fill:'#280137', texto:'#280137', sobre:'#F3F1F6' },
  }
  for (const [nome, t] of Object.entries(T)) {
    console.log('--- ' + nome + ' ---')
    tudoOk &= diz('acento-texto sobre o papel', t.texto, t.paper, 4.5)
    tudoOk &= diz('sobre-acento no preenchimento', t.sobre, t.fill, 4.5)
    tudoOk &= diz('ink (#23271C) sobre o papel', '#23271C', t.paper, 4.5)
  }
  process.exit(tudoOk ? 0 : 1)
}
