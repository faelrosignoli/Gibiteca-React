import { useStore } from '../lib/store.jsx'
import Selecao from './Selecao.jsx'

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
          <button className="pill-btn disabled:opacity-40" disabled={page <= 1} onClick={() => go(page - 1)}>‹ Anterior</button>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {pageList(page, totalPages).map((n, i) => n === '…'
              ? <span key={'e' + i} className="text-ink-faint px-0.5">…</span>
              : <button key={n} onClick={() => go(n)}
 className={`min-w-[38px] h-[38px] px-2 rounded-full font-semibold text-corpo transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${n === page ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink hover:bg-toque'}`}>{n}</button>)}
          </div>
          <button className="pill-btn disabled:opacity-40" disabled={page >= totalPages} onClick={() => go(page + 1)}>Próxima ›</button>
        </div>
      )}
      <div className="flex items-center gap-4 flex-wrap justify-center text-apoio text-ink-soft">
        <span>{total ? `${start + 1}–${start + pageItems.length}` : '0'} de {total}</span>
        <span className="inline-flex items-center gap-2">Por página
          {/* era o último <select> nativo do app — sozinho ele destoaria dos
              outros agora que Filtros e Editor têm folha própria */}
          <Selecao
            compacto className="w-24"
            value={String(pageSize)}
            onChange={v => setPageSize(Number(v))}
            options={[['20', '20'], ['40', '40'], ['80', '80'], ['99999', 'Todas']]}
          />
        </span>
      </div>
    </div>
  )
}
