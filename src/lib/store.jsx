import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { passes, sortList } from './helpers.js'
import { EDITORAS } from '../data.js'
import { ghCheckRepo, ghGet, ghPut, lerColecao, b64enc, b64dec, guessRepo } from './cloud.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const DEFAULT_FILTERS = {
  q: '', status: 'todos', tipo: '', editora: '', pais: '', autor: '',
  importado: false, urgencia: false, leitura: 'todos',
}
const CLOUD_KEY = 'gibiteca_cloud'
const CLOUD_DEFAULT = { connected: false, owner: '', repo: '', branch: 'main', path: 'data/gibiteca.json', token: '', sha: null }

/* Quando esta cópia dos dados foi alterada pela última vez.
 *
 * É a peça que faltava na sincronização: sem ela nenhum aparelho sabe se a
 * cópia dele é mais nova ou mais velha que a da nuvem, e qualquer envio
 * atropela o que estiver lá. O carimbo antigo (`updated`, em texto ISO) é
 * aceito na leitura, para os arquivos que já existem na nuvem continuarem
 * valendo. */
export function carimboDe(d) {
  if (!d) return 0
  if (Number.isFinite(d.atualizadoEm)) return d.atualizadoEm
  const t = Date.parse(d.updated || d.exported || '')
  return Number.isFinite(t) ? t : 0
}

