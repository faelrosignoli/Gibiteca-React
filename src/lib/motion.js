import { useEffect, useState } from 'react'

/* Tokens de movimento — vocabulário da skill apple-design.
 *
 * A Apple pensa movimento em dois parâmetros, não em massa/rigidez:
 *   - amortecimento: controla a ultrapassagem do alvo (1.0 = não passa)
 *   - resposta: em quanto tempo chega perto do alvo, em segundos
 * O framer-motion expõe isso como `bounce` + `duration`, que é o mesmo par.
 *
 * Regra de uso: mola calma como padrão. Só use a de momento quando o
 * gesto do usuário trouxe velocidade (um arrasto, um peteleco). Passar do
 * alvo num menu que só apareceu parece errado; num painel que você jogou,
 * parece certo.
 */

/** Padrão de interface: não passa do alvo. */
export const MOLA_CALMA = { type: 'spring', bounce: 0, duration: 0.4 }

/** Gaveta e folha: leve ultrapassagem, porque vem de um gesto. */
export const MOLA_GAVETA = { type: 'spring', bounce: 0.18, duration: 0.3 }

/** Resposta a toque: curta e sem ultrapassagem. */
export const MOLA_TOQUE = { type: 'spring', bounce: 0, duration: 0.22 }

/** Backdrop e outros fades: opacidade não precisa de mola. */
export const FADE = { duration: 0.22, ease: [0.32, 0.72, 0, 1] }

/** Volta ao lugar depois de um arrasto que não virou dispensa. */
export const VOLTA_DO_ARRASTO = { bounceStiffness: 520, bounceDamping: 42 }

/**
 * Resistência nas bordas durante o arrasto, por lado.
 * 1 = segue o dedo 1:1 (o lado para onde a dispensa acontece)
 * 0.06 = resiste progressivamente (o lado que não leva a lugar nenhum)
 */
export const ELASTICO_DIREITA = { left: 0.06, right: 1, top: 0, bottom: 0 }
export const ELASTICO_BAIXO = { top: 0.06, bottom: 1, left: 0, right: 0 }

/**
 * Projeção de momento: onde o gesto ia parar se ninguém o segurasse.
 * É a forma exponencial que a Apple usa — não a fórmula de física v²/2a.
 * Serve para escolher o alvo a partir de onde o gesto IA CHEGAR, e não de
 * onde o dedo por acaso soltou. É o que faz um peteleco parecer arremesso.
 */
export function projetar(velocidade, desaceleracao = 0.998) {
  return (velocidade / 1000) * desaceleracao / (1 - desaceleracao)
}

/**
 * Decide se um arrasto vira dispensa.
 * Com velocidade alta o SINAL decide (o usuário foi claro na intenção);
 * caso contrário decide a projeção, comparada a uma fração do tamanho.
 */
export function deveDispensar({ deslocamento, velocidade, tamanho, fracao = 0.4 }) {
  if (velocidade > 520) return true
  if (velocidade < -520) return false
  return deslocamento + projetar(velocidade) > tamanho * fracao
}

/* ------------------------------------------------------------------ */

/**
 * A gaveta some para a direita no desktop e para baixo no mobile — e o
 * arrasto tem que sair pelo mesmo lado por onde ela entrou. 640px é o
 * breakpoint `sm:` do Tailwind, o mesmo que o CSS das gavetas usa.
 */
export function useEhDesktop() {
  const [ehDesktop, setEhDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const ouvir = e => setEhDesktop(e.matches)
    mq.addEventListener('change', ouvir)
    setEhDesktop(mq.matches)
    return () => mq.removeEventListener('change', ouvir)
  }, [])
  return ehDesktop
}

/** Respeita quem pediu menos movimento no sistema. */
export function usaMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ouvir = e => setReduzido(e.matches)
    mq.addEventListener('change', ouvir)
    setReduzido(mq.matches)
    return () => mq.removeEventListener('change', ouvir)
  }, [])
  return reduzido
}
