/* Testes das funções puras. Sem framework: `npm test` roda este arquivo. */
import * as H from '../src/lib/helpers.js'
import * as C from '../src/lib/conta.js'
import * as S from '../src/lib/sync.js'

let ok = 0
const falhas = []
const eq = (nome, achado, esperado) => {
  const a = JSON.stringify(achado), e = JSON.stringify(esperado)
  if (a === e) { ok++; return }
  falhas.push(`${nome}\n      esperado: ${e}\n      achado:   ${a}`)
}

/* ---------- dinheiro ---------- */
eq('moneyToNumber("12,50")', H.moneyToNumber('12,50'), 12.5)
eq('moneyToNumber("R$ 1.234,56")', H.moneyToNumber('R$ 1.234,56'), 1234.56)
eq('moneyToNumber("abc")', H.moneyToNumber('abc'), 0)
eq('moneyToNumber("")', H.moneyToNumber(''), 0)
eq('moneyToNumber("-50")  [sinal some]', H.moneyToNumber('-50'), 0.5)
eq('fmtBRL(NaN)', H.fmtBRL(NaN), 'R$ 0,00')

/* ---------- texto ---------- */
eq('slugify("")', H.slugify(''), 'obra')
eq('slugify("Ação!! 2")', H.slugify('Ação!! 2'), 'acao-2')
eq('slugify("///")', H.slugify('///'), 'obra')
eq('initials("")', H.initials(''), '?')
eq('initials("123")', H.initials('123'), '12')
eq('canon("Ação  dos 100")', H.canon('Ação  dos 100'), 'acao dos 100')

/* ---------- idade / conta ---------- */
const hoje = new Date(2026, 9, 28)   // 28/10/2026
eq('idadeEm("2008-10-28") faz 18 hoje', C.idadeEm('2008-10-28', hoje), 18)
eq('idadeEm("2008-10-29") ainda 17', C.idadeEm('2008-10-29', hoje), 17)
eq('idadeEm("2000-02-31") data que não existe', C.idadeEm('2000-02-31', hoje), null)
eq('idadeEm("") ', C.idadeEm('', hoje), null)
eq('erroNascimento("")', C.erroNascimento(''), 'vazio')
eq('erroNascimento("3000-01-01") é futuro', C.erroNascimento('3000-01-01'), 'futuro')
eq('maiorDeIdade("2020-01-01")', C.maiorDeIdade('2020-01-01'), false)
eq('emailValido("a@b.co")', C.emailValido('a@b.co'), true)
eq('emailValido("a@b")', C.emailValido('a@b'), false)
eq('emailValido("a b@c.co")', C.emailValido('a b@c.co'), false)
eq('normalizarEmail(" A@B.CO ")', C.normalizarEmail(' A@B.CO '), 'a@b.co')

/* ---------- sincronização: o carimbo ----------
   Antes isto morava no store.jsx e nenhum destes rodava. */
eq('carimboDe(null)', S.carimboDe(null), 0)
eq('carimboDe({atualizadoEm:5})', S.carimboDe({ atualizadoEm: 5 }), 5)
eq('carimboDe({updated:"lixo"})', S.carimboDe({ updated: 'lixo' }), 0)
eq('carimboDe(ISO)', S.carimboDe({ updated: '2026-01-01T00:00:00.000Z' }), Date.parse('2026-01-01T00:00:00.000Z'))
eq('carimboDe cai para `exported`', S.carimboDe({ exported: '2026-01-01T00:00:00.000Z' }), Date.parse('2026-01-01T00:00:00.000Z'))
eq('carimboDe: atualizadoEm manda mais que updated', S.carimboDe({ atualizadoEm: 7, updated: '2026-01-01T00:00:00.000Z' }), 7)

