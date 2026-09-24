import { unitsOf, ownedCount, coverOf, edOf } from './helpers.js'

/* Diário da coleção.
 *
 * Toda alteração já virava um commit no GitHub — mas todos se chamavam
 * "Atualiza coleção", o que torna o histórico inútil justamente quando ele
 * seria preciso ("o que foi que eu mudei?", "perdi alguma coisa?").
 *
 * Aqui a coleção antiga é comparada com a nova e a mudança vira frase. O
 * resultado é o texto do commit, então o histórico do repositório passa a ser
 * legível direto no GitHub, mesmo sem abrir o app.
 */

const nomeDe = (o) => (o && o.nome ? String(o.nome).trim() : 'obra sem nome')

// aspas tipográficas para o nome não se confundir com o resto da frase
const aspas = (s) => '“' + s + '”'

function porId(lista) {
  const m = new Map()
  ;(Array.isArray(lista) ? lista : []).forEach(o => { if (o && o.id != null) m.set(o.id, o) })
  return m
}

/* Descreve o que mudou DENTRO de uma obra que existe dos dois lados.
 * Devolve null quando nada digno de nota mudou. */
function mudancaInterna(antes, depois) {
  const nome = nomeDe(depois)

  if (nomeDe(antes) !== nome) return { tipo: 'renomeada', texto: 'Renomeou ' + aspas(nomeDe(antes)) + ' para ' + aspas(nome) }

  const tinha = ownedCount(antes), tem = ownedCount(depois)
  const totalAntes = unitsOf(antes).length, total = unitsOf(depois).length

  if (total !== totalAntes) {
    const d = total - totalAntes
    return { tipo: 'volumes', texto: (d > 0 ? 'Acrescentou ' + d + ' volume' + (d > 1 ? 's' : '') : 'Tirou ' + (-d) + ' volume' + (-d > 1 ? 's' : '')) + ' de ' + aspas(nome) }
  }
  if (tem !== tinha) {
    const d = tem - tinha
    const acao = d > 0 ? 'Marcou como Tenho' : 'Voltou para Quero'
    const quantos = Math.abs(d)
    const alvo = total > 1 ? quantos + ' volume' + (quantos > 1 ? 's' : '') + ' de ' + aspas(nome) : aspas(nome)
    return { tipo: 'status', texto: acao + ': ' + alvo + (total > 1 ? ' (' + tem + ' de ' + total + ')' : '') }
  }
  if (!!coverOf(antes) !== !!coverOf(depois)) {
    return { tipo: 'capa', texto: (coverOf(depois) ? 'Pôs capa em ' : 'Tirou a capa de ') + aspas(nome) }
  }
  if (edOf(antes) !== edOf(depois)) {
    return { tipo: 'editora', texto: 'Mudou a editora de ' + aspas(nome) + ' para ' + (edOf(depois) || '—') }
  }
  // qualquer outro campo: nota, valor, resenha, país, autoria…
  if (JSON.stringify(antes) !== JSON.stringify(depois)) {
    return { tipo: 'editada', texto: 'Editou ' + aspas(nome) }
  }
  return null
}

/* Lista de mudanças entre duas versões da coleção. */
export function compararColecoes(antes, depois) {
  const a = porId(antes && antes.obras)
  const d = porId(depois && depois.obras)
  const mudancas = []

  d.forEach((obra, id) => {
    if (!a.has(id)) mudancas.push({ tipo: 'adicionada', texto: 'Adicionou ' + aspas(nomeDe(obra)) })
  })
  a.forEach((obra, id) => {
    if (!d.has(id)) mudancas.push({ tipo: 'removida', texto: 'Removeu ' + aspas(nomeDe(obra)) })
  })
  d.forEach((obra, id) => {
    if (!a.has(id)) return
    const m = mudancaInterna(a.get(id), obra)
    if (m) mudancas.push(m)
  })

  return mudancas
}

const LIMITE_ASSUNTO = 72
const MAX_NO_CORPO = 20

/* O texto do commit: uma primeira linha que se lê de relance e, quando há
 * muita coisa, o detalhe embaixo. É o formato que o git espera e o que faz o
 * histórico do GitHub ficar legível. */
export function mensagemDeCommit(mudancas, quando = new Date()) {
  const carimbo = quando.toLocaleString('pt-BR')

  if (!mudancas.length) return 'Atualiza coleção — ' + carimbo

  if (mudancas.length === 1) {
    const t = mudancas[0].texto
    return t.length <= LIMITE_ASSUNTO ? t : t.slice(0, LIMITE_ASSUNTO - 1) + '…'
  }

  const assunto = mudancas.length + ' alterações na coleção'
  const corpo = mudancas.slice(0, MAX_NO_CORPO).map(m => '- ' + m.texto)
  if (mudancas.length > MAX_NO_CORPO) corpo.push('- …e mais ' + (mudancas.length - MAX_NO_CORPO))
  return assunto + '\n\n' + corpo.join('\n')
}

/* Lê de volta o que `mensagemDeCommit` escreveu, para a tela de Atividades.
 * Mensagens antigas ("Atualiza coleção — …") continuam válidas: viram um
 * item sem detalhe, em vez de sumirem do histórico. */
export function lerMensagem(texto) {
  const linhas = String(texto || '').split('\n')
  const assunto = (linhas[0] || '').trim()
  const itens = linhas.slice(1)
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim())
  return { assunto, itens }
}
