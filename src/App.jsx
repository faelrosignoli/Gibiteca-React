import { useEffect, useRef } from 'react'
import markupRaw from './gibiteca/markup.html?raw'
import { bootGibiteca } from './gibiteca/logic.js'
import { EDITORAS } from './data.js'
import logo from './assets/logo.png'
import './app.css'

/*
  Fase 1 da migração: o app "Minha Gibiteca" roda aqui dentro exatamente como
  na versão HTML (mesmo markup, mesmo CSS, mesma lógica). Conforme formos fazendo
  as mudanças visuais, cada parte (cabeçalho, cards, editor…) vira um componente
  React de verdade.
*/
export default function App() {
  const hostRef = useRef(null)
  const inited = useRef(false)

  useEffect(() => {
    if (inited.current || !hostRef.current) return
    inited.current = true
    hostRef.current.innerHTML = markupRaw.split('__LOGO_URI__').join(logo)
    bootGibiteca({ obras: [], editoras: EDITORAS })
  }, [])

  return <div ref={hostRef} />
}
