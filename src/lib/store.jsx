import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { passes, sortList } from './helpers.js'
import { EDITORAS } from '../data.js'
import { ghCheckRepo, ghGet, ghPut, b64enc, b64dec, guessRepo } from './cloud.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const DEFAULT_FILTERS = {
  q: '', status: 'todos', tipo: '', editora: '', pais: '', autor: '',
  genero: '', importado: false, urgencia: false, leitura: 'todos',
}
const CLOUD_KEY = 'gibiteca_cloud'
const CLOUD_DEFAULT = { connected: false, owner: '', repo: '', branch: 'main', path: 'data/gibiteca.json', token: '', sha: null }

function loadInitial() {
  try {
    const raw = localStorage.getItem('gibiteca_v1')
    if (raw) { const d = JSON.parse(raw); if (Array.isArray(d.obras)) return { obras: d.obras, editoras: d.editoras || EDITORAS } }
  } catch (e) { /* */ }
  return { obras: [], editoras: EDITORAS }
}
function loadCloud() {
  try { const r = localStorage.getItem(CLOUD_KEY); if (r) return { ...CLOUD_DEFAULT, ...JSON.parse(r) } } catch (e) { /* */ }
  return { ...CLOUD_DEFAULT }
}

export function StoreProvider({ children }) {
  const init = loadInitial()
  const [obras, setObras] = useState(init.obras)
  const [editoras, setEditoras] = useState(init.editoras)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState({ by: 'nome', dir: 'asc' })
  const [view, setView] = useState('galeria')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(() => Number(localStorage.getItem('gibiteca_pagesize')) || 40)

  // ---- nuvem ----
  const cloudRef = useRef(loadCloud())
  const [cloud, setCloudState] = useState(cloudRef.current)
  const [sync, setSync] = useState(cloudRef.current.connected ? 'ok' : 'off')
  const dataRef = useRef({ obras: init.obras, editoras: init.editoras })
  useEffect(() => { dataRef.current = { obras, editoras } }, [obras, editoras])
  const writeCloud = useCallback((next) => {
    cloudRef.current = next; setCloudState(next)
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify(next)) } catch (e) { /* */ }
  }, [])

  const pushTimer = useRef(null), pushing = useRef(false), pushAgain = useRef(false), skipPush = useRef(false)

  const pushToCloud = useCallback(async () => {
    const c = cloudRef.current
    if (!c.connected) return
    if (pushing.current) { pushAgain.current = true; return }
    pushing.current = true; setSync('sync')
    try {
      const { obras, editoras } = dataRef.current
      const json = JSON.stringify({ version: 1, updated: new Date().toISOString(), obras, editoras }, null, 1)
      const b64 = b64enc(json)
      try {
        const res = await ghPut(c, c.path, b64, 'Atualiza coleção — ' + new Date().toLocaleString('pt-BR'), c.sha)
        writeCloud({ ...cloudRef.current, sha: res.content.sha })
      } catch (e) {
        const f = await ghGet(c, c.path)
        const res = await ghPut(c, c.path, b64, 'Atualiza coleção (retry)', f ? f.sha : null)
        writeCloud({ ...cloudRef.current, sha: res.content.sha })
      }
      setSync('ok')
    } catch (e) { setSync('err') }
    pushing.current = false
    if (pushAgain.current) { pushAgain.current = false; scheduleCloudPush() }
  }, [writeCloud])

  const scheduleCloudPush = useCallback(() => {
    if (!cloudRef.current.connected) return
    setSync('pending'); clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => pushToCloud(), 1500)
  }, [pushToCloud])

  // persistência local + agenda push na nuvem a cada alteração
  const dirty = useRef(false)
  useEffect(() => {
    if (!dirty.current) return
    try { localStorage.setItem('gibiteca_v1', JSON.stringify({ version: 1, obras, editoras })) } catch (e) { /* */ }
    if (skipPush.current) { skipPush.current = false; return }
    scheduleCloudPush()
  }, [obras, editoras, scheduleCloudPush])

  const applyData = useCallback((data, { fromCloud = false } = {}) => {
    if (!Array.isArray(data?.obras)) return
    dirty.current = true
    if (fromCloud) skipPush.current = true
    setObras(data.obras)
    if (Array.isArray(data.editoras) && data.editoras.length) setEditoras(data.editoras)
    setPage(1)
  }, [])

  const pullFromCloud = useCallback(async () => {
    const c = cloudRef.current
    if (!c.connected) return false
    setSync('sync')
    try {
      const f = await ghGet(c, c.path)
      if (!f) { setSync('ok'); return false }
      writeCloud({ ...cloudRef.current, sha: f.sha })
      const data = JSON.parse(b64dec(f.content))
      applyData(data, { fromCloud: true })
      setSync('ok'); return true
    } catch (e) { setSync('err'); return false }
  }, [applyData, writeCloud])

  const cloudConnect = useCallback(async (cfg) => {
    const c = { ...cloudRef.current, ...cfg }
    c.branch = c.branch || 'main'; c.path = c.path || 'data/gibiteca.json'
    if (!c.owner || !c.repo || !c.token) return { ok: false, message: 'Preencha usuário, repositório e token.' }
    setSync('sync')
    try {
      await ghCheckRepo(c)
      writeCloud({ ...c, connected: true, sha: null })
      const pulled = await pullFromCloud()
      if (!pulled) await pushToCloud() // cria o arquivo com o que já existe localmente
      setSync('ok')
      return { ok: true, message: 'Nuvem conectada. Coleção sincronizada.' }
    } catch (e) {
      writeCloud({ ...c, connected: false }); setSync('err')
      return { ok: false, message: e.message }
    }
  }, [pullFromCloud, pushToCloud, writeCloud])

  const cloudDisconnect = useCallback(() => {
    writeCloud({ ...cloudRef.current, connected: false, token: '', sha: null }); setSync('off')
  }, [writeCloud])

  const cloudPushNow = useCallback(() => { clearTimeout(pushTimer.current); return pushToCloud() }, [pushToCloud])

  // ---- filtros / ordenação / paginação ----
  const setFilter = useCallback((key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }, [])
  const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setPage(1) }, [])
  const setPageSize = useCallback((n) => { setPageSizeState(n); setPage(1); try { localStorage.setItem('gibiteca_pagesize', String(n)) } catch (e) { /* */ } }, [])
  const loadBackup = useCallback((data) => applyData(data), [applyData])

  const nextId = useCallback(() => obras.reduce((m, o) => Math.max(m, o.id || 0), 0) + 1, [obras])
  const registerEditora = useCallback((nome) => { if (nome) setEditoras(list => (list.includes(nome) ? list : [...list, nome])) }, [])
  const upsertObra = useCallback((rec) => {
    dirty.current = true; registerEditora(rec.editora)
    setObras(list => { const i = list.findIndex(o => o.id === rec.id); if (i === -1) return [...list, rec]; const c = list.slice(); c[i] = rec; return c })
  }, [registerEditora])
  const deleteObra = useCallback((id) => { dirty.current = true; setObras(list => list.filter(o => o.id !== id)) }, [])

  const setCovers = useCallback((updates) => {
    if (!updates || !updates.length) return
    dirty.current = true
    setObras(list => list.map(o => { const u = updates.find(x => x.id === o.id); return u ? { ...o, imagem: u.imagem } : o }))
  }, [])

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
    nextId, upsertObra, deleteObra, setCovers,
    filtered, total, totalPages, start, pageItems, all,
    // nuvem
    cloud, sync, guessRepo, cloudConnect, cloudDisconnect, pullFromCloud, cloudPushNow,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
