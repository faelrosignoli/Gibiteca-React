import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { authorsOf, edOf, moneyToNumber, moneyFormat, tintFor, initials } from '../lib/helpers.js'
import GenrePicker from './GenrePicker.jsx'

const emptyVol = () => ({ nome: '', imagem: null, roteirista: '', desenhista: '', status: 'wishlist', urgencia: false, valorPago: 0, lido: false, nota: 0, _open: true })

function draftFromObra(o) {
  if (!o || !o.id) {
    return { id: null, tipo: 'avulso', nome: '', origem: 'nacional', editora: '', pais: '', genres: [], img: '', resenha: '',
      roteirista: '', desenhista: '', status: 'wishlist', urgencia: false, valorPago: 0, lido: false, nota: 0, vols: [] }
  }
  const tipo = o.tipo === 'avulsa' ? 'avulso' : (o.tipo || (o.volumes ? 'serie' : 'avulso'))
  return {
    id: o.id, tipo, nome: o.nome || '', origem: o.origem || (o.editoraBR ? 'nacional' : 'importado'),
    editora: edOf(o), pais: o.pais || '', genres: Array.isArray(o.tags) ? o.tags.slice() : [],
    img: o.imagem || '', resenha: o.resenha || '',
    roteirista: o.roteirista || '', desenhista: o.desenhista || '',
    status: o.status || 'wishlist', urgencia: !!o.urgencia, valorPago: Number(o.valorPago) || 0,
    lido: !!o.lido, nota: Number(o.nota) || 0,
    vols: Array.isArray(o.volumes) ? o.volumes.map(v => ({ ...emptyVol(), ...v, _open: false })) : [],
  }
}

/* ---------- pequenos controles ---------- */
function Switch({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-[9px] border-[1.5px] border-moss-line overflow-hidden">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`flex-1 text-[13px] font-semibold py-2 px-2 transition ${value === v ? 'bg-moss text-white' : 'bg-surface text-ink-soft hover:bg-paper-2'}`}>{l}</button>
      ))}
    </div>
  )
}
function Stars({ value, onChange, size = 'text-[22px]' }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(value === i ? i - 0.5 : i)}
          className={`${size} leading-none text-gold transition ${value >= i ? '' : value >= i - 0.5 ? 'opacity-60' : 'opacity-25'} hover:scale-110`}>★</button>
      ))}
      {value > 0 && <button type="button" onClick={() => onChange(0)} className="ml-2 text-[11px] text-ink-faint underline">limpar</button>}
    </div>
  )
}
const lbl = "font-mono text-[10px] tracking-[.12em] uppercase text-ink-faint pl-0.5"
const box = "flex flex-col gap-1"

