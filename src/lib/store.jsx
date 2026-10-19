import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { passes, sortList, fragmentosDe, chaveFila, itemDaFila, podeEnfileirar, volsOf } from './helpers.js'
import { EDITORAS } from '../data.js'
import { ghCheckRepo, ghGet, ghPut, lerColecao, b64enc, b64dec, guessRepo } from './cloud.js'
import { compararColecoes, mensagemDeCommit } from './diario.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

/* Editora, país, autor e tipo de edição guardam LISTA, não valor único: dá
 * para marcar "Panini" e "Pipoca & Nanquim" ao mesmo tempo. Vários valores no
 * mesmo campo somam (OU); campos diferentes continuam se cruzando (E).
 *
 * É função, não constante: devolvendo listas novas a cada chamada, "limpar
 * filtros" não entrega ao estado os mesmos arrays que estavam em uso. */
export const filtrosPadrao = () => ({
  q: '', status: 'todos', tipo: '', tipoEdicao: [], editora: [], pais: [], autor: [],
  importado: false, urgencia: false, leitura: 'todos',
})
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
  let bruto = null
  try { bruto = localStorage.getItem('gibiteca_v1') } catch (e) { /* navegador sem storage */ }
  if (!bruto) return { obras: [], editoras: EDITORAS, fila: [], listas: [], carimbo: 0, ilegivel: false }
  try {
    const d = JSON.parse(bruto)
    if (Array.isArray(d.obras)) return { obras: d.obras, editoras: d.editoras || EDITORAS, fila: Array.isArray(d.fila) ? d.fila : [], listas: Array.isArray(d.listas) ? d.listas : [], carimbo: carimboDe(d), ilegivel: false }
  } catch (e) { /* cai no aviso abaixo */ }
  /* HAVIA dado guardado e não deu para ler.
   *
   * Antes isto virava uma estante vazia, sem uma palavra: 554 obras viravam
   * zero e parecia que tudo tinha sido perdido. E pior, o app seguia como se
   * estivesse tudo bem. Agora a coleção continua vazia (não há o que mostrar),
   * mas o app DIZ que o dado existe e está ilegível — e o carimbo fica em
   * zero, então esse vazio nunca sobe para a nuvem por cima do que está lá. */
  return { obras: [], editoras: EDITORAS, fila: [], listas: [], carimbo: 0, ilegivel: true }
}
function loadCloud() {
  try { const r = localStorage.getItem(CLOUD_KEY); if (r) return { ...CLOUD_DEFAULT, ...JSON.parse(r) } } catch (e) { /* */ }
  return { ...CLOUD_DEFAULT }
}

