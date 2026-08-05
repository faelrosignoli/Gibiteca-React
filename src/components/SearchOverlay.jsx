import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useStore } from '../lib/store.jsx'

export default function SearchOverlay({ open, onClose }) {
  const { filters, setFilter } = useStore()
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[8vh] bg-ink/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full max-w-[620px] relative"
            initial={{ y: -12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              ref={inputRef}
              value={filters.q}
              onChange={e => setFilter('q', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onClose() }}
              placeholder="Buscar por título, editora, roteirista ou desenhista…"
              className="w-full rounded-[14px] border-[1.5px] border-moss bg-surface pl-12 pr-14 py-4 text-[16px] text-ink outline-none shadow-[0_24px_54px_-20px_rgba(0,0,0,.55)]"
            />
            <button
              onClick={onClose} aria-label="Fechar"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[9px] bg-paper-2 hover:bg-paper-3 text-ink-soft flex items-center justify-center text-[15px]"
            >✕</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