/* ---------- sincronização: quem ganha ao abrir ---------- */
const abrir = (local, nuvem, temCoisa) => S.decidirAoAbrir({ carimboLocal: local, carimboNuvem: nuvem, temCoisaAqui: temCoisa })
eq('nuvem mais nova -> puxar', abrir(10, 20, true), 'puxar')
eq('local mais novo -> enviar', abrir(20, 10, true), 'enviar')
eq('empate -> nada', abrir(10, 10, true), 'nada')
eq('sem carimbo aqui, com obras e nuvem -> conflito', abrir(0, 20, true), 'conflito')
eq('sem carimbo aqui, com obras e nuvem vazia -> nada', abrir(0, 0, true), 'nada')
eq('sem carimbo aqui e sem obras -> puxar', abrir(0, 20, false), 'puxar')
eq('tudo zerado -> nada', abrir(0, 0, false), 'nada')
eq('decidirAoAbrir() sem argumento', S.decidirAoAbrir(), 'nada')

/* ---------- sincronização: pode gravar por cima? ---------- */
const conflito = (local, nuvem, forcar) => S.haConflitoAoEnviar({ carimboLocal: local, carimboNuvem: nuvem, forcar })
eq('nuvem na frente -> conflito', conflito(10, 20, false), true)
eq('nuvem atrás -> grava', conflito(20, 10, false), false)
eq('empate -> grava', conflito(10, 10, false), false)
eq('"Enviar agora" força por cima', conflito(10, 20, true), false)

/* ---------- isto é uma coleção? ---------- */
eq('ehColecao({obras:[]})', S.ehColecao({ obras: [] }), true)
eq('ehColecao({})', S.ehColecao({}), false)
eq('ehColecao(null)', S.ehColecao(null), false)
eq('ehColecao("texto")', S.ehColecao('texto'), false)
eq('ehColecao({obras:"não é lista"})', S.ehColecao({ obras: 'x' }), false)

/* ---------- obras ---------- */
const avulsa = { id: 1, nome: 'Sandman', tipo: 'avulso', status: 'biblioteca', lido: true, nota: 4, editora: 'Panini', origem: 'nacional', valorPago: 50 }
const serie = {
  id: 2, nome: 'Akira', tipo: 'serie', editora: 'JBC', origem: 'nacional',
  volumes: [
    { nome: 'Vol. 1', status: 'biblioteca', lido: true, nota: 5, valorPago: 40 },
    { nome: 'Vol. 2', status: 'wishlist', urgencia: true },
  ],
}
eq('ownedCount(serie)', H.ownedCount(serie), 1)
eq('avgNota(serie)', H.avgNota(serie), 5)
eq('avgNota(sem nota)', H.avgNota({ id: 3, tipo: 'avulso' }), 0)
eq('sumValor(serie)', H.sumValor(serie), 40)
eq('anyUrg(serie)', H.anyUrg(serie), true)
eq('statusMatch(serie,"biblioteca")', H.statusMatch(serie, 'biblioteca'), true)
eq('tipoOf({tipo:"avulsa"}) migra', H.tipoOf({ tipo: 'avulsa' }), 'avulso')
eq('isImp({origem:"importado"})', H.isImp({ origem: 'importado' }), true)
eq('capaVelada(+18, sem permissão)', H.capaVelada({ adulto: true }, false), true)
eq('capaVelada(+18, com permissão)', H.capaVelada({ adulto: true }, true), false)

/* ---------- filtros ---------- */
const f = (extra) => ({ q: '', status: 'todos', tipo: '', tipoEdicao: [], editora: [], autor: [], nota: '', importado: false, urgencia: false, leitura: 'todos', ...extra })
eq('passes: sem filtro', H.passes(avulsa, f()), true)
eq('passes: busca acha sem acento', H.passes({ ...avulsa, nome: 'Memórias' }, f({ q: 'memorias' })), true)
eq('passes: editora certa', H.passes(avulsa, f({ editora: ['Panini'] })), true)
eq('passes: editora errada', H.passes(avulsa, f({ editora: ['JBC'] })), false)
eq('passes: duas editoras somam (OU)', H.passes(avulsa, f({ editora: ['JBC', 'Panini'] })), true)
eq('passes: urgência', H.passes(serie, f({ urgencia: true })), true)
eq('passes: nota 4', H.passes(avulsa, f({ nota: '4' })), true)
eq('passes: obra sem nome não quebra', H.passes({ id: 9 }, f({ q: 'x' })), false)

