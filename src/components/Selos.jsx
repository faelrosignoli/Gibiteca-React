import { useLayoutEffect, useRef, useState } from 'react'

/* Linha de selos do cartão, com teto de duas linhas.
 *
 * O cartão é estreito — no celular, em duas colunas, sobram ~141px — e a linha
 * carrega status, importado, nota e o tipo da edição. Sem teto ela vira quatro
 * linhas, empurra o resto do cartão para baixo e desalinha a grade inteira.
 *
 * O que não couber em duas linhas vira uma pílula "+N". Passar o mouse mostra
 * o resto; no toque, um toque abre — "hover" não existe em celular, e é
 * justamente lá que o corte mais acontece.
 *
 * A conta não chuta quantos cabem: mede a largura real de cada selo (elas
 * variam muito — "Tenho 4/12" contra "Bolso") e empacota em linhas, contando
 * também a largura do próprio "+N", que precisa caber junto. Um limite fixo
 * erraria nos dois sentidos; a versão anterior, que só olhava em que linha
 * cada selo tinha caído, era pessimista e cortava na primeira.
 */
export default function Selos({ children }) {
  const itens = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean)
  const caixa = useRef(null)
  const sonda = useRef(null)
  const [cabem, setCabem] = useState(itens.length)
  const [medindo, setMedindo] = useState(true)
  const [aberto, setAberto] = useState(false)
  const larguraMedida = useRef(0)

  useLayoutEffect(() => {
    const el = caixa.current
    if (!el) return

    const medir = () => {
      const largura = el.clientWidth
      if (!largura) return                       // fora da tela: mede depois
      const selos = [...el.children].filter(f => !f.dataset.medida)
      if (!selos.length) return
      const larguras = selos.map(f => f.offsetWidth)
      const vao = parseFloat(getComputedStyle(el).columnGap) || 0
      const extra = sonda.current ? sonda.current.offsetWidth : 30

      // quantas linhas essas larguras ocupam, empacotando na ordem
      const linhas = (ws) => {
        let n = 1, x = 0
        for (const w of ws) {
          if (x === 0) x = w
          else if (x + vao + w <= largura + 0.5) x += vao + w
          else { n++; x = w }
        }
        return n
      }

      let k = larguras.length
      while (k > 1) {
        const teste = k < larguras.length ? [...larguras.slice(0, k), extra] : larguras
        if (linhas(teste) <= 2) break
        k--
      }
      larguraMedida.current = largura
      setCabem(k)
      setMedindo(false)
    }

    setMedindo(true)                             // mede sempre com tudo à mostra
    setCabem(itens.length)
    const id = requestAnimationFrame(medir)
    /* Só a LARGURA importa. Reagir à altura seria um laço: esconder selos
     * encolhe a caixa, o que dispararia outra medição, que os mostraria de
     * novo. */
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      if (el.clientWidth === larguraMedida.current) return
      setMedindo(true)
      setCabem(itens.length)
      requestAnimationFrame(medir)
    }) : null
    ro?.observe(el)
    return () => { cancelAnimationFrame(id); ro?.disconnect() }
  }, [itens.length])

  const visiveis = itens.slice(0, cabem)
  const escondidos = itens.slice(cabem)

  return (
    <div ref={caixa} className="relative mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {visiveis}

      {/* sonda: dá a largura do "+N" antes de ele existir, sem entrar no fluxo */}
      {medindo && (
        <span ref={sonda} data-medida="1" aria-hidden="true"
          className="pill !px-2 font-bold absolute invisible pointer-events-none">+{itens.length}</span>
      )}

      {escondidos.length > 0 && (
        <span
          data-medida="1"
          className="relative inline-flex"
          onMouseEnter={() => setAberto(true)}
          onMouseLeave={() => setAberto(false)}
        >
          <button
            type="button"
            aria-label={'Mostrar mais ' + escondidos.length}
            aria-expanded={aberto}
            onClick={(e) => { e.stopPropagation(); setAberto(a => !a) }}
            className="pill pill-quero !px-2 font-bold"
          >+{escondidos.length}</button>

          {aberto && (
            <span
              className="absolute bottom-full right-0 mb-1.5 z-20 flex flex-col items-end gap-1
                         rounded-medio border border-separador bg-surface p-2 shadow-amb-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {escondidos}
            </span>
          )}
        </span>
      )}
    </div>
  )
}
