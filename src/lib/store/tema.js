import { useCallback, useEffect, useRef, useState } from 'react'

/* O TEMA. Saiu do store.jsx porque não conversa com mais nada: lê e grava uma
   chave só, e pendura um atributo no <html>. */
export function useTema() {
  /* O TEMA é o nome de um bloco `[data-tema=...]` do index.css.
   *
   * A lista mora aqui porque é ela que diz o que é válido guardar: um
   * `gibiteca_tema` com lixo dentro — arquivo editado à mão, versão antiga,
   * sincronia de outro aparelho — cai no padrão em vez de pendurar um
   * atributo que nenhum CSS atende.
   *
   * O PADRÃO não escreve atributo nenhum: ele É o `:root`. O atributo só
   * existe quando há desvio, então o dia em que o Moss deixar de ser o
   * padrão nada fica pendurado no html.
   */
  const TEMA_PADRAO = 'moss'
  const TEMAS_VALIDOS = ['moss', 'nockout', 'candy', 'midnight']
  const [tema, setTemaState] = useState(() => {
    try {
      const t = localStorage.getItem('gibiteca_tema')
      return TEMAS_VALIDOS.includes(t) ? t : TEMA_PADRAO
    } catch (e) { return TEMA_PADRAO }
  })
  /* A TROCA DE TEMA É ANIMADA, e a animação só existe durante a troca.
   *
   * Trocar o atributo repinta a página inteira num quadro só: fundo, tinta,
   * bordas e ícones saltam de uma paleta para a outra. Funciona, e é seco.
   *
   * O jeito óbvio — pôr `transition: background-color, color…` no CSS geral —
   * cobraria caro o ano inteiro para enfeitar um clique por mês: TODO hover,
   * TODO foco e TODA pastilha que acende passariam a arrastar meio segundo.
   *
   * Então a transição é LIGADA SÓ NO MOMENTO da troca, por uma classe no
   * `<html>` que sai sozinha logo depois (ver `.trocando-tema` no index.css).
   * Fora desse instante, o CSS é exatamente o que era.
   *
   * NÃO ANIMA NA PRIMEIRA PASSADA. Este efeito também roda na montagem, para
   * pendurar o tema guardado — e ali não houve troca nenhuma: a página
   * nasceria esmaecendo as próprias cores, como se estivesse carregando.
   *
   * O `setTimeout` é mais longo que a transição de propósito. Ele só precisa
   * não cortar o movimento no meio; sobrar um pouco não custa nada, e deixa
   * os dois números livres para divergir sem ninguém ter de sincronizá-los.
   */
  const primeiraPintura = useRef(true)
  useEffect(() => {
    const html = document.documentElement
    const pintar = () => {
      if (tema === TEMA_PADRAO) delete html.dataset.tema
      else html.dataset.tema = tema
    }

    if (primeiraPintura.current) { primeiraPintura.current = false; pintar(); return }

    html.classList.add('trocando-tema')
    pintar()
    const t = setTimeout(() => html.classList.remove('trocando-tema'), 700)
    /* Trocando de tema duas vezes seguidas, a limpeza da primeira tiraria a
       classe no meio da segunda — e a segunda troca sairia seca. */
    return () => clearTimeout(t)
  }, [tema])
  const setTema = useCallback((t) => {
    const valido = TEMAS_VALIDOS.includes(t) ? t : TEMA_PADRAO
    setTemaState(valido)
    try { localStorage.setItem('gibiteca_tema', valido) } catch (e) { /* navegador sem storage */ }
  }, [])

  return [tema, setTema]
}