/* ---------- fila ---------- */
eq('chaveFila(1,null)', H.chaveFila(1, null), '1:-')
eq('chaveFila("1",0)', H.chaveFila('1', 0), '1:0')
eq('podeEnfileirar(lido)', H.podeEnfileirar({ status: 'biblioteca', lido: true }), false)
eq('podeEnfileirar(na estante, não lido)', H.podeEnfileirar({ status: 'biblioteca' }), true)
eq('podeEnfileirar(quero)', H.podeEnfileirar({ status: 'wishlist' }), false)
eq('itemDaFila com id morto', H.itemDaFila([avulsa], { id: 999, vol: null }), null)
eq('itemDaFila com vol inexistente', H.itemDaFila([serie], { id: 2, vol: 7 }), null)

/* ---------- desmembrar ---------- */
const frags = H.fragmentosDe(serie, 10)
eq('fragmentosDe: quantidade', frags.length, 2)
eq('fragmentosDe: ids novos', frags.map(o => o.id), [11, 12])
eq('fragmentosDe: obra sem volumes', H.fragmentosDe(avulsa, 10).length, 0)

/* ---------- agrupar a vitrine ---------- */
const paraAgrupar = [
  { id: 1, nome: 'Akira', editora: 'JBC', roteirista: 'Katsuhiro Otomo', desenhista: 'Katsuhiro Otomo' },
  { id: 2, nome: 'Watchmen', editora: 'Panini', roteirista: 'Alan Moore', desenhista: 'Dave Gibbons' },
  { id: 3, nome: 'Daytripper', editora: 'Pipoca & Nanquim', roteirista: 'Fábio Moon / Gabriel Bá', desenhista: 'Fábio Moon / Gabriel Bá' },
  { id: 4, nome: 'Sem nada', editora: '', roteirista: '', desenhista: '' },
  { id: 5, nome: 'Série', editora: 'Panini', volumes: [{ nome: 'v1', roteirista: 'Alan Moore' }] },
]
const grupos = (criterio, dir) => {
  const seq = H.sequenciaAgrupada(paraAgrupar, criterio, dir)
  const m = new Map()
  seq.forEach(x => m.set(x.grupo, (m.get(x.grupo) || 0) + 1))
  return [...m.entries()].map(([k, n]) => k + ':' + n)
}
eq('agrupa por editora, sem-valor por último', grupos('editora'),
  ['JBC:1', 'Panini:2', 'Pipoca & Nanquim:1', 'Sem editora:1'])
eq('obra com dois autores entra nos dois blocos', grupos('autor'),
  ['Alan Moore:2', 'Fábio Moon:1', 'Gabriel Bá:1', 'Katsuhiro Otomo:1', 'Sem autor:1'])
eq('o autor do VOLUME conta para a série', H.nomesDoGrupo(paraAgrupar[4], 'autor'), ['Alan Moore'])
eq('desenhista é outro campo', grupos('desenhista'),
  ['Dave Gibbons:1', 'Fábio Moon:1', 'Gabriel Bá:1', 'Katsuhiro Otomo:1', 'Sem desenhista:2'])
eq('desc inverte os blocos, o sem-valor fica por último', grupos('editora', 'desc'),
  ['Pipoca & Nanquim:1', 'Panini:2', 'JBC:1', 'Sem editora:1'])
eq('a ordem de entrada sobrevive dentro do bloco',
  H.sequenciaAgrupada([paraAgrupar[4], paraAgrupar[1]], 'editora').map(x => x.obra.nome), ['Série', 'Watchmen'])
eq('obra sem editora cai no bloco certo', H.nomesDoGrupo(paraAgrupar[3], 'editora'), [])

/* ---------- ordenação ---------- */
const lista = [{ id: 1, nome: 'ñandu' }, { id: 2, nome: 'Abel' }, { id: 3, nome: 'zebra' }]
eq('sortList por nome (pt)', H.sortList(lista, { by: 'nome', dir: 'asc' }).map(o => o.id), [2, 1, 3])

console.log('\n' + ok + ' passaram, ' + falhas.length + ' falharam\n')
if (falhas.length) {
  falhas.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f + '\n'))
  process.exitCode = 1
}
