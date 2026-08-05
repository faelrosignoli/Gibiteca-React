import { useStore } from '../lib/store.jsx'

function pageList(cur, tot) {
  const out = []
  if (tot <= 7) { for (let i = 1; i <= tot; i++) out.push(i); return out }
  out.push(1)
  let s = Math.max(2, cur - 1), e = Math.min(tot - 1, cur + 1)
  if (cur <= 3) { s = 2; e = 4 }
  if (cur >= tot - 2) { s = tot - 3; e = tot - 1 }
  if (s > 2) out.push('…')
  for (let i = s; i <= e; i++) out.push(i)
  if (e < tot - 1) out.push('…')
  out.push(tot)
  return out
}

export default function Pagination() {
  const { page, totalPages, total, start, pageItems, pageSize, setPage, setPageSize, all } = useStore()
  const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return (
    <div className="mt-8 flex flex-col items-center gap-3.5">
      {!all && totalPages > 1 && (
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button className="neo-btn disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0" disabled={page <= 1} onClick={() => go(page - 1)}>‹ Anterior</button>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {pageList(page, totalPages).map((n, i) => n === '…'
              ? <span key={'e' + i} className="text-ink-faint px-0.5">…</span>
              : <button key={n} onClick={() => go(n)}
                  className={`min-w-[38px] h-[38px] px-2 rounded-[10px] border-[1.7px] border-ink font-semibold text-[13px] shadow-neo-sm transition hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px ${n === page ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-paper-2'}`}>{n}</button>)}
          </div>
          <button className="neo-btn disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0" disabled={page >= totalPages} onClick={() => go(page + 1)}>Próxima ›</button>
        </div>
      )}
      <div className="flex items-center gap-4 flex-wrap justify-center text-[12.5px] text-ink-soft">
        <span>{total ? `${start + 1}–${start + pageItems.length}` : '0'} de {total}</span>
        <label className="inline-flex items-center gap-2">Por página
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
            className="rounded-lg border-[1.5px] border-ink bg-paper px-2.5 py-1.5 font-semibold text-[12.5px] shadow-neo-sm cursor-pointer">
            {[20, 40, 80].map(v => <option key={v} value={v}>{v}</option>)}
            <option value={99999}>Todas</option>
          </select>
        </label>
      </div>
    </div>
  )
}
