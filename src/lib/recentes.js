/* O QUE VOCÊ PROCUROU E O QUE VOCÊ ABRIU.
 *
 * Duas listas curtas, em chave própria do aparelho — fora de `gibiteca_v1`,
 * e por isso fora do backup e da nuvem. É cache: histórico de busca viajando
 * num arquivo restaurado deixaria numa máquina as pesquisas feitas em outra.
 * Some junto no "Limpar cache", como o resto do que é só conveniência.
 *
 * Toda leitura e toda escrita por `try`: com os dados do site bloqueados o
 * `localStorage` LANÇA, e um histórico de busca não pode derrubar a tela.
 */
const CHAVE_BUSCAS = 'gibiteca_buscas'
const CHAVE_VISTOS = 'gibiteca_vistos'

export const MAX_BUSCAS = 5
export const MAX_VISTOS = 6

export const CHAVES_RECENTES = [CHAVE_BUSCAS, CHAVE_VISTOS]

function ler(chave) {
  try {
    const bruto = localStorage.getItem(chave)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista : []
  } catch (e) { return [] }
}

function gravar(chave, lista) {
  try { localStorage.setItem(chave, JSON.stringify(lista)) } catch (e) { /* sem espaço ou bloqueado */ }
}

/* A conta das duas listas é a mesma: o novo vai para a frente, a repetição
   anterior sai, e o fim é cortado no teto. Fica aqui, pura e separada, para
   ter teste — é a única parte que pode errar. */
export function comORecente(lista, item, teto) {
  const resto = lista.filter(x => x !== item)
  return [item, ...resto].slice(0, teto)
}

export const lerBuscas = () => ler(CHAVE_BUSCAS)

/** Chamada no Enter: é ali que a pessoa diz "era isto que eu queria". */
export function guardarBusca(termo) {
  const limpo = String(termo || '').trim()
  if (!limpo) return lerBuscas()
  const nova = comORecente(lerBuscas(), limpo, MAX_BUSCAS)
  gravar(CHAVE_BUSCAS, nova)
  return nova
}

export const lerVistos = () => ler(CHAVE_VISTOS).filter(id => Number.isFinite(id))

/** Chamada ao abrir a ficha de uma obra. */
export function guardarVisto(id) {
  if (!Number.isFinite(id)) return lerVistos()
  const nova = comORecente(lerVistos(), id, MAX_VISTOS)
  gravar(CHAVE_VISTOS, nova)
  return nova
}

/** As obras dos ids guardados, na ordem em que foram vistas. Id morto — obra
    apagada — some sozinho, em vez de virar miniatura quebrada. */
export function obrasVistas(ids, obras) {
  return ids.map(id => obras.find(o => o.id === id)).filter(Boolean)
}

export function limparRecentes() {
  for (const c of CHAVES_RECENTES) {
    try { localStorage.removeItem(c) } catch (e) { /* */ }
  }
}
