import { useCallback, useState } from 'react'

/* AS LISTAS. A única coisa de fora é `marcarAlterado`. */
export function useListas({ inicial, marcarAlterado }) {
  /* ---- listas ----
   *
   * Pastas feitas à mão. Moram junto das obras em `gibiteca_v1`, pelo mesmo
   * motivo da fila: é trabalho, e trabalho vai no backup e na nuvem.
   *
   * O id da lista sai do maior em uso + 1, igual ao das obras. Não se
   * reaproveita id de lista apagada: o Editor guarda, enquanto está aberto,
   * a quais listas a obra vai entrar, e um id reciclado faria esse rascunho
   * apontar para a lista errada.
   */
  const [listas, setListas] = useState(inicial)

  const criarLista = useCallback((nome, ids = []) => {
    const limpo = String(nome || '').trim()
    if (!limpo) return null
    let nova = null
    marcarAlterado()
    setListas(lista => {
      const id = lista.reduce((m, l) => Math.max(m, l.id || 0), 0) + 1
      /* `[...new Set(ids)]`: a tela de escolha não deixa marcar duas vezes,
         mas quem chama pode vir de outro lugar — e id repetido apareceria
         duas vezes na galeria, com a mesma capa. */
      nova = { id, nome: limpo, obras: [...new Set(ids)] }
      return [...lista, nova]
    })
    return nova
  }, [])

  const renomearLista = useCallback((id, nome) => {
    const limpo = String(nome || '').trim()
    if (!limpo) return                       // lista sem nome não se acha depois
    marcarAlterado()
    setListas(lista => lista.map(l => (l.id === id ? { ...l, nome: limpo } : l)))
  }, [])

  /* Apagar a lista NÃO toca nas obras. É pasta, não caixa: desfazer a pasta
     não joga fora o que estava dentro. */
  /* Numerar ou não — escolha POR LISTA, não um ajuste global.
   *
   * "Para reler" não tem ordem; "Ler nesta ordem" tem. O mesmo app serve os
   * dois casos, e quem sabe qual é o caso é quem fez a lista.
   *
   * Lista antiga não tem o campo, e `undefined` é falso: ela abre sem
   * numeração, que é como estava. Nada a migrar.
   */
  /* A ordem das obras dentro de UMA lista.
   *
   * Só a lista numerada usa: na alfabética a ordem é calculada na tela e o
   * array guardado não importa. Guardar mesmo assim é de propósito — quem
   * volta de alfabética para numerada reencontra a ordem que tinha montado,
   * em vez de uma lista remexida.
   */
  const reordenarLista = useCallback((id, ids) => {
    marcarAlterado()
    setListas(lista => lista.map(l => (l.id === id ? { ...l, obras: ids } : l)))
  }, [])

  const alternarNumeracao = useCallback((id) => {
    marcarAlterado()
    setListas(lista => lista.map(l => (l.id === id ? { ...l, numerada: !l.numerada } : l)))
  }, [])

  const apagarLista = useCallback((id) => {
    marcarAlterado()
    setListas(lista => lista.filter(l => l.id !== id))
  }, [])

  /* Põe ou tira uma obra de UMA lista. Entra no fim: a ordem da galeria é a
     ordem em que as coisas foram postas, e quem chega depois não passa na
     frente. */
  const alternarNaLista = useCallback((listaId, obraId) => {
    marcarAlterado()
    setListas(lista => lista.map(l => {
      if (l.id !== listaId) return l
      const dentro = l.obras.includes(obraId)
      return { ...l, obras: dentro ? l.obras.filter(x => x !== obraId) : [...l.obras, obraId] }
    }))
  }, [])

  /* Diz de uma vez EM QUAIS listas a obra está — é como o Editor salva.
   *
   * Tem de ser uma operação só, e não um `alternarNaLista` por lista: o
   * Editor entrega o conjunto final, e aplicar em várias passadas faria cada
   * uma gravar e disparar envio para a nuvem.
   *
   * Remover de onde saiu é tão importante quanto pôr onde entrou: sem isso,
   * desmarcar uma lista no Editor não desmarcaria nada. */
  const definirListasDaObra = useCallback((obraId, ids) => {
    const alvo = new Set(ids || [])
    marcarAlterado()
    setListas(lista => lista.map(l => {
      const dentro = l.obras.includes(obraId)
      const deveEstar = alvo.has(l.id)
      if (dentro === deveEstar) return l
      return { ...l, obras: deveEstar ? [...l.obras, obraId] : l.obras.filter(x => x !== obraId) }
    }))
  }, [])

  /* Obra apagada sai de todas as listas.
   *
   * A leitura já descarta id morto, então isto é faxina, não correção — mas
   * faxina que importa: sem ela o arquivo guardado acumularia ids de obras
   * que não existem mais, e cada backup carregaria esse lixo para a frente. */
  const podarListas = useCallback((obrasNovas) => {
    const vivos = new Set((obrasNovas || []).map(o => o.id))
    setListas(lista => {
      let mudou = false
      const nova = lista.map(l => {
        const obras = l.obras.filter(id => vivos.has(id))
        if (obras.length === l.obras.length) return l
        mudou = true
        return { ...l, obras }
      })
      return mudou ? nova : lista
    })
  }, [])

  /* Desmembrar: a série sai das listas e os VOLUMES entram no lugar dela.
   *
   * Podar e pronto seria perda silenciosa — a obra estava em "Para reler" e
   * sumiria de lá sem ninguém mexer na lista. Os volumes agora são obras de
   * verdade, e são eles que herdam o lugar, na posição onde a série estava.
   *
   * Sim, uma entrada vira N. Mas isso se VÊ na galeria, e ver é melhor que
   * descobrir a falta meses depois. */
  const trocarNasListas = useCallback((idVelho, idsNovos) => {
    setListas(lista => lista.map(l => {
      const i = l.obras.indexOf(idVelho)
      if (i < 0) return l
      return { ...l, obras: [...l.obras.slice(0, i), ...idsNovos, ...l.obras.slice(i + 1)] }
    }))
  }, [])

  return {
    listas, setListas, criarLista, renomearLista, reordenarLista,
    alternarNumeracao, apagarLista, alternarNaLista, definirListasDaObra,
    podarListas, trocarNasListas,
  }
}
