const { ct } = require('./contraste.cjs')

/* As tintas de capa ausente levam as INICIAIS por cima, e a cor dessas
   iniciais é `--sobre-tinta`: branco onde a família é escura, tinta onde ela
   é clara. Por isso cada família diz contra o que deve ser medida.

   O Candy nasceu com família escura — as três cores pastéis empurradas para
   baixo até o branco passar — e as três convergiam para marrom. A estante
   ficava marrom num tema de rosa, damasco e menta. Hoje a família é pastel e
   as iniciais é que mudam de cor. */
const FAM = {
  nockout: { sobre: '#ffffff', cores: [
    ['#A33300', 'laranja queimado'], ['#B8491F', 'ferrugem'], ['#8F4A2B', 'terracota'],
    ['#7A4A33', 'barro'], ['#6E4A3C', 'umbra'], ['#63453A', 'tijolo'],
    ['#9C5633', 'ocre'], ['#7D5A44', 'terra'],
  ]},
  candy: { sobre: '#23271C', cores: [
    ['#DF8888', 'rosa (dada)'], ['#EBB273', 'damasco (dada)'], ['#B5CDC5', 'menta (dada)'],
    ['#E9A5A5', 'rosa claro'], ['#F0C79A', 'damasco claro'], ['#C9DCD5', 'menta clara'],
    ['#D9A3AE', 'rosa-malva'], ['#E3B9A0', 'pêssego'],
  ]},
  midnight: { sobre: '#ffffff', cores: [
    ['#280137', 'meia-noite'], ['#3D1052', 'ameixa'], ['#2A1F5C', 'tinta'],
    ['#45215E', 'violeta'], ['#1F2440', 'madrugada'], ['#512A63', 'orquídea'],
    ['#32204A', 'uva'], ['#241633', 'breu'],
  ]},
  moss: { sobre: '#ffffff', cores: [
    ['#4B5D3A', 'moss'], ['#5E7146', 'moss-2'], ['#6B6A3A', 'oliva'],
    ['#7A6A48', 'caqui'], ['#556B5A', 'verde-cinza'], ['#4A5A63', 'ardósia'],
    ['#7D5A44', 'terra'], ['#63583F', 'bronze'],
  ]},
}

let ok = true
for (const [tema, { sobre, cores }] of Object.entries(FAM)) {
  console.log('--- tintas ' + tema + '  (iniciais em ' + sobre + ') ---')
  cores.forEach(([hex, nome], i) => {
    const v = ct(sobre, hex)
    const passa = v >= 4.5
    ok &= passa
    console.log((passa ? '  ok  ' : ' FALHA ') + ('tinta-' + i).padEnd(9) + hex + '  ' + nome.padEnd(18) + v.toFixed(2) + ':1')
  })
}
process.exit(ok ? 0 : 1)
