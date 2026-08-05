import { useStore } from '../lib/store.jsx'
import { edOf, tipoOf, statusMatch, avgNota, tagsOf, isImp, anyUrg } from '../lib/helpers.js'
import Card from './Card.jsx'
import Marquee from './Marquee.jsx'
import Pagination from './Pagination.jsx'

function ListView({ items, onOpen }) {
  return (
    <div className="overflow-x-auto rounded-xl2 border-[1.5px] border-ink bg-surface shadow-neo-sm">
      <table className="w-full text-left text-[13.5px] min-w-[720px]">
        <thead>
          <tr className="bg-ink text-paper font-mono text-[10px] tracking-widest uppercase">
            {['Título', 'Editora', 'Tipo', 'Status', 'Nota'].map(h => (
              <th key={h} className="px-3.5 py-3 font-bold first:rounded-tl-[12px] last:rounded-tr-[12px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(o => {
            const owns = statusMatch(o, 'biblioteca')
            return (
              <tr key={o.id} onClick={() => onOpen?.(o)} className="border-t border-paper-3 hover:bg-surface-2 cursor-pointer transition-colors">
                <td className="px-3.5 py-2.5">
                  <div className="font-serif text-[15px] text-ink flex items-center gap-1.5">
                    {o.nome}
                    {isImp(o) && <span className="pill pill-imp !text-[7.5px] !px-1.5">Imp</span>}
                    {anyUrg(o) && (
                      <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-[5px] bg-rust text-white shrink-0" title="Urgente">
                        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                      </span>
                    )}
                  </div>
                  {tagsOf(o).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tagsOf(o).map(t => <span key={t} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-paper-2 border border-moss-line text-ink-soft">{t}</span>)}
                    </div>
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-ink-soft">{edOf(o) || '—'}</td>
                <td className="px-3.5 py-2.5 text-ink-soft capitalize">{tipoOf(o)}</td>
                <td className="px-3.5 py-2.5"><span className={`pill ${owns ? 'pill-tenho' : 'pill-quero'}`}>{owns ? 'Tenho' : 'Quero'}</span></td>
                <td className="px-3.5 py-2.5 text-gold font-semibold">{avgNota(o) ? avgNota(o).toFixed(1) + '★' : <span className="text-ink-faint">—</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Collection({ onOpen }) {
  const { view, total, pageItems, obras } = useStore()

  if (total === 0) {
    return (
      <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-5">
        <div className="rounded-xl2 border border-dashed border-moss-line px-5 py-16 text-center text-ink-faint">
          <div className="font-serif text-[22px] text-moss mb-1.5 bg-gradient-to-r from-moss via-gold to-moss bg-[length:200%_auto] bg-clip-text text-transparent animate-[shine_3.6s_linear_infinite]">Nada por aqui</div>
          {obras.length === 0
            ? <>Sua coleção está vazia neste preview. <br />Clique em <b className="text-ink">Backup</b> (no topo) e carregue seu <b className="text-ink">gibiteca-dados.json</b> pra ver tudo aqui.</>
            : <>Nenhuma obra corresponde aos filtros. Ajuste a busca ou os filtros.</>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-4">
      <Marquee onOpen={onOpen} />
      {view === 'galeria'
        ? <div className="grid gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fill,minmax(148px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(168px,1fr))]">
            {pageItems.map((o, i) => <Card key={o.id} obra={o} index={i} onOpen={onOpen} />)}
          </div>
        : <ListView items={pageItems} onOpen={onOpen} />}
      <Pagination />
    </div>
  )
}