export function StoreProvider({ children }) {
  const init = loadInitial()
  const [obras, setObras] = useState(init.obras)
  const [editoras, setEditoras] = useState(init.editoras)
  const [filters, setFilters] = useState(filtrosPadrao)
  const [sort, setSort] = useState({ by: 'nome', dir: 'asc' })
  const [view, setView] = useState('galeria')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(() => Number(localStorage.getItem('gibiteca_pagesize')) || 40)

  /* O TEMA é o nome de um bloco `[data-tema=...]` do index.css.
   *
   * A lista mora aqui porque é ela que diz o que é válido guardar: um
   * `gibiteca_tema` com lixo dentro — arquivo editado à mão, versão antiga,
   * sincronia de outro aparelho — cai no padrão em vez de pendurar um
   * atributo que nenhum CSS atende.
   *
   * O PADRÃO não escreve atributo nenhum: ele É o `:root`. O atributo só
   * existe quando há desvio, então o dia em que o Moss deixar de ser o
   * padrão nada fica pendurado no html.
   */
  const TEMA_PADRAO = 'moss'
  const TEMAS_VALIDOS = ['moss', 'nockout', 'candy', 'midnight']
  const [tema, setTemaState] = useState(() => {
    try {
      const t = localStorage.getItem('gibiteca_tema')
      return TEMAS_VALIDOS.includes(t) ? t : TEMA_PADRAO
    } catch (e) { return TEMA_PADRAO }
  })
  useEffect(() => {
    const html = document.documentElement
    if (tema === TEMA_PADRAO) delete html.dataset.tema
    else html.dataset.tema = tema
  }, [tema])
  const setTema = useCallback((t) => {
    const valido = TEMAS_VALIDOS.includes(t) ? t : TEMA_PADRAO
    setTemaState(valido)
    try { localStorage.setItem('gibiteca_tema', valido) } catch (e) { /* navegador sem storage */ }
  }, [])

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

  /* ---- fila de leitura ----
   *
   * Mora DENTRO de `gibiteca_v1`, junto das obras, e não numa chave própria
   * como `gibiteca_fixada`. A diferença é o que se perde ao perder: a fixada
   * é um enfeite da grade, se refaz num clique. A fila é trabalho — uma ordem
   * escolhida a dedo — e trabalho tem de ir junto no backup e na nuvem.
   *
   * O custo é que toda gravação carrega a fila, e um backup antigo não a tem.
   * Por isso a leitura é sempre defensiva: sem `fila` no arquivo, fila vazia.
   */
  const [fila, setFila] = useState(init.fila)

  /* Põe ou tira. Um botão só, nos dois lados — no detalhe da obra e na
     própria fila —, porque a pergunta é a mesma: está na fila ou não? */
  const alternarFila = useCallback((id, vol = null) => {
    marcarAlterado()
    setFila(lista => {
      const k = chaveFila(id, vol)
      const i = lista.findIndex(e => chaveFila(e.id, e.vol) === k)
      if (i >= 0) return lista.filter((_, n) => n !== i)
      /* Entra NO FIM. A fila é uma ordem de leitura, e o que se acabou de
         lembrar não passa na frente do que já estava esperando — quem decide
         isso é o arrasto. */
      return [...lista, { id, vol }]
    })
  }, [])

  const removerDaFila = useCallback((id, vol = null) => {
    marcarAlterado()
    const k = chaveFila(id, vol)
    setFila(lista => lista.filter(e => chaveFila(e.id, e.vol) !== k))
  }, [])

  /* A nova ordem chega pronta do arrasto (Reorder do framer-motion), com as
     MESMAS entradas em ordem diferente. Não se valida nada aqui: validar
     significaria comparar listas a cada quadro de arrasto. */
  const reordenarFila = useCallback((nova) => {
    marcarAlterado()
    setFila(nova)
  }, [])

  /* Marcar lido pela fila.
   *
   * Grava `lido` e a nota na unidade certa — a obra, se avulsa; o volume, se
   * for volume — e TIRA da fila. Sair da fila não é efeito colateral: é o fim
   * do ciclo. O que foi lido não é mais o que vem a seguir.
   *
   * Põe na estante (`status: 'biblioteca'`) o que ainda estivesse em
   * "quero". Hoje isso é cinto de segurança, não caminho normal: desde que
   * só o que está na estante entra na fila, não deveria haver "quero" aqui.
   * Mas uma fila guardada ANTES dessa trava — ou vinda da nuvem de um
   * aparelho mais antigo — pode ter, e marcar lido um item de desejo
   * duraria até a próxima edição e sumiria sozinho. */
  const marcarLido = useCallback((id, vol = null, nota = 0) => {
    marcarAlterado()
    setObras(lista => lista.map(o => {
      if (o.id !== id) return o
      const campos = { status: 'biblioteca', urgencia: false, lido: true, nota: Number(nota) || 0 }
      if (vol == null) return { ...o, ...campos }
      const vols = volsOf(o).slice()
      if (!vols[vol]) return o
      vols[vol] = { ...vols[vol], ...campos }
      return { ...o, volumes: vols }
    }))
    removerDaFila(id, vol)
  }, [removerDaFila])


  /* ---- listas ----
   *
   * Pastas feitas à mão. Moram junto das obras em `gibiteca_v1`, pelo mesmo
   * motivo da fila: é trabalho, e trabalho vai no backup e na nuvem.
   *
   * O id da lista sai do maior em uso + 1, igual ao das obras. Não se
   * reaproveita id de lista apagada: o Editor guarda, enquanto está aberto,
   * a quais listas a obra vai entrar, e um id reciclado faria esse rascunho
   * apontar para a lista errada.
   */
  const [listas, setListas] = useState(init.listas)

  const criarLista = useCallback((nome, ids = []) => {
    const limpo = String(nome || '').trim()
    if (!limpo) return null
    let nova = null
    marcarAlterado()
    setListas(lista => {
      const id = lista.reduce((m, l) => Math.max(m, l.id || 0), 0) + 1
      /* `[...new Set(ids)]`: a tela de escolha não deixa marcar duas vezes,
         mas quem chama pode vir de outro lugar — e id repetido apareceria
         duas vezes na galeria, com a mesma capa. */
      nova = { id, nome: limpo, obras: [...new Set(ids)] }
      return [...lista, nova]
    })
    return nova
  }, [])

  const renomearLista = useCallback((id, nome) => {
    const limpo = String(nome || '').trim()
    if (!limpo) return                       // lista sem nome não se acha depois
    marcarAlterado()
    setListas(lista => lista.map(l => (l.id === id ? { ...l, nome: limpo } : l)))
  }, [])

  /* Apagar a lista NÃO toca nas obras. É pasta, não caixa: desfazer a pasta
     não joga fora o que estava dentro. */
  const apagarLista = useCallback((id) => {
    marcarAlterado()
    setListas(lista => lista.filter(l => l.id !== id))
  }, [])

  /* Põe ou tira uma obra de UMA lista. Entra no fim: a ordem da galeria é a
     ordem em que as coisas foram postas, e quem chega depois não passa na
     frente. */
  const alternarNaLista = useCallback((listaId, obraId) => {
    marcarAlterado()
    setListas(lista => lista.map(l => {
      if (l.id !== listaId) return l
      const dentro = l.obras.includes(obraId)
      return { ...l, obras: dentro ? l.obras.filter(x => x !== obraId) : [...l.obras, obraId] }
    }))
  }, [])

  /* Diz de uma vez EM QUAIS listas a obra está — é como o Editor salva.
   *
   * Tem de ser uma operação só, e não um `alternarNaLista` por lista: o
   * Editor entrega o conjunto final, e aplicar em várias passadas faria cada
   * uma gravar e disparar envio para a nuvem.
   *
   * Remover de onde saiu é tão importante quanto pôr onde entrou: sem isso,
   * desmarcar uma lista no Editor não desmarcaria nada. */
  const definirListasDaObra = useCallback((obraId, ids) => {
    const alvo = new Set(ids || [])
    marcarAlterado()
    setListas(lista => lista.map(l => {
      const dentro = l.obras.includes(obraId)
      const deveEstar = alvo.has(l.id)
      if (dentro === deveEstar) return l
      return { ...l, obras: deveEstar ? [...l.obras, obraId] : l.obras.filter(x => x !== obraId) }
    }))
  }, [])

  /* Obra apagada sai de todas as listas.
   *
   * A leitura já descarta id morto, então isto é faxina, não correção — mas
   * faxina que importa: sem ela o arquivo guardado acumularia ids de obras
   * que não existem mais, e cada backup carregaria esse lixo para a frente. */
  const podarListas = useCallback((obrasNovas) => {
    const vivos = new Set((obrasNovas || []).map(o => o.id))
    setListas(lista => {
      let mudou = false
      const nova = lista.map(l => {
        const obras = l.obras.filter(id => vivos.has(id))
        if (obras.length === l.obras.length) return l
        mudou = true
        return { ...l, obras }
      })
      return mudou ? nova : lista
    })
  }, [])

  /* Desmembrar: a série sai das listas e os VOLUMES entram no lugar dela.
   *
   * Podar e pronto seria perda silenciosa — a obra estava em "Para reler" e
   * sumiria de lá sem ninguém mexer na lista. Os volumes agora são obras de
   * verdade, e são eles que herdam o lugar, na posição onde a série estava.
   *
   * Sim, uma entrada vira N. Mas isso se VÊ na galeria, e ver é melhor que
   * descobrir a falta meses depois. */
  const trocarNasListas = useCallback((idVelho, idsNovos) => {
    setListas(lista => lista.map(l => {
      const i = l.obras.indexOf(idVelho)
      if (i < 0) return l
      return { ...l, obras: [...l.obras.slice(0, i), ...idsNovos, ...l.obras.slice(i + 1)] }
    }))
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
  const dataRef = useRef({ obras: init.obras, editoras: init.editoras, fila: init.fila, listas: init.listas })
  useEffect(() => { dataRef.current = { obras, editoras, fila, listas } }, [obras, editoras, fila, listas])
  const writeCloud = useCallback((next) => {
    cloudRef.current = next; setCloudState(next)
    // se a configuração da nuvem não puder ser gravada, a pessoa vai
    // reconectar amanhã sem entender por quê — melhor dizer
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify(next)) }
    catch (e) { setSyncErro('A configuração da nuvem não pôde ser guardada neste navegador (sem espaço). Ela vale só nesta aba.') }
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
      let anterior = null
      if (f) {
        anterior = lerColecao(f)
        const laFora = carimboDe(anterior)
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

      const { obras, editoras, fila, listas } = dataRef.current
      const agora = Date.now()
      const json = JSON.stringify(
        { version: 1, atualizadoEm: agora, updated: new Date(agora).toISOString(), obras, editoras, fila, listas }, null, 1)
      const b64 = b64enc(json)
      // Sem arquivo na nuvem, NÃO se manda sha: ele só existe para atualizar
      // algo que já está lá. Mandar um sha guardado de antes faz o GitHub
      // recusar — era isto que virava "Erro de sincronização" no primeiro envio.
      // A mensagem do commit conta o que mudou. Sem isto o histórico do
      // repositório vira 200 linhas iguais, e não serve para conferir nada.
      const recado = mensagemDeCommit(compararColecoes(anterior, { obras, editoras }), new Date(agora))
      const res = await ghPut(c, c.path, b64, recado, f ? f.sha : null)
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

  /* Persistência local + envio para a nuvem a cada alteração.
   *
   * O `catch` vazio que estava aqui escondia o pior defeito do app: uma
   * coleção com capas passa dos ~5 MB de cota do localStorage (o texto conta
   * em UTF-16, então 4 MB de JSON pedem 8 MB), o `setItem` estoura, e nada
   * era gravado. A obra aparecia na tela, o navegador recusava em silêncio, e
   * ao recarregar ela tinha sumido.
   *
   * Agora a falha é dita em voz alta — e a nuvem vira envio imediato, porque
   * passa a ser a única cópia que sobrevive a fechar a aba. */
  const dirty = useRef(false)
  const [semEspaco, setSemEspaco] = useState(false)
  // Conta as falhas, não só se há uma. O aviso pode ser dispensado, mas uma
  // falha NOVA o traz de volta: dispensar reconhece o estado de agora, não
  // desliga o alarme para sempre.
  const [falhasAoGuardar, setFalhasAoGuardar] = useState(0)
  // dado guardado que não abriu: precisa ser dito, não escondido
  const [dadoIlegivel] = useState(() => !!init.ilegivel)
  useEffect(() => {
    if (!dirty.current) return
    let gravou = true
    try {
      localStorage.setItem('gibiteca_v1', JSON.stringify({ version: 1, atualizadoEm: carimbo.current, obras, editoras, fila, listas }))
    } catch (e) { gravou = false }
    setSemEspaco(!gravou)
    if (!gravou) setFalhasAoGuardar(n => n + 1)
    if (skipPush.current) { skipPush.current = false; return }
    if (!gravou) { clearTimeout(pushTimer.current); pushToCloud(); return }
    scheduleCloudPush()
  }, [obras, editoras, fila, listas, scheduleCloudPush, pushToCloud])

  const applyData = useCallback((data, { fromCloud = false } = {}) => {
    if (!Array.isArray(data?.obras)) return
    dirty.current = true
    // vindo da nuvem, herda o carimbo de lá: esta cópia passa a ser aquela.
    // Vindo de um arquivo restaurado, é alteração local e ganha a hora de agora.
    carimbo.current = fromCloud ? carimboDe(data) : Date.now()
    if (fromCloud) skipPush.current = true
    setObras(data.obras)
    if (Array.isArray(data.editoras) && data.editoras.length) setEditoras(data.editoras)
    /* Arquivo sem `fila` (backup anterior a este recurso) zera a fila em vez
       de manter a de agora: o arquivo restaurado É a coleção, e deixar uma
       fila velha apontando para ids de outra coleção daria entradas mortas,
       ou pior, entradas vivas apontando para a obra errada. */
    setFila(Array.isArray(data.fila) ? data.fila : [])
    setListas(Array.isArray(data.listas) ? data.listas : [])
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
  const resetFilters = useCallback(() => { setFilters(filtrosPadrao()); setPage(1) }, [])
  const setPageSize = useCallback((n) => { setPageSizeState(n); setPage(1); try { localStorage.setItem('gibiteca_pagesize', String(n)) } catch (e) { /* */ } }, [])
  const loadBackup = useCallback((data) => applyData(data), [applyData])
  // troca a coleção inteira por uma versão já processada (ex.: capas movidas
  // para o repositório). Conta como alteração local: carimba e envia.
  const aplicarObras = useCallback((novas) => applyData({ obras: novas, editoras: dataRef.current.editoras }), [applyData])

  const nextId = useCallback(() => obras.reduce((m, o) => Math.max(m, o.id || 0), 0) + 1, [obras])
  const registerEditora = useCallback((nome) => { if (nome) setEditoras(list => (list.includes(nome) ? list : [...list, nome])) }, [])
  /* ---- a fila se conversa com o resto ----
   *
   * Quatro coisas tiram da fila sem ninguém pedir, e as quatro são a mesma
   * regra: uma entrada só vale enquanto aponta para algo que existe, que
   * está na estante e que ainda não foi lido.
   * lido.
   *
   *   1. marcar lido PELO EDITOR (não só pela fila)
   *   1b. tirar da estante pelo Editor ("tenho" -> "quero")
   *   2. apagar a obra
   *   3. desmembrar a série — os volumes viram outras obras, com outros ids
   *
   * A poda roda sobre a lista de obras que ACABOU de ser montada, e não sobre
   * o `obras` do render: dentro de um `setObras` o estado antigo ainda é o que
   * está em `obras`, e podar contra ele decidiria pela coleção de antes.
   */
  const podarFila = useCallback((obrasNovas) => {
    setFila(lista => {
      const sobrou = lista.filter(e => {
        const item = itemDaFila(obrasNovas, e)
        return item && podeEnfileirar(item.unidade)
      })
      // mesma lista? devolve a MESMA referência, para não disparar gravação
      return sobrou.length === lista.length ? lista : sobrou
    })
  }, [])

  /* Salvar pelo Editor pode ter marcado um volume como lido — e o que foi
     lido sai da fila. A poda roda de DENTRO do `setObras`, sobre a lista já
     atualizada: fora dela o `obras` do render ainda é a coleção de antes. */
  const upsertObra = useCallback((rec) => {
    marcarAlterado(); registerEditora(rec.editora)
    setObras(list => {
      const i = list.findIndex(o => o.id === rec.id)
      const nova = i === -1 ? [...list, rec] : list.map((o, n) => (n === i ? rec : o))
      podarFila(nova)
      return nova
    })
  }, [registerEditora, podarFila])
  /* Cópia inteira da obra, com id novo e "(cópia)" no nome. Nasce como obra
     de verdade — quem duplica quer editar a cópia em seguida, e um rascunho
     que só existe no modal se perderia num toque em Cancelar.
     Clone profundo: série e box têm volumes, e dois registros apontando para
     o mesmo array fariam editar um mexer no outro. */
  const duplicarObra = useCallback((id) => {
    const orig = obras.find(o => o.id === id)
    if (!orig) return null
    const copia = JSON.parse(JSON.stringify(orig))
    copia.id = nextId()
    copia.nome = (orig.nome || 'Obra') + ' (cópia)'
    marcarAlterado()
    setObras(list => [...list, copia])
    return copia
  }, [obras, nextId])

  const deleteObra = useCallback((id) => {
    // se a apagada era a fixada, o destaque some junto
    setFixada(f => { if (f === id) { try { localStorage.removeItem('gibiteca_fixada') } catch (e) { /* */ } return null } return f })
    marcarAlterado()
    // a obra apagada leva as entradas dela na fila junto
    setObras(list => { const nova = list.filter(o => o.id !== id); podarFila(nova); podarListas(nova); return nova })
  }, [podarFila, podarListas])

  /* Desmembra uma série ou box: cada volume vira uma obra avulsa, e o
   * registro que os agrupava deixa de existir.
   *
   * Os registros novos saem de `fragmentosDe`, em helpers.js, que é quem sabe
   * o que cada parte herda. Aqui fica só o que é do estado: os ids, a
   * fixação e a troca da lista.
   *
   * UMA passada de estado, não "apaga e depois cria": entre as duas o app
   * renderizaria uma coleção sem a série e sem os volumes, e a gravação
   * automática poderia pegar justamente esse intervalo e salvar o buraco.
   *
   * Os ids saem corridos a partir do maior em uso. Reaproveitar o id da
   * série para o primeiro volume economizaria um número e custaria caro: a
   * obra fixada é guardada POR ID, e o alfinete passaria, sem pedir licença,
   * da série para o volume 1.
   *
   * Por isso mesmo a fixação some junto quando é a série que está fixada —
   * mesmo motivo e mesmo cuidado de `deleteObra`. Escolher um volume para
   * herdar o destaque seria o app decidindo no lugar de quem fixou.
   *
   * SEM DESFAZER, como todo o resto do app. Quem pergunta antes é a tela —
   * ver DetailSheet.jsx. */
  const desmembrarObra = useCallback((id) => {
    const orig = obras.find(o => o.id === id)
    if (!orig) return null
    const ultimo = obras.reduce((m, o) => Math.max(m, o.id || 0), 0)
    const novas = fragmentosDe(orig, ultimo)
    if (!novas.length) return null          // obra sem volumes: nada a desmembrar
    setFixada(f => { if (f === id) { try { localStorage.removeItem('gibiteca_fixada') } catch (e) { /* */ } return null } return f })
    marcarAlterado()
    /* Os volumes viram obras com ids NOVOS: nenhuma entrada da fila aponta
       mais para eles, e a poda limpa as órfãs. Não há como transportá-las —
       a entrada dizia "volume 3 da série 7", e a série 7 deixou de existir. */
    setObras(list => { const nova = [...list.filter(o => o.id !== id), ...novas]; podarFila(nova); return nova })
    trocarNasListas(id, novas.map(o => o.id))
    return novas
  }, [obras, podarFila, trocarNasListas])


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
    setSort, setView, setPage, setPageSize, setFilter, resetFilters, loadBackup, aplicarObras,
    tema, setTema,
    nextId, upsertObra, duplicarObra, desmembrarObra, deleteObra, setCovers,
    // fila de leitura
    fila, alternarFila, removerDaFila, reordenarFila, marcarLido,
    // listas
    listas, criarLista, renomearLista, apagarLista, alternarNaLista, definirListasDaObra,
    filtered, total, totalPages, start, pageItems, all,
    fixada, fixarObra,
    // nuvem
    cloud, sync, syncErro, semEspaco, falhasAoGuardar, dadoIlegivel, guessRepo, cloudConnect, cloudDisconnect, pullFromCloud, cloudPushNow,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
