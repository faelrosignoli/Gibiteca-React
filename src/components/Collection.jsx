import { useStore } from '../lib/store.jsx'
import { edOf, tipoOf, statusMatch, avgNota, tagsOf } from '../lib/helpers.js'
import Card from './Card.jsx'
import Marquee from './Marquee.jsx'
import Pagination from './Pagination.jsx'

function ListView({ items, onOpen }) {
  return (
    <div className="overflow-x-auto rounded-xl2 border-[1.5px] border-moss-line bg-surface">
      <table className="w-full text-left text-[13.5px]">
        <thead className="font-mono text-[9.5px] tracking-widest uppercase text-ink-faint border-b border-moss-line">
          <tr>{['Título', 'Editora', 'Tipo', 'Status', 'Nota'].map(h => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map(o => (
            <tr key={o.id} onClick={() => onOpen?.(o)} className="border-b border-moss-line/60 hover:bg-paper-2 cursor-pointer">
              <td className="px-3 py-2.5">
                <div className="font-serif text-[15px] text-ink">{o.nome}</div>
                {tagsOf(o).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{tagsOf(o).map(t => <span key={t} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-paper-2 border border-moss-line text-ink-soft">{t}</span>)}</div>}
              </td>
              <td className="px-3 py-2.5 text-ink-soft">{edOf(o) || '—'}</td>
              <td className="px-3 py-2.5 text-ink-soft capitalize">{tipoOf(o)}</td>
              <td className="px-3 py-2.5"><span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full border ${statusMatch(o,'biblioteca') ? 'border-moss text-moss' : 'border-gold text-gold'}`}>{statusMatch(o,'biblioteca') ? 'Tenho' : 'Quero'}</span></td>
              <td className="px-3 py-2.5 text-gold">{avgNota(o) ? avgNota(o).toFixed(1) + '★' : '—'}</td>
            </tr>
          ))}
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
            ? <>Sua coleção está vazia neste preview. <br/>Clique em <b className="text-ink">Backup</b> (no topo) e carregue seu <b className="text-ink">gibiteca-dados.json</b> pra ver tudo aqui.</>
            : <>Nenhuma obra corresponde aos filtros. Ajuste a busca ou os filtros.</>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1320px] px-3 sm:px-4 mt-4">
      <Marquee onOpen={onOpen} />
      {view === 'galeria'
        ? <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
            {pageItems.map((o, i) => <Card key={o.id} obra={o} index={i} onOpen={onOpen} />)}
          </div>
        : <ListView items={pageItems} onOpen={onOpen} />}
      <Pagination />
    </div>
  )
}
