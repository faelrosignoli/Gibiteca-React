import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { passes, sortList } from './helpers.js'
import { EDITORAS } from '../data.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const DEFAULT_FILTERS = {
  q: '', status: 'todos', tipo: '', editora: '', pais: '', autor: '',
  genero: '', importado: false, urgencia: false, leitura: 'todos',
}

function loadInitial() {
  try {
    const raw = localStorage.getItem('gibiteca_v1')
    if (raw) {
      const d = JSON.parse(raw)
      if (Array.isArray(d.obras)) return { obras: d.obras, editoras: d.editoras || EDITORAS }
    }
  } catch (e) { /* ignore */ }
  return { obras: [], editoras: EDITORAS }
}

export function StoreProvider({ children }) {
  const init = loadInitial()
  const [obras, setObras] = useState(init.obras)
  const [editoras, setEditoras] = useState(init.editoras)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState({ by: 'nome', dir: 'asc' })
  const [view, setView] = useState('galeria')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(() => {
    const n = Number(localStorage.getItem('gibiteca_pagesize'))
    return n || 40
  })

  // persiste no navegador sempre que a coleção muda (a partir da 1ª alteração)
  const dirty = useRef(false)
  useEffect(() => {
    if (!dirty.current) return
    try { localStorage.setItem('gibiteca_v1', JSON.stringify({ version: 1, obras, editoras })) } catch (e) { /* */ }
  }, [obras, editoras])

  const setFilter = useCallback((key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }, [])
  const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setPage(1) }, [])
  const setPageSize = useCallback((n) => {
    setPageSizeState(n); setPage(1)
    try { localStorage.setItem('gibiteca_pagesize', String(n)) } catch (e) { /* */ }
  }, [])
  const loadBackup = useCallback((data) => {
    if (Array.isArray(data?.obras)) {
      dirty.current = true
      setObras(data.obras)
      if (Array.isArray(data.editoras) && data.editoras.length) setEditoras(data.editoras)
      setPage(1)
    }
  }, [])

  const nextId = useCallback(() => obras.reduce((m, o) => Math.max(m, o.id || 0), 0) + 1, [obras])

  const registerEditora = useCallback((nome) => {
    if (!nome) return
    setEditoras(list => (list.includes(nome) ? list : [...list, nome]))
  }, [])

  const upsertObra = useCallback((rec) => {
    dirty.current = true
    registerEditora(rec.editora)
    setObras(list => {
      const idx = list.findIndex(o => o.id === rec.id)
      if (idx === -1) return [...list, rec]
      const copy = list.slice(); copy[idx] = rec; return copy
    })
  }, [registerEditora])

  const deleteObra = useCallback((id) => {
    dirty.current = true
    setObras(list => list.filter(o => o.id !== id))
  }, [])

  // volta pra página 1 quando o conjunto filtrado muda
  const filterSig = JSON.stringify([filters, sort])
  useEffect(() => { setPage(1) }, [filterSig])

  const filtered = useMemo(() => sortList(obras.filter(o => passes(o, filters)), sort), [obras, filters, sort])
  const total = filtered.length
  const all = pageSize >= 99999
  const totalPages = all ? 1 : Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = all ? 0 : (safePage - 1) * pageSize
  const pageItems = all ? filtered : filtered.slice(start, start + pageSize)

  const value = {
    obras, editoras, filters, sort, view, page: safePage, pageSize,
    setSort, setView, setPage, setPageSize, setFilter, resetFilters, loadBackup,
    nextId, upsertObra, deleteObra,
    filtered, total, totalPages, start, pageItems, all,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