function loadInitial() {
  try {
    const raw = localStorage.getItem('gibiteca_v1')
    if (raw) {
      const d = JSON.parse(raw)
      if (Array.isArray(d.obras)) return { obras: d.obras, editoras: d.editoras || EDITORAS, carimbo: carimboDe(d) }
    }
  } catch (e) { /* */ }
  return { obras: [], editoras: EDITORAS, carimbo: 0 }
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

  // ---- obra fixada ----
  // Guarda UM id, nunca uma lista: fixar outra troca a anterior, por
  // construção. A obra fixada vai para o início da lista e vira o cartão em
  // destaque da grade.
  const [fixada, setFixada] = useState(() => {
    const v = Number(localStorage.getItem('gibiteca_fixada'))
    return Number.isFinite(v) && v > 0 ? v : null
  })
  const fixarObra = useCallback((id) => {
    setFixada(atual => {
      const nova = atual === id ? null : id   // clicar na mesma desafixa
      try {
        if (nova == null) localStorage.removeItem('gibiteca_fixada')
        else localStorage.setItem('gibiteca_fixada', String(nova))
      } catch (e) { /* */ }
      return nova
    })
    setPage(1)
  }, [])

  // ---- nuvem ----
  const cloudRef = useRef(loadCloud())
  const [cloud, setCloudState] = useState(cloudRef.current)
  const [sync, setSync] = useState(cloudRef.current.connected ? 'ok' : 'off')
  // O que o GitHub respondeu, em texto. Sem isto todo problema virava
  // "Erro de sincronização" e não dava para saber se era token, repositório,
  // permissão ou caminho — nem para quem escreveu o código.
  const [syncErro, setSyncErro] = useState('')
  const falhou = useCallback((e) => { setSyncErro(String(e && e.message || e || 'Erro desconhecido')); setSync('err') }, [])
  const dataRef = useRef({ obras: init.obras, editoras: init.editoras })
  useEffect(() => { dataRef.current = { obras, editoras } }, [obras, editoras])
  const writeCloud = useCallback((next) => {
    cloudRef.current = next; setCloudState(next)
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify(next)) } catch (e) { /* */ }
  }, [])

  const pushTimer = useRef(null), pushing = useRef(false), pushAgain = useRef(false), skipPush = useRef(false)

  // carimbo desta cópia. Toda alteração local o avança; o que vem da nuvem
  // herda o carimbo de lá, para os dois lados ficarem comparáveis.
  const carimbo = useRef(init.carimbo || 0)
  const marcarAlterado = useCallback(() => { dirty.current = true; carimbo.current = Date.now() }, [])

  const pushToCloud = useCallback(async (forcar = false) => {
    const c = cloudRef.current
    if (!c.connected) return
    if (pushing.current) { pushAgain.current = true; return }
    pushing.current = true; setSync('sync')
    try {
      // Antes de gravar, olha o que está na nuvem. Sem isto o aparelho
      // atrasado sobrescreve o adiantado sem ninguém perceber — foi assim que
      // um backup restaurado no PC sumiu debaixo da cópia velha do celular.
      const f = await ghGet(c, c.path)
      if (f) {
        const laFora = carimboDe(lerColecao(f))
        // 'forcar' vem do botao 'Enviar agora': ali a pessoa esta mandando
        // gravar por cima, sabendo disso. O envio automatico nunca forca.
        if (!forcar && laFora > carimbo.current) {
          // a nuvem está na frente: não grava por cima
          writeCloud({ ...cloudRef.current, sha: f.sha })
          setSync('conflito')
          pushing.current = false
          return
        }
      }

      const { obras, editoras } = dataRef.current
      const agora = Date.now()
      const json = JSON.stringify(
        { version: 1, atualizadoEm: agora, updated: new Date(agora).toISOString(), obras, editoras }, null, 1)
      const b64 = b64enc(json)
      // Sem arquivo na nuvem, NÃO se manda sha: ele só existe para atualizar
      // algo que já está lá. Mandar um sha guardado de antes faz o GitHub
      // recusar — era isto que virava "Erro de sincronização" no primeiro envio.
      const res = await ghPut(c, c.path, b64, 'Atualiza coleção — ' + new Date().toLocaleString('pt-BR'), f ? f.sha : null)
      carimbo.current = agora
      writeCloud({ ...cloudRef.current, sha: res.content.sha })
      setSyncErro(''); setSync('ok')
    } catch (e) { falhou(e) }
    pushing.current = false
    if (pushAgain.current) { pushAgain.current = false; scheduleCloudPush() }
  }, [writeCloud, falhou])

  const scheduleCloudPush = useCallback(() => {
    if (!cloudRef.current.connected) return
    setSync('pending'); clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => pushToCloud(), 1500)
  }, [pushToCloud])

  // persistência local + agenda push na nuvem a cada alteração
  const dirty = useRef(false)
  useEffect(() => {
    if (!dirty.current) return
    try { localStorage.setItem('gibiteca_v1', JSON.stringify({ version: 1, atualizadoEm: carimbo.current, obras, editoras })) } catch (e) { /* */ }
    if (skipPush.current) { skipPush.current = false; return }
    scheduleCloudPush()
  }, [obras, editoras, scheduleCloudPush])

  const applyData = useCallback((data, { fromCloud = false } = {}) => {
    if (!Array.isArray(data?.obras)) return
    dirty.current = true
    // vindo da nuvem, herda o carimbo de lá: esta cópia passa a ser aquela.
    // Vindo de um arquivo restaurado, é alteração local e ganha a hora de agora.
    carimbo.current = fromCloud ? carimboDe(data) : Date.now()
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
      const data = lerColecao(f)
      applyData(data, { fromCloud: true })
      setSync('ok'); return true
    } catch (e) { falhou(e); return false }
  }, [applyData, writeCloud, falhou])

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

  // 'Enviar agora' e uma decisao explicita: manda esta copia por cima
  const cloudPushNow = useCallback(() => { clearTimeout(pushTimer.current); return pushToCloud(true) }, [pushToCloud])

  /* Ao abrir o app, conferir a nuvem.
   *
   * Faltava isto: o app só falava com a nuvem quando alguém apertava um botão
   * ou editava algo. Cada aparelho mostrava o próprio localStorage para
   * sempre, e parecia que a nuvem não tinha salvado — quando na verdade
   * ninguém tinha perguntado a ela.
   *
   * Quem decide é o carimbo, não quem chegou por último:
   *   nuvem mais nova  -> puxa
   *   local mais novo  -> envia
   *   iguais           -> não faz nada
   */
  const conferido = useRef(false)
  useEffect(() => {
    if (conferido.current) return
    conferido.current = true
    const c = cloudRef.current
    if (!c.connected) return
    let vivo = true
    ;(async () => {
      setSync('sync')
      try {
        const f = await ghGet(c, c.path)
        if (!vivo) return
        if (!f) {
          // O arquivo ainda não existe lá. Se aqui há coleção, o certo é
          // criá-lo — antes o app dava "tudo certo" e não sincronizava nada,
          // para sempre.
          if ((dataRef.current.obras || []).length) { setSync('ok'); scheduleCloudPush(); return }
          setSync('ok'); return
        }
        const dados = lerColecao(f)
        writeCloud({ ...cloudRef.current, sha: f.sha })
        const laFora = carimboDe(dados)

        /* Carimbo local zero quer dizer DESCONHECIDO, não "muito antigo".
         *
         * É o caso de quem já usava o app antes desta mudança: os dados estão
         * salvos aqui sem carimbo nenhum. Tratar isso como antigo faria a
         * nuvem ganhar sempre — e foi exatamente assim que um backup
         * restaurado no PC sumiu sozinho, toda vez que o app abria.
         *
         * Sem saber quem é mais novo, o app não escolhe: só puxa se aqui não
         * houver nada a perder. Havendo, para e pergunta. */
        const semCarimboLocal = !carimbo.current
        const temCoisaAqui = (dataRef.current.obras || []).length > 0

        if (semCarimboLocal && temCoisaAqui) {
          // as duas cópias existem e não dá para ordená-las: quem decide é você
          setSync(laFora ? 'conflito' : 'ok')
          return
        }
        if (laFora > carimbo.current) applyData(dados, { fromCloud: true })
        else if (carimbo.current > laFora) { setSync('ok'); scheduleCloudPush(); return }
        setSync('ok')
      } catch (e) { if (vivo) falhou(e) }
    })()
    return () => { vivo = false }
  }, [applyData, writeCloud, scheduleCloudPush])

  // ---- filtros / ordenação / paginação ----
  const setFilter = useCallback((key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }, [])
  const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setPage(1) }, [])
  const setPageSize = useCallback((n) => { setPageSizeState(n); setPage(1); try { localStorage.setItem('gibiteca_pagesize', String(n)) } catch (e) { /* */ } }, [])
  const loadBackup = useCallback((data) => applyData(data), [applyData])

  const nextId = useCallback(() => obras.reduce((m, o) => Math.max(m, o.id || 0), 0) + 1, [obras])
  const registerEditora = useCallback((nome) => { if (nome) setEditoras(list => (list.includes(nome) ? list : [...list, nome])) }, [])
  const upsertObra = useCallback((rec) => {
    marcarAlterado(); registerEditora(rec.editora)
    setObras(list => { const i = list.findIndex(o => o.id === rec.id); if (i === -1) return [...list, rec]; const c = list.slice(); c[i] = rec; return c })
  }, [registerEditora])
  const deleteObra = useCallback((id) => {
    // se a apagada era a fixada, o destaque some junto
    setFixada(f => { if (f === id) { try { localStorage.removeItem('gibiteca_fixada') } catch (e) { /* */ } return null } return f })
    marcarAlterado(); setObras(list => list.filter(o => o.id !== id)) }, [])

  const setCovers = useCallback((updates) => {
    if (!updates || !updates.length) return
    marcarAlterado()
    setObras(list => list.map(o => { const u = updates.find(x => x.id === o.id); return u ? { ...o, imagem: u.imagem } : o }))
  }, [])

  const filterSig = JSON.stringify([filters, sort])
  useEffect(() => { setPage(1) }, [filterSig])

  const filtered = useMemo(() => {
    const lista = sortList(obras.filter(o => passes(o, filters)), sort)
    if (fixada == null) return lista
    const i = lista.findIndex(o => o.id === fixada)
    if (i <= 0) return lista               // não está na lista, ou já é a primeira
    return [lista[i], ...lista.slice(0, i), ...lista.slice(i + 1)]
  }, [obras, filters, sort, fixada])
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
    fixada, fixarObra,
    // nuvem
    cloud, sync, syncErro, guessRepo, cloudConnect, cloudDisconnect, pullFromCloud, cloudPushNow,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
