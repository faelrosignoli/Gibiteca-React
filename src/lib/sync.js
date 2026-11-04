/* QUEM GANHA: a cópia daqui ou a da nuvem.
 *
 * Mora fora do `store.jsx` para poder ser testada: `.jsx` o node não importa,
 * e esta é a parte do app onde um erro faz coleção sumir. */

/** A hora da última alteração de uma coleção. Sem carimbo legível, 0. */
export function carimboDe(d) {
  if (!d) return 0
  if (Number.isFinite(d.atualizadoEm)) return d.atualizadoEm
  const t = Date.parse(d.updated || d.exported || '')
  return Number.isFinite(t) ? t : 0
}

/**
 * O que fazer ao abrir com a nuvem ligada.
 * → 'puxar' | 'enviar' | 'conflito' | 'nada'
 *
 * Carimbo local zero é DESCONHECIDO, não "muito antigo" — é o caso de quem já
 * usava o app antes do carimbo existir. Tratar como antigo faria a nuvem
 * ganhar sempre, e foi assim que um backup restaurado no PC sumiu sozinho.
 * Sem saber quem é mais novo, o app não escolhe: só puxa se aqui não houver
 * nada a perder.
 */
export function decidirAoAbrir({ carimboLocal = 0, carimboNuvem = 0, temCoisaAqui = false } = {}) {
  if (!carimboLocal && temCoisaAqui) return carimboNuvem ? 'conflito' : 'nada'
  if (carimboNuvem > carimboLocal) return 'puxar'
  if (carimboLocal > carimboNuvem) return 'enviar'
  return 'nada'
}

/**
 * Pode gravar por cima do que está na nuvem?
 * `forcar` vem do botão "Enviar agora", onde a pessoa mandou por cima
 * sabendo disso. O envio automático nunca força.
 */
export function haConflitoAoEnviar({ carimboLocal = 0, carimboNuvem = 0, forcar = false } = {}) {
  return !forcar && carimboNuvem > carimboLocal
}

/** Um objeto só é coleção se tiver a lista de obras. */
export function ehColecao(data) {
  return Array.isArray(data && data.obras)
}
