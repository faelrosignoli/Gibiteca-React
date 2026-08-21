import { useEffect, useLayoutEffect, useState } from 'react'

/* Peças comuns das listas suspensas do app (Combo, Selecao).
 *
 * Estavam dentro do Combo; saíram para cá quando o filtro ganhou o mesmo
 * tratamento — duas cópias da mesma medição acabariam desencontrando.
 */

export const ALTURA_LISTA = 232   // altura cheia, quando há espaço de sobra
export const ALTURA_MINIMA = 120  // abaixo disso a lista vira uma fresta inútil
const RESPIRO = 12                // não encostar na borda de quem rola

/* De que lado a lista abre, e com que altura.
 *
 * Quem corta a lista não é a janela: é o container que rola (o corpo do Editor
 * e o da gaveta de Filtros têm overflow-auto), então é o retângulo DELE que
 * manda. E esses corpos são baixos — muitas vezes não cabem 232px para nenhum
 * dos dois lados. Por isso a altura também se ajusta: abre para o lado mais
 * folgado e ocupa só o que cabe, em vez de vazar e ficar cortada.
 */
export function useLugarDaLista(aberto, ref) {
  const [lugar, setLugar] = useState({ cima: false, altura: ALTURA_LISTA })

  useLayoutEffect(() => {
    if (!aberto || !ref.current) return
    let pai = ref.current.parentElement
    let limite = { top: 0, bottom: window.innerHeight }
    while (pai && pai !== document.body) {
      const o = getComputedStyle(pai).overflowY
      if (o === 'auto' || o === 'scroll') { limite = pai.getBoundingClientRect(); break }
      pai = pai.parentElement
    }
    const r = ref.current.getBoundingClientRect()
    const abaixo = limite.bottom - r.bottom - RESPIRO
    const acima = r.top - limite.top - RESPIRO
    // só sobe se em cima couber mais do que embaixo
    const cima = abaixo < ALTURA_LISTA && acima > abaixo
    setLugar({ cima, altura: Math.max(ALTURA_MINIMA, Math.min(ALTURA_LISTA, cima ? acima : abaixo)) })
  }, [aberto, ref])

  return lugar
}

/* Fecha ao clicar fora da caixa — só a lista, nunca o modal que a contém. */
export function useFechaAoClicarFora(aberto, ref, fechar) {
  useEffect(() => {
    if (!aberto) return
    const fora = (e) => { if (ref.current && !ref.current.contains(e.target)) fechar() }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [aberto, ref, fechar])
}

/* Mantém visível a opção destacada pelo teclado. */
export function useSeguirDestaque(aberto, refLista, indice) {
  useEffect(() => {
    if (!aberto || indice < 0 || !refLista.current) return
    const alvo = refLista.current.children[indice]
    // scrollIntoView não existe em todo ambiente (jsdom, por exemplo) — sem a
    // guarda, um detalhe de rolagem derruba o componente inteiro
    if (alvo && typeof alvo.scrollIntoView === 'function') alvo.scrollIntoView({ block: 'nearest' })
  }, [aberto, refLista, indice])
}

/* Classes da folha suspensa — o mesmo desenho para Combo e Selecao. */
export const CLASSE_LISTA =
  'absolute left-0 right-0 z-30 overflow-auto py-1 rounded-medio border border-separador bg-surface shadow-amb-lg'

export const classeOpcao = (destacada) =>
  `w-full text-left px-3.5 py-2 text-corpo transition-colors duration-200 ${destacada ? 'bg-tinta-moss text-ink' : 'text-ink-soft'}`
