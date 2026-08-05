import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

export default function Ticker({ value = 0, duration = 0.9 }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion:reduce)').matches
    if (reduce) { setDisplay(value); prev.current = value; return }
    const controls = animate(prev.current, value, {
      duration, ease: [0.2, 0.8, 0.3, 1],
      onUpdate: v => setDisplay(Math.round(v)),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])
  return <>{display}</>
}
