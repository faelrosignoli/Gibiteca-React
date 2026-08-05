import { AnimatePresence, motion } from 'framer-motion'
import { GENRES } from '../data.js'

export default function GenrePicker({ open, selected, onToggle, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-3 bg-ink/45 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full max-w-[560px] max-h-[82vh] flex flex-col rounded-[16px] border-[1.5px] border-ink bg-paper overflow-hidden shadow-[0_30px_70px_-24px_rgba(35,39,28,.7)]"
            initial={{ y: 14, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b-[1.5px] border-moss-line">
              <h3 className="font-serif text-[19px] text-moss">Gêneros <span className="font-mono text-[12px] text-ink-faint">({selected.length})</span></h3>
              <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm hover:bg-paper-2" onClick={onClose}>×</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))] gap-2">
                {GENRES.map(g => {
                  const on = selected.includes(g)
                  return (
                    <button key={g} type="button" onClick={() => onToggle(g)}
                      className={`inline-flex items-center justify-center gap-1 text-center leading-tight px-2.5 py-2 rounded-full border-[1.6px] border-ink text-[11.5px] font-semibold shadow-neo-sm transition hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px ${on ? 'bg-moss text-white' : 'bg-surface text-ink hover:bg-paper-2'}`}>
                      {on && <span className="text-[10px] font-extrabold">✓</span>}{g}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex px-5 py-3.5 border-t-[1.5px] border-moss-line">
              <button className="neo-btn neo-btn-moss ml-auto" onClick={onClose}>Concluir</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
