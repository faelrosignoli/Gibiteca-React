import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { canon, slugify } from '../lib/helpers.js'
import { ghGet, ghPut } from '../lib/cloud.js'

const COVER_BASE = 'covers'
const readDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f) })

export default function BulkCovers({ open, onClose, onNotice }) {
  const { obras, cloud, setCovers } = useStore()
  const [items, setItems] = useState([])
  const [drag, setDrag] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' })
  const fileRef = useRef(null)

  const index = useMemo(() => {
    const m = {}; obras.forEach(o => { const k = canon(o.nome); (m[k] = m[k] || []).push(o) }); return m
  }, [obras])

  const analyze = (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const next = arr.map(f => {
      const base = f.name.replace(/\.[^.]+$/, '')
      const matches = index[canon(base)] || []
      let status = 'none', work = null
      if (matches.length === 1) { status = 'match'; work = matches[0] }
      else if (matches.length > 1) status = 'ambig'
      return { file: f, base, status, work, matches: matches.length }
    })
    setItems(next); setProgress({ done: 0, total: 0, label: '' })
  }

  const counts = useMemo(() => ({
    m: items.filter(i => i.status === 'match').length,
    a: items.filter(i => i.status === 'ambig').length,
    n: items.filter(i => i.status === 'none').length,
  }), [items])

  const onDrop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) analyze(e.dataTransfer.files) }

  const send = async () => {
    const todo = items.filter(i => i.status === 'match')
    if (!todo.length) return
    setSending(true)
    const updates = []; let done = 0, fail = 0
    for (const it of todo) {
      setProgress({ done, total: todo.length, label: `Enviando ${done + 1}/${todo.length} — ${it.file.name}` })
      try {
        const dataURL = await readDataURL(it.file)
        const b64 = dataURL.split(',')[1]
        const ext = (it.file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg').toLowerCase()
        const path = `${COVER_BASE}/${slugify(it.work.nome)}-${it.work.id}.${ext}`
        let sha = null; try { const ex = await ghGet(cloud, path); if (ex) sha = ex.sha } catch (e) { /* */ }
        await ghPut(cloud, path, b64, 'Capa: ' + it.work.nome, sha)
        updates.push({ id: it.work.id, imagem: `https://raw.githubusercontent.com/${cloud.owner}/${cloud.repo}/${cloud.branch}/${path}` })
      } catch (e) { fail++ }
      done++; setProgress({ done, total: todo.length, label: `Enviando ${done}/${todo.length}…` })
    }
    setCovers(updates)   // atualiza as obras e agenda o envio do JSON pra nuvem
    setSending(false)
    setProgress({ done, total: todo.length, label: `Concluído: ${done - fail} enviada(s)${fail ? `, ${fail} com erro` : ''}.` })
    onNotice?.(`${done - fail} capa(s) enviada(s).${fail ? ` ${fail} falharam.` : ''}`)
  }

  const tag = (s) => s === 'match'
    ? <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-[6px] bg-moss text-white">Associada</span>
    : s === 'ambig'
      ? <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-[6px] bg-[#f3ead4] text-[#8a6410]">Ambígua</span>
      : <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-[6px] bg-[#f0e2da] text-rust">Sem par</span>

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-ink/45 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget && !sending) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[600px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-paper sm:rounded-[16px] sm:border-[1.5px] sm:border-ink overflow-hidden sm:shadow-[0_30px_70px_-24px_rgba(35,39,28,.7)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b-[1.5px] border-moss-line">
              <h3 className="font-serif text-[21px] text-moss">Capas em massa</h3>
              <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm hover:bg-paper-2 disabled:opacity-40" onClick={onClose} disabled={sending}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-3">
              <p className="text-[12.5px] text-ink-soft leading-relaxed">
                Selecione as imagens: o app <b className="text-moss">casa cada arquivo com a obra pelo nome</b>
                {' '}(ex.: <span className="font-mono">100 Balas.jpg</span> → “100 Balas”). As capas são enviadas para o
                seu repositório em <span className="font-mono">{COVER_BASE}/</span> e vinculadas à obra.
              </p>

              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files.length) analyze(e.target.files); e.target.value = '' }} />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`rounded-[12px] border-[1.5px] border-dashed px-5 py-8 text-center cursor-pointer transition ${drag ? 'border-moss bg-[#f2f5ea]' : 'border-moss bg-surface-2'}`}
              >
                <div className="font-serif text-[16px] text-moss">Clique ou arraste as imagens aqui</div>
                <div className="text-[12px] text-ink-faint mt-1">JPG, PNG, WebP — várias de uma vez</div>
              </div>

              {items.length > 0 && (
                <div className="flex gap-4 flex-wrap text-[13px] font-semibold">
                  <span className="text-moss">✓ {counts.m} associada(s)</span>
                  {counts.a > 0 && <span className="text-[#b07d1f]">? {counts.a} ambígua(s)</span>}
                  {counts.n > 0 && <span className="text-rust">✕ {counts.n} sem par</span>}
                </div>
              )}

              {items.length > 0 && (
                <div className="max-h-[260px] overflow-auto rounded-[10px] border-[1.5px] border-moss-line">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t first:border-t-0 border-paper-3">
                          <td className="px-2.5 py-2 w-[38px]">
                            <div className="w-8 h-10 rounded border border-moss-line bg-white overflow-hidden">
                              <img src={URL.createObjectURL(it.file)} alt="" className="w-full h-full object-cover" onLoad={e => URL.revokeObjectURL(e.currentTarget.src)} />
                            </div>
                          </td>
                          <td className="px-2.5 py-2">
                            <div className="text-ink truncate max-w-[220px]">{it.file.name}</div>
                            <div className="text-[11px] text-ink-faint truncate max-w-[240px]">
                              {it.status === 'match' ? `→ ${it.work.nome}` : it.status === 'ambig' ? 'vários títulos iguais — ajuste manualmente' : 'sem obra correspondente'}
                            </div>
                          </td>
                          <td className="px-2.5 py-2 text-right">{tag(it.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {progress.total > 0 && (
                <div>
                  <div className="h-2 rounded-full bg-paper-3 overflow-hidden">
                    <div className="h-full bg-moss rounded-full transition-all" style={{ width: `${Math.round(progress.done / progress.total * 100)}%` }} />
                  </div>
                  <div className="text-[12px] text-ink-soft mt-1">{progress.label}</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-5 py-3.5 border-t-[1.5px] border-moss-line">
              <button className="neo-btn" onClick={onClose} disabled={sending}>Fechar</button>
              <button className="neo-btn neo-btn-moss ml-auto" onClick={send} disabled={sending || counts.m === 0}>
                {sending ? 'Enviando…' : `Enviar ${counts.m || ''} capa(s)`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
