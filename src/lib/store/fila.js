import { useCallback, useState } from 'react'
import { chaveFila, volsOf } from '../helpers.js'

/* A FILA DE LEITURA. Depende de duas coisas de fora, e por isso elas chegam
   como argumento: `marcarAlterado` (para a gravação e o envio à nuvem
   saberem que algo mudou) e `setObras` (marcar lido mexe na obra, não na
   fila). */
export function useFila({ inicial, marcarAlterado, setObras }) {
  /* ---- fila de leitura ----
   *
   * Mora DENTRO de `gibiteca_v1`, junto das obras, e não numa chave própria
   * como `gibiteca_fixada`. A diferença é o que se perde ao perder: a fixada
   * é um enfeite da grade, se refaz num clique. A fila é trabalho — uma ordem
   * escolhida a dedo — e trabalho tem de ir junto no backup e na nuvem.
   *
   * O custo é que toda gravação carrega a fila, e um backup antigo não a tem.
   * Por isso a leitura é sempre defensiva: sem `fila` no arquivo, fila vazia.
   */
  const [fila, setFila] = useState(inicial)

  /* Põe ou tira. Um botão só, nos dois lados — no detalhe da obra e na
     própria fila —, porque a pergunta é a mesma: está na fila ou não? */
  const alternarFila = useCallback((id, vol = null) => {
    marcarAlterado()
    setFila(lista => {
      const k = chaveFila(id, vol)
      const i = lista.findIndex(e => chaveFila(e.id, e.vol) === k)
      if (i >= 0) return lista.filter((_, n) => n !== i)
      /* Entra NO FIM. A fila é uma ordem de leitura, e o que se acabou de
         lembrar não passa na frente do que já estava esperando — quem decide
         isso é o arrasto. */
      return [...lista, { id, vol }]
    })
  }, [])

  const removerDaFila = useCallback((id, vol = null) => {
    marcarAlterado()
    const k = chaveFila(id, vol)
    setFila(lista => lista.filter(e => chaveFila(e.id, e.vol) !== k))
  }, [])

  /* A nova ordem chega pronta do arrasto (Reorder do framer-motion), com as
     MESMAS entradas em ordem diferente. Não se valida nada aqui: validar
     significaria comparar listas a cada quadro de arrasto. */
  const reordenarFila = useCallback((nova) => {
    marcarAlterado()
    setFila(nova)
  }, [])

  /* Marcar lido pela fila.
   *
   * Grava `lido` e a nota na unidade certa — a obra, se avulsa; o volume, se
   * for volume — e TIRA da fila. Sair da fila não é efeito colateral: é o fim
   * do ciclo. O que foi lido não é mais o que vem a seguir.
   *
   * Põe na estante (`status: 'biblioteca'`) o que ainda estivesse em
   * "quero". Hoje isso é cinto de segurança, não caminho normal: desde que
   * só o que está na estante entra na fila, não deveria haver "quero" aqui.
   * Mas uma fila guardada ANTES dessa trava — ou vinda da nuvem de um
   * aparelho mais antigo — pode ter, e marcar lido um item de desejo
   * duraria até a próxima edição e sumiria sozinho. */
  const marcarLido = useCallback((id, vol = null, nota = 0) => {
    marcarAlterado()
    setObras(lista => lista.map(o => {
      if (o.id !== id) return o
      const campos = { status: 'biblioteca', urgencia: false, lido: true, nota: Number(nota) || 0 }
      if (vol == null) return { ...o, ...campos }
      const vols = volsOf(o).slice()
      if (!vols[vol]) return o
      vols[vol] = { ...vols[vol], ...campos }
      return { ...o, volumes: vols }
    }))
    removerDaFila(id, vol)
  }, [removerDaFila])


  return { fila, setFila, alternarFila, removerDaFila, reordenarFila, marcarLido }
}