/* ---------- painel de volume ---------- */
function VolPanel({ v, i, withCover, onChange, onCopyAll, onCover }) {
  const owned = v.status === 'biblioteca'
  const fileRef = useRef(null)
  const set = (patch) => onChange(i, patch)
  return (
    <div className="rounded-[10px] border-[1.5px] border-moss-line bg-surface overflow-hidden">
      <button type="button" onClick={() => set({ _open: !v._open })} className="w-full flex items-center gap-2 px-3 py-2 bg-paper-2 text-left">
        <span className="font-mono text-[11px] font-bold text-moss">#{i + 1}</span>
        <span className="text-[13px] text-ink truncate flex-1">{v.nome || `Vol. ${i + 1}`}</span>
        <span className={`pill ${owned ? 'pill-tenho' : 'pill-quero'}`}>{owned ? 'Tenho' : 'Quero'}</span>
        <svg className={`w-4 h-4 text-ink-faint transition ${v._open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {v._open && (
        <div className="p-3 grid grid-cols-2 gap-2.5">
          <div className={`${box} col-span-2`}>
            <label className={lbl}>Nome do volume</label>
            <input className="field-input" value={v.nome} onChange={e => set({ nome: e.target.value })} placeholder={`Vol. ${i + 1}`} />
          </div>
          {withCover && (
            <div className={`${box} col-span-2`}>
              <label className={lbl}>Capa do volume</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-[74px] rounded-md border-[1.5px] border-moss-line bg-white overflow-hidden flex items-center justify-center shrink-0">
                  {v.imagem ? <img src={v.imagem} alt="" className="max-w-full max-h-full object-contain" />
                    : <span className="font-serif text-[15px] text-white w-full h-full flex items-center justify-center" style={{ background: tintFor(v.nome || 'v') }}>{initials(v.nome || (i + 1) + '')}</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onCover(i, e)} />
                <button type="button" className="neo-btn !text-[12px]" onClick={() => fileRef.current?.click()}>Enviar…</button>
                {v.imagem && <button type="button" className="text-[12px] text-rust underline" onClick={() => set({ imagem: null })}>remover</button>}
              </div>
            </div>
          )}
          <div className={box}>
            <label className={lbl}>Roteirista</label>
            <input className="field-input" value={v.roteirista} onChange={e => set({ roteirista: e.target.value })} />
          </div>
          <div className={box}>
            <label className={lbl}>Desenhista</label>
            <input className="field-input" value={v.desenhista} onChange={e => set({ desenhista: e.target.value })} />
          </div>
          <div className={box}>
            <label className={lbl}>Status</label>
            <Switch options={[['wishlist', 'Quero'], ['biblioteca', 'Tenho']]} value={v.status}
              onChange={val => set({ status: val, ...(val === 'biblioteca' ? { urgencia: false } : {}) })} />
          </div>
          {!owned ? (
            <label className={`flex items-center justify-center gap-2 rounded-[9px] border-[1.5px] px-3 text-[13px] font-semibold cursor-pointer transition self-end h-[42px] ${v.urgencia ? 'border-rust text-rust bg-surface-2' : 'border-moss-line text-ink-soft'}`}>
              <input type="checkbox" className="accent-rust w-[15px] h-[15px]" checked={v.urgencia} onChange={e => set({ urgencia: e.target.checked })} /> Urgente ⚠️
            </label>
          ) : (
            <div className={box}>
              <label className={lbl}>Valor pago</label>
              <input className="field-input" inputMode="numeric" value={v.valorPago ? moneyFormat(v.valorPago) : ''}
                onChange={e => set({ valorPago: moneyToNumber(e.target.value) })} placeholder="R$ 0,00" />
            </div>
          )}
          {owned && (
            <>
              <div className={box}>
                <label className={lbl}>Lido</label>
                <Switch options={[['sim', 'Sim'], ['nao', 'Não']]} value={v.lido ? 'sim' : 'nao'}
                  onChange={val => set({ lido: val === 'sim', ...(val === 'nao' ? { nota: 0 } : {}) })} />
              </div>
              {v.lido && (
                <div className={`${box} col-span-2`}>
                  <label className={lbl}>Nota</label>
                  <Stars value={v.nota} onChange={n => set({ nota: n })} size="text-[20px]" />
                </div>
              )}
            </>
          )}
          <div className="col-span-2 flex flex-wrap gap-1.5 pt-0.5">
            {['roteirista', 'desenhista', 'status'].map(f => (
              <button key={f} type="button" onClick={() => onCopyAll(i, f)}
                className="text-[11px] font-semibold text-moss border border-moss-line rounded-full px-2.5 py-1 hover:bg-paper-2">
                copiar {f} p/ todos
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Editor({ target, onClose, onSaved }) {
  const { obras, editoras, nextId, upsertObra, deleteObra } = useStore()
  const open = target != null
  const [d, setD] = useState(draftFromObra(null))
  const [genreOpen, setGenreOpen] = useState(false)
  const coverRef = useRef(null)

  useEffect(() => { if (open) setD(draftFromObra(target && target.id ? target : null)) }, [open, target])

  const paises = useMemo(() => Array.from(new Set(obras.map(o => o.pais).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt')), [obras])
  const autores = useMemo(() => Array.from(new Set(obras.flatMap(authorsOf))).sort((a, b) => a.localeCompare(b, 'pt')), [obras])
  const eds = useMemo(() => Array.from(new Set([...(editoras || []), ...obras.map(edOf)].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt')), [editoras, obras])

  const isMulti = d.tipo === 'box' || d.tipo === 'serie'
  const withCover = d.tipo === 'serie'
  const patch = (p) => setD(s => ({ ...s, ...p }))

  const setTipo = (t) => setD(s => {
    const next = { ...s, tipo: t }
    if ((t === 'box' || t === 'serie') && (!s.vols || !s.vols.length)) next.vols = [emptyVol()]
    return next
  })
  const setQtd = (n) => setD(s => {
    n = Math.max(0, Math.min(80, Number(n) || 0))
    const cur = s.vols.slice()
    if (n > cur.length) while (cur.length < n) cur.push(emptyVol())
    else cur.length = n
    return { ...s, vols: cur }
  })
  const setVol = (i, p) => setD(s => { const v = s.vols.slice(); v[i] = { ...v[i], ...p }; return { ...s, vols: v } })
  const copyAll = (i, f) => setD(s => { const val = s.vols[i][f]; return { ...s, vols: s.vols.map(v => ({ ...v, [f]: val, ...(f === 'status' && val === 'biblioteca' ? { urgencia: false } : {}) })) } })
  const volCover = (i, e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setVol(i, { imagem: r.result }); r.readAsDataURL(f); e.target.value = ''
  }
  const onCover = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => patch({ img: r.result }); r.readAsDataURL(f); e.target.value = ''
  }
  const toggleGenre = (g) => setD(s => ({ ...s, genres: s.genres.includes(g) ? s.genres.filter(x => x !== g) : [...s.genres, g] }))

  const save = () => {
    const title = d.nome.trim()
    if (!title) { alert(d.tipo === 'box' ? 'Dê um título ao box.' : d.tipo === 'serie' ? 'Dê um título à série.' : 'Dê um título à obra.'); return }
    const base = { id: d.id ?? nextId(), nome: title, tipo: d.tipo, origem: d.origem, editora: d.editora.trim(), pais: d.pais.trim(), tags: d.genres.slice(), resenha: d.resenha.trim() }
    let rec
    if (isMulti) {
      const volumes = d.vols.map((v, i) => {
        const owned = v.status === 'biblioteca'
        return {
          nome: (v.nome && v.nome.trim()) || ('Vol. ' + (i + 1)),
          imagem: withCover ? (v.imagem || null) : null,
          roteirista: v.roteirista || '', desenhista: v.desenhista || '',
          status: v.status || 'wishlist', urgencia: !owned && !!v.urgencia,
          valorPago: owned ? (v.valorPago || 0) : 0, lido: owned && !!v.lido, nota: owned ? (v.nota || 0) : 0,
        }
      })
      rec = { ...base, volumes, imagem: withCover ? (volumes[0]?.imagem || null) : (d.img || null),
        roteirista: '', desenhista: '', status: 'wishlist', urgencia: false, valorPago: 0, lido: false, nota: 0 }
    } else {
      const owned = d.status === 'biblioteca'
      rec = { ...base, imagem: d.img || null, roteirista: d.roteirista.trim(), desenhista: d.desenhista.trim(),
        status: d.status, urgencia: !owned && d.urgencia, valorPago: owned ? d.valorPago : 0, lido: owned && d.lido, nota: owned ? d.nota : 0 }
    }
    upsertObra(rec)
    onSaved?.(d.id == null ? 'Obra adicionada ✓' : 'Alterações salvas ✓')
    onClose()
  }
  const remove = () => {
    if (!d.id) return
    if (!confirm(`Excluir "${d.nome || 'esta obra'}" da coleção?`)) return
    deleteObra(d.id); onSaved?.('Excluído.'); onClose()
  }

  const ownedAvulso = d.status === 'biblioteca'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          >
            <motion.div
              className="w-full sm:max-w-[640px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-paper sm:rounded-[16px] sm:border-[1.5px] sm:border-ink overflow-hidden sm:shadow-[0_30px_70px_-24px_rgba(35,39,28,.7)]"
              initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b-[1.5px] border-moss-line">
                <h3 className="font-serif text-[21px] text-moss">{d.id == null ? 'Nova obra' : 'Editar obra'}</h3>
                <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm hover:bg-paper-2" onClick={onClose}>×</button>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 grid grid-cols-2 gap-x-3 gap-y-3">
                <div className={`${box} col-span-2`}>
                  <label className={lbl}>Tipo de cadastro</label>
                  <Switch options={[['avulso', 'Avulso'], ['box', 'Box'], ['serie', 'Série']]} value={d.tipo} onChange={setTipo} />
                </div>

                <div className={`${box} col-span-2`}>
                  <label className={lbl}>{d.tipo === 'box' ? 'Título do box' : d.tipo === 'serie' ? 'Título da série' : 'Título'}</label>
                  <input className="field-input" value={d.nome} onChange={e => patch({ nome: e.target.value })}
                    placeholder={d.tipo === 'box' ? 'Nome do box / coleção' : d.tipo === 'serie' ? 'Nome da série' : 'Nome da obra'} />
                </div>

                <div className={`${box} col-span-2`}>
                  <label className={lbl}>Origem</label>
                  <Switch options={[['nacional', 'Nacional'], ['importado', 'Importado']]} value={d.origem} onChange={v => patch({ origem: v })} />
                </div>

                <div className={box}>
                  <label className={lbl}>{d.origem === 'importado' ? 'Editora' : 'Editora no Brasil'}</label>
                  <input className="field-input" list="dlEds" value={d.editora} onChange={e => patch({ editora: e.target.value })} placeholder="Nome da editora" />
                </div>
                <div className={box}>
                  <label className={lbl}>País de origem</label>
                  <input className="field-input" list="dlPaises" value={d.pais} onChange={e => patch({ pais: e.target.value })} />
                </div>

                <div className={`${box} col-span-2`}>
                  <label className={lbl}>Gêneros</label>
                  <button type="button" onClick={() => setGenreOpen(true)} className="neo-btn justify-center">
                    {d.genres.length ? `${d.genres.length} selecionado(s) — editar` : 'Selecionar gêneros'}
                  </button>
                  {d.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {d.genres.map(g => (
                        <span key={g} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-moss text-white">
                          {g}<button type="button" onClick={() => toggleGenre(g)} className="opacity-80 hover:opacity-100">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* capa única (avulso / box) */}
                {!withCover && (
                  <div className={`${box} col-span-2`}>
                    <label className={lbl}>Capa</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-[84px] rounded-md border-[1.5px] border-moss-line bg-white overflow-hidden flex items-center justify-center shrink-0">
                        {d.img ? <img src={d.img} alt="" className="max-w-full max-h-full object-contain" />
                          : <span className="text-ink-faint text-[10px] text-center px-1">sem capa</span>}
                      </div>
                      <div className="flex-1">
                        <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCover} />
                        <button type="button" className="neo-btn w-full justify-center" onClick={() => coverRef.current?.click()}>Enviar imagem…</button>
                        <div className="text-[11px] text-ink-faint mt-1">A imagem fica salva junto no seu backup.</div>
                        {d.img && <button type="button" className="text-[12px] text-rust underline mt-1" onClick={() => patch({ img: '' })}>remover capa</button>}
                      </div>
                    </div>
                  </div>
                )}

                {/* multi: volumes */}
                {isMulti && (
                  <div className="col-span-2 flex flex-col gap-2.5">
                    <div className={box}>
                      <label className={lbl}>Quantidade de {d.tipo === 'box' ? 'livros' : 'volumes'}</label>
                      <input type="number" min="1" max="80" className="field-input max-w-[150px]" value={d.vols.length || ''}
                        onChange={e => setQtd(e.target.value)} placeholder="ex.: 3" />
                    </div>
                    {d.vols.length > 0 && (
                      <div className="text-[11.5px] text-ink-faint -mt-1">Preencha cada volume. Use “copiar p/ todos” quando o valor se repetir.</div>
                    )}
                    <div className="flex flex-col gap-2">
                      {d.vols.map((v, i) => (
                        <VolPanel key={i} v={v} i={i} withCover={withCover} onChange={setVol} onCopyAll={copyAll} onCover={volCover} />
                      ))}
                    </div>
                  </div>
                )}

                {/* avulso: autores + status */}
                {!isMulti && (
                  <>
                    <div className={box}>
                      <label className={lbl}>Autor / Roteirista</label>
                      <input className="field-input" list="dlAutores" value={d.roteirista} onChange={e => patch({ roteirista: e.target.value })} />
                    </div>
                    <div className={box}>
                      <label className={lbl}>Desenhista / Arte</label>
                      <input className="field-input" list="dlAutores" value={d.desenhista} onChange={e => patch({ desenhista: e.target.value })} placeholder="Use / p/ separar" />
                    </div>
                    <div className={box}>
                      <label className={lbl}>Status</label>
                      <Switch options={[['wishlist', 'Quero'], ['biblioteca', 'Tenho']]} value={d.status}
                        onChange={v => patch({ status: v, ...(v === 'biblioteca' ? { urgencia: false } : {}) })} />
                    </div>
                    {!ownedAvulso ? (
                      <label className={`flex items-center justify-center gap-2 rounded-[9px] border-[1.5px] px-3 text-[13px] font-semibold cursor-pointer transition self-end h-[42px] ${d.urgencia ? 'border-rust text-rust bg-surface-2' : 'border-moss-line text-ink-soft'}`}>
                        <input type="checkbox" className="accent-rust w-[15px] h-[15px]" checked={d.urgencia} onChange={e => patch({ urgencia: e.target.checked })} /> Urgente ⚠️
                      </label>
                    ) : (
                      <div className={box}>
                        <label className={lbl}>Valor pago</label>
                        <input className="field-input" inputMode="numeric" value={d.valorPago ? moneyFormat(d.valorPago) : ''}
                          onChange={e => patch({ valorPago: moneyToNumber(e.target.value) })} placeholder="R$ 0,00" />
                      </div>
                    )}
                    {ownedAvulso && (
                      <>
                        <div className={box}>
                          <label className={lbl}>Lido</label>
                          <Switch options={[['sim', 'Sim'], ['nao', 'Não']]} value={d.lido ? 'sim' : 'nao'}
                            onChange={v => patch({ lido: v === 'sim', ...(v === 'nao' ? { nota: 0 } : {}) })} />
                        </div>
                        {d.lido && (
                          <div className={`${box} col-span-2`}>
                            <label className={lbl}>Nota</label>
                            <Stars value={d.nota} onChange={n => patch({ nota: n })} />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className={`${box} col-span-2`}>
                  <label className={lbl}>Anotações / resenha</label>
                  <textarea className="field-input min-h-[80px] resize-y" rows={3} value={d.resenha} onChange={e => patch({ resenha: e.target.value })} placeholder="Escreva aqui…" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-5 py-3.5 border-t-[1.5px] border-moss-line">
                {d.id != null && <button className="neo-btn neo-btn-rust" onClick={remove}>Excluir</button>}
                <button className="neo-btn ml-auto" onClick={onClose}>Cancelar</button>
                <button className="neo-btn neo-btn-moss" onClick={save}>Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* datalists compartilhadas */}
      <datalist id="dlEds">{eds.map(x => <option key={x} value={x} />)}</datalist>
      <datalist id="dlPaises">{paises.map(x => <option key={x} value={x} />)}</datalist>
      <datalist id="dlAutores">{autores.map(x => <option key={x} value={x} />)}</datalist>

      <GenrePicker open={genreOpen} selected={d.genres} onToggle={toggleGenre} onClose={() => setGenreOpen(false)} />
    </>
  )
}
