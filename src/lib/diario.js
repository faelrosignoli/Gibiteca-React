import { unitsOf, ownedCount, coverOf, edOf, avgNota, sumValor, fmtBRL, authorsOf } from './helpers.js'

/* Diário da coleção.
 *
 * Toda alteração já virava um commit no GitHub — mas todos se chamavam
 * "Atualiza coleção", o que torna o histórico inútil justamente quando ele
 * seria preciso ("o que foi que eu mudei?", "perdi alguma coisa?").
 *
 * Aqui a coleção antiga é comparada com a nova e a mudança vira frase. O
 * resultado é o texto do commit, então o histórico do repositório passa a ser
 * legível direto no GitHub, mesmo sem abrir o app.
 *
 * Cada obra pode render VÁRIAS frases: marcar como lido e dar nota na mesma
 * edição são duas coisas, e o histórico tem que dizer as duas. O genérico
 * "Editou X" só sobra para o que nenhuma regra soube nomear.
 */

const nomeDe = (o) => (o && o.nome ? String(o.nome).trim() : 'obra sem nome')
const aspas = (s) => '“' + s + '”'

function porId(lista) {
  const m = new Map()
  ;(Array.isArray(lista) ? lista : []).forEach(o => { if (o && o.id != null) m.set(o.id, o) })
  return m
}

/* "a obra" ou "2 volumes de a obra": séries falam em volumes, avulsos não. */
function alvo(obra, quantos) {
  const total = unitsOf(obra).length
  const nome = aspas(nomeDe(obra))
  if (total <= 1 || quantos == null) return nome
  return quantos + ' volume' + (quantos > 1 ? 's' : '') + ' de ' + nome
}

const naEstante = (o) => unitsOf(o).filter(u => u && u.status === 'biblioteca')
const lidos = (o) => naEstante(o).filter(u => u.lido).length
const urgentes = (o) => unitsOf(o).filter(u => u && u.urgencia && u.status !== 'biblioteca').length
const nota = (o) => avgNota(o)
const limpo = (s) => String(s == null ? '' : s).trim()

const estrelas = (n) => String(n).replace('.', ',') + (n === 1 ? ' estrela' : ' estrelas')

