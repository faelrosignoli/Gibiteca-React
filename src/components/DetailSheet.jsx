import { AnimatePresence, motion } from 'framer-motion'
import { coverOf, tipoOf, edOf, authorsOf, tagsOf, avgNota, unitsOf, ownedCount, sumValor, fmtBRL, statusMatch } from '../lib/helpers.js'

export default function DetailSheet({ obra, onClose }) {
  return (
    <AnimatePresence>
      {obra && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed z-50 bg-paper border-moss-line flex flex-col right-0 top-0 h-full w-[min(460px,100%)] border-l-[1.5px] sm:rounded-none max-sm:top-auto max-sm:bottom-0 max-sm:w-full max-sm:h-auto max-sm:max-h-[92vh] max-sm:rounded-t-[20px] max-sm:border-l-0 max-sm:border-t-[1.5px]"
            initial={{ x: 40, opacity: 0.4 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b-[1.5px] border-moss-line">
              <h3 className="font-serif text-[20px] text-moss truncate pr-3">{obra.nome}</h3>
              <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm shrink-0" onClick={onClose}>×</button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <div className="flex gap-4">
                <div className="w-28 shrink-0 rounded-lg overflow-hidden border-[1.5px] border-ink bg-white aspect-[3/4] flex items-center justify-center shadow-neo-sm">
                  {coverOf(obra) ? <img src={coverOf(obra)} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-ink-faint text-xs p-2 text-center">sem capa</span>}
                </div>
                <div className="text-sm space-y-1.5 min-w-0">
                  {edOf(obra) && <div><span className="text-ink-faint">Editora:</span> {edOf(obra)}</div>}
                  <div className="capitalize"><span className="text-ink-faint">Tipo:</span> {tipoOf(obra)}</div>
                  {obra.pais && <div><span className="text-ink-faint">País:</span> {obra.pais}</div>}
                  {authorsOf(obra).length > 0 && <div><span className="text-ink-faint">Autores:</span> {authorsOf(obra).join(', ')}</div>}
                  <div><span className="text-ink-faint">Status:</span> {statusMatch(obra,'biblioteca') ? 'Tenho' : 'Quero'}</div>
                  {avgNota(obra) > 0 && <div className="text-gold">{avgNota(obra).toFixed(1)}★</div>}
                  {sumValor(obra) > 0 && <div><span className="text-ink-faint">Investido:</span> {fmtBRL(sumValor(obra))}</div>}
                </div>
              </div>
              {tagsOf(obra).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">{tagsOf(obra).map(t => <span key={t} className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-moss text-white">{t}</span>)}</div>
              )}
              {obra.resenha && <p className="mt-4 text-[13.5px] text-ink-soft leading-relaxed whitespace-pre-wrap border-t border-moss-line pt-3">{obra.resenha}</p>}
              {(tipoOf(obra) === 'serie' || tipoOf(obra) === 'box') && (
                <div className="mt-4 border-t border-moss-line pt-3">
                  <div className="font-mono text-[10px] tracking-widest uppercase text-ink-faint mb-2">Volumes — {ownedCount(obra)}/{unitsOf(obra).length}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {unitsOf(obra).map((v, i) => (
                      <div key={i} className={`text-[12px] px-2.5 py-1.5 rounded-lg border ${v.status === 'biblioteca' ? 'border-moss/50 bg-moss/5' : 'border-moss-line'}`}>
                        <span className="font-semibold">{v.nome || `Vol. ${i + 1}`}</span>
                        <span className={`ml-1.5 text-[9px] font-mono uppercase ${v.status === 'biblioteca' ? 'text-moss' : 'text-gold'}`}>{v.status === 'biblioteca' ? 'tenho' : 'quero'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