/* Todas as mudanças dentro de uma obra que existe dos dois lados. */
function mudancasInternas(antes, depois) {
  const fora = []
  const nome = aspas(nomeDe(depois))
  const push = (tipo, texto) => fora.push({ tipo, texto })

  if (nomeDe(antes) !== nomeDe(depois)) {
    push('renomeada', 'Renomeou ' + aspas(nomeDe(antes)) + ' para ' + nome)
  }

  // ---- volumes e posse ----
  const totalAntes = unitsOf(antes).length, total = unitsOf(depois).length
  if (total !== totalAntes) {
    const d = total - totalAntes
    push('volumes', (d > 0 ? 'Acrescentou ' + d + ' volume' + (d > 1 ? 's' : '') : 'Tirou ' + (-d) + ' volume' + (-d > 1 ? 's' : '')) + ' de ' + nome)
  } else {
    const tinha = ownedCount(antes), tem = ownedCount(depois)
    if (tem !== tinha) {
      const d = tem - tinha
      push('status', (d > 0 ? 'Marcou como Tenho: ' : 'Voltou para Quero: ') + alvo(depois, Math.abs(d)) +
        (total > 1 ? ' (' + tem + ' de ' + total + ')' : ''))
    }
  }

  // ---- leitura ----
  const lidoAntes = lidos(antes), lidoDepois = lidos(depois)
  if (lidoDepois !== lidoAntes) {
    const d = lidoDepois - lidoAntes
    push('leitura', (d > 0 ? 'Marcou como lido: ' : 'Marcou como não lido: ') + alvo(depois, Math.abs(d)))
  }

  // ---- urgência ----
  const urgAntes = urgentes(antes), urgDepois = urgentes(depois)
  if (urgDepois !== urgAntes) {
    push('urgencia', urgDepois > urgAntes
      ? 'Marcou ' + alvo(depois, urgDepois - urgAntes) + ' como urgente'
      : 'Tirou a urgência de ' + alvo(depois, urgAntes - urgDepois))
  }

  // ---- nota ----
  const nAntes = nota(antes), nDepois = nota(depois)
  if (nDepois !== nAntes) {
    if (!nDepois) push('nota', 'Tirou a nota de ' + nome)
    else push('nota', 'Deu ' + estrelas(nDepois) + ' para ' + nome)
  }

  // ---- dinheiro ----
  const vAntes = sumValor(antes), vDepois = sumValor(depois)
  if (vDepois !== vAntes) {
    if (!vDepois) push('valor', 'Apagou o valor pago de ' + nome)
    else if (!vAntes) push('valor', 'Anotou ' + fmtBRL(vDepois) + ' pago em ' + nome)
    else push('valor', 'Mudou o valor de ' + nome + ' para ' + fmtBRL(vDepois))
  }

  /* ---- capas ----
   *
   * Volume a volume, não por `coverOf`: numa série ele só olha o volume 1, e
   * mover a capa dos outros caía no genérico "Editou" — foi o que encheu o
   * histórico de 110 linhas iguais quando as capas subiram para a nuvem.
   *
   * Mover para a nuvem é troca de `data:` por endereço. É um tipo próprio,
   * porque é arrumação e não uma capa nova. */
  const uA = unitsOf(antes), uD = unitsOf(depois)
  let postas = 0, tiradas = 0, trocadas = 0, movidas = 0
  for (let i = 0; i < Math.min(uA.length, uD.length); i++) {
    const a = (uA[i] && uA[i].imagem) || '', b = (uD[i] && uD[i].imagem) || ''
    if (a === b) continue
    if (!a && b) postas++
    else if (a && !b) tiradas++
    else if (/^data:/i.test(a) && /^https?:/i.test(b)) movidas++
    else trocadas++
  }
  if (movidas) push('capa-nuvem', 'Subiu para a nuvem a capa de ' + alvo(depois, movidas))
  if (postas) push('capa', 'Pôs capa em ' + alvo(depois, postas))
  if (tiradas) push('capa', 'Tirou a capa de ' + alvo(depois, tiradas))
  if (trocadas) push('capa', 'Trocou a capa de ' + alvo(depois, trocadas))

  // ---- campos de texto, todos com a mesma forma ----
  const campos = [
    ['editora', 'a editora', edOf(antes), edOf(depois)],
    ['pais', 'o país', limpo(antes.pais), limpo(depois.pais)],
    ['origem', 'a origem', limpo(antes.origem), limpo(depois.origem)],
  ]
  campos.forEach(([tipo, rotulo, a, b]) => {
    if (a === b) return
    if (!b) push(tipo, 'Apagou ' + rotulo + ' de ' + nome)
    else if (!a) push(tipo, 'Pôs ' + rotulo + ' de ' + nome + ': ' + b)
    else push(tipo, 'Mudou ' + rotulo + ' de ' + nome + ' para ' + b)
  })

  // autoria: roteirista e desenhista juntos, porque é assim que se lê
  const autoriaAntes = authorsOf(antes).join(', ')
  const autoriaDepois = authorsOf(depois).join(', ')
  if (autoriaAntes !== autoriaDepois) {
    if (!autoriaDepois) push('autoria', 'Apagou a autoria de ' + nome)
    else if (!autoriaAntes) push('autoria', 'Pôs a autoria de ' + nome + ': ' + autoriaDepois)
    else push('autoria', 'Mudou a autoria de ' + nome + ' para ' + autoriaDepois)
  }

  // anotação: o texto em si não vai para o histórico, só o fato
  const rAntes = limpo(antes.resenha), rDepois = limpo(depois.resenha)
  if (rAntes !== rDepois) {
    push('resenha', !rDepois ? 'Apagou a anotação de ' + nome
      : !rAntes ? 'Escreveu uma anotação em ' + nome
      : 'Mudou a anotação de ' + nome)
  }

  // nada disso pegou, mas alguma coisa mudou: melhor dizer que houve edição
  // do que fingir que nada aconteceu
  if (!fora.length && JSON.stringify(antes) !== JSON.stringify(depois)) {
    push('editada', 'Editou ' + nome)
  }
  return fora
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
    mudancasInternas(a.get(id), obra).forEach(m => mudancas.push(m))
  })

  return mudancas
}

const LIMITE_ASSUNTO = 72
const MAX_NO_CORPO = 200

/* Quando a leva inteira é da mesma natureza, o título diz O QUE foi feito.
 *
 * "110 alterações na coleção" não informa nada — foi o que apareceu quando as
 * capas subiram para a nuvem. "Subiu 110 capas para a nuvem" responde sozinho,
 * e a lista fica para quem quiser abrir. */
const RESUMOS = {
  'capa-nuvem': (n) => 'Subiu ' + n + ' capas para a nuvem',
  capa: (n) => 'Mexeu na capa de ' + n + ' obras',
  adicionada: (n) => 'Adicionou ' + n + ' obras',
  removida: (n) => 'Removeu ' + n + ' obras',
  leitura: (n) => 'Marcou a leitura de ' + n + ' obras',
  status: (n) => 'Mudou o status de ' + n + ' obras',
  editada: (n) => 'Editou ' + n + ' obras',
}

function resumoDe(mudancas) {
  const tipos = new Set(mudancas.map(m => m.tipo))
  if (tipos.size === 1) {
    const tipo = [...tipos][0]
    const resumo = RESUMOS[tipo]
    if (resumo) return resumo(mudancas.length)
  }
  return mudancas.length + ' alterações na coleção'
}

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

  const corpo = mudancas.slice(0, MAX_NO_CORPO).map(m => '- ' + m.texto)
  if (mudancas.length > MAX_NO_CORPO) corpo.push('- …e mais ' + (mudancas.length - MAX_NO_CORPO))
  return resumoDe(mudancas) + '\n\n' + corpo.join('\n')
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
