import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { passes, sortList, sequenciaAgrupada, fragmentosDe, chaveFila, itemDaFila, podeEnfileirar, volsOf } from './helpers.js'
import { EDITORAS } from '../data.js'
import { CONTA_VAZIA, limparCodigo, maiorDeIdade } from './conta.js'
import { ghCheckRepo, ghGet, ghPut, lerColecao, b64enc, b64dec, guessRepo } from './cloud.js'
import { compararColecoes, mensagemDeCommit } from './diario.js'
import { carimboDe, decidirAoAbrir, haConflitoAoEnviar, ehColecao } from './sync.js'
import { useTema } from './store/tema.js'
import { useFila } from './store/fila.js'
import { useListas } from './store/listas.js'

export { carimboDe }

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

/* Editora, país, autor e tipo de edição guardam LISTA, não valor único: dá
 * para marcar "Panini" e "Pipoca & Nanquim" ao mesmo tempo. Vários valores no
 * mesmo campo somam (OU); campos diferentes continuam se cruzando (E).
 *
 * É função, não constante: devolvendo listas novas a cada chamada, "limpar
 * filtros" não entrega ao estado os mesmos arrays que estavam em uso. */
/* O PERFIL: quem é o dono desta coleção.
 *
 * Mora dentro de `gibiteca_v1`, junto das obras — e não numa chave própria.
 * O motivo é o mesmo da fila e das listas: é dado do usuário, e dado do
 * usuário vai no backup e na nuvem. Trocar de aparelho sem levar o nome e a
 * foto seria chegar numa casa vazia.
 *
 * É função e não constante para devolver um objeto novo a cada chamada:
 * constante compartilhada vira estado compartilhado no primeiro `...spread`
 * distraído.
 *
 * Primeiro nome e sobrenome SEPARADOS, não um campo só. Quem trata os dois
 * como uma string descobre tarde que precisa do primeiro nome sozinho — para
 * saudar, para ordenar, para abreviar — e aí tem que adivinhar onde cortar.
 */
/* `mostrarAdulto` vive no PERFIL, e nao numa chave propria do aparelho como o
   tema: e uma preferencia da PESSOA, nao da tela. Guardada aqui, ela viaja no
   backup e na nuvem junto com a conta — quem ligou num aparelho nao precisa
   ligar de novo no outro. Nasce DESLIGADA, sempre. */
export const PERFIL_VAZIO = () => ({ foto: null, nome: '', sobrenome: '', mostrarAdulto: false })

/* A SESSAO — estar logado AGORA.
 *
 * Chave propria, fora de `gibiteca_v1`, e por isso fora do backup e da
 * nuvem. Nao e dado da colecao, e fato deste aparelho: levar a sessao num
 * arquivo restaurado deixaria a pessoa logada num computador onde ela nunca
 * digitou o e-mail — e seria o backup, nao o login, decidindo quem entra.
 *
 * Guarda o e-mail junto do horario para o portao conferir se a sessao e da
 * conta que esta aqui. Sem isso, restaurar o backup de outra conta deixaria
 * a sessao antiga valendo sobre dados de outra pessoa.
 */
const CHAVE_SESSAO = 'gibiteca_sessao'

function lerSessao() {
  try {
    const b = localStorage.getItem(CHAVE_SESSAO)
    const d = b ? JSON.parse(b) : null
    return d && typeof d === 'object' && d.email ? d : null
  } catch (e) { return null }
}

export const filtrosPadrao = () => ({
  q: '', status: 'todos', tipo: '', tipoEdicao: [], editora: [], autor: [], nota: '',
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
function loadInitial() {
  let bruto = null
  try { bruto = localStorage.getItem('gibiteca_v1') } catch (e) { /* navegador sem storage */ }
  if (!bruto) return { obras: [], editoras: EDITORAS, fila: [], listas: [], perfil: PERFIL_VAZIO(), conta: CONTA_VAZIA(), carimbo: 0, ilegivel: false }
  try {
    const d = JSON.parse(bruto)
    if (Array.isArray(d.obras)) return { obras: d.obras, editoras: d.editoras || EDITORAS, fila: Array.isArray(d.fila) ? d.fila : [], listas: Array.isArray(d.listas) ? d.listas : [], perfil: { ...PERFIL_VAZIO(), ...(d.perfil || {}) }, conta: { ...CONTA_VAZIA(), ...(d.conta || {}) }, carimbo: carimboDe(d), ilegivel: false }
  } catch (e) { /* cai no aviso abaixo */ }
  /* HAVIA dado guardado e não deu para ler.
   *
   * Antes isto virava uma estante vazia, sem uma palavra: 554 obras viravam
   * zero e parecia que tudo tinha sido perdido. E pior, o app seguia como se
   * estivesse tudo bem. Agora a coleção continua vazia (não há o que mostrar),
   * mas o app DIZ que o dado existe e está ilegível — e o carimbo fica em
   * zero, então esse vazio nunca sobe para a nuvem por cima do que está lá. */
  return { obras: [], editoras: EDITORAS, fila: [], listas: [], perfil: PERFIL_VAZIO(), conta: CONTA_VAZIA(), carimbo: 0, ilegivel: true }
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
  // '' | 'editora' | 'autor' | 'desenhista'
  const [agrupar, setAgruparState] = useState('')
  const [view, setView] = useState('galeria')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(() => Number(localStorage.getItem('gibiteca_pagesize')) || 40)

  /* O CARIMBO E A MARCA DE SUJO SOBEM PARA O ALTO porque as fatias de baixo
     (fila, listas) precisam de `marcarAlterado` no momento em que são
     chamadas — e o que o JavaScript ainda não leu, ainda não existe.

     `dirty` diz que há alteração local por gravar; `carimbo` é a hora dela,
     e é por ele que a nuvem decide quem está na frente. O que vem da nuvem
     herda o carimbo de lá, para os dois lados ficarem comparáveis. */
  const dirty = useRef(false)
  const carimbo = useRef(init.carimbo || 0)
  const marcarAlterado = useCallback(() => { dirty.current = true; carimbo.current = Date.now() }, [])

  const [tema, setTema] = useTema()

  const {
    fila, setFila, alternarFila, removerDaFila, reordenarFila, marcarLido,
  } = useFila({ inicial: init.fila, marcarAlterado, setObras })

  const {
    listas, setListas, criarLista, renomearLista, reordenarLista,
    alternarNumeracao, apagarLista, alternarNaLista, definirListasDaObra,
    podarListas, trocarNasListas,
  } = useListas({ inicial: init.listas, marcarAlterado })

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

  // ---- perfil ----
  const [perfil, setPerfilState] = useState(init.perfil)

  /* ACABOU DE CRIAR A CONTA — um sinal de uma vez só.
     O App usa para abrir o pop-up de Tema logo depois do cadastro, e apaga a
     marca ao consumir. Vive em memória de propósito: recarregar a página não
     é "cadastrar de novo", e um flag guardado reabriria o Tema para sempre. */
  const [recemCadastrado, setRecemCadastrado] = useState(false)

  /* Aceita pedaços: `setPerfil({ nome })` não apaga a foto. O formulário
     grava campo a campo enquanto se digita, e um setter que substitui o
     objeto inteiro zeraria o resto a cada tecla. */
  const setPerfil = useCallback((partes) => {
    marcarAlterado()
    setPerfilState(p => ({ ...p, ...partes }))
  }, [])

  // ---- conta ----
  const [conta, setContaState] = useState(init.conta)
  const [sessao, setSessaoState] = useState(lerSessao)

  /* Entrou: o e-mail ja foi confirmado pelo codigo. Esta funcao NAO confere
     nada — quem confere e o `conferirCodigo` do conta.js, que na Etapa 1 vira
     o servidor. Aqui so se registra o fato. */
  const entrarNaConta = useCallback((email) => {
    const s = { email, desde: Date.now() }
    try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)) } catch (e) { /* sessao so nesta aba */ }
    setSessaoState(s)
  }, [])

  /* Sair apaga a SESSAO e mais nada. A colecao fica onde esta: sair nao e
     apagar, e quem sai de um aparelho proprio espera achar tudo de volta ao
     entrar. Quem quer apagar usa o botao que diz apagar. */
  const sairDaConta = useCallback(() => {
    try { localStorage.removeItem(CHAVE_SESSAO) } catch (e) { /* */ }
    setSessaoState(null)
  }, [])

  /* Criar conta e UMA operacao, apesar de escrever em tres lugares (conta,
     perfil, sessao). Fica no store porque e o unico lugar que alcanca os tres
     — espalhado pela tela, um cadastro interrompido no meio deixaria conta sem
     perfil, ou perfil sem conta. */
  const criarConta = useCallback(({ email, nascimento, termos, nome, sobrenome, foto }) => {
    marcarAlterado()
    setContaState({ email, nascimento, termos })
    /* `mostrarAdulto: false` explícito: este objeto é montado do zero, e sem a
       chave o campo nasceria `undefined` — falsy, então o véu até ficaria no
       lugar certo, mas o perfil sairia sem a forma que o resto do app espera. */
    setPerfilState({ foto: foto || null, nome: nome || '', sobrenome: sobrenome || '', mostrarAdulto: false })
    setRecemCadastrado(true)
    entrarNaConta(email)
  }, [entrarNaConta])

  /* Aceita pedacos, como o setPerfil: trocar o e-mail nao mexe no aceite dos
     termos nem na data de nascimento. */
  const setConta = useCallback((partes) => {
    marcarAlterado()
    setContaState(c => ({ ...c, ...partes }))
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
  const dataRef = useRef({ obras: init.obras, editoras: init.editoras, fila: init.fila, listas: init.listas, perfil: init.perfil, conta: init.conta })
  useEffect(() => { dataRef.current = { obras, editoras, fila, listas, perfil, conta } }, [obras, editoras, fila, listas, perfil, conta])
  const writeCloud = useCallback((next) => {
    cloudRef.current = next; setCloudState(next)
    // se a configuração da nuvem não puder ser gravada, a pessoa vai
    // reconectar amanhã sem entender por quê — melhor dizer
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify(next)) }
    catch (e) { setSyncErro('A configuração da nuvem não pôde ser guardada neste navegador (sem espaço). Ela vale só nesta aba.') }
  }, [])

  const pushTimer = useRef(null), pushing = useRef(false), pushAgain = useRef(false), skipPush = useRef(false)

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
        if (haConflitoAoEnviar({ carimboLocal: carimbo.current, carimboNuvem: laFora, forcar })) {
          // a nuvem está na frente: não grava por cima
          writeCloud({ ...cloudRef.current, sha: f.sha })
          setSync('conflito')
          pushing.current = false
          pushAgain.current = false   // conflito não reenfileira: o envio seguinte sairia dobrado
          return
        }
      }

      const { obras, editoras, fila, listas, perfil, conta } = dataRef.current
      const agora = Date.now()
      const json = JSON.stringify(
        { version: 1, atualizadoEm: agora, updated: new Date(agora).toISOString(), obras, editoras, fila, listas, perfil, conta }, null, 1)
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
      localStorage.setItem('gibiteca_v1', JSON.stringify({ version: 1, atualizadoEm: carimbo.current, obras, editoras, fila, listas, perfil, conta }))
    } catch (e) { gravou = false }
    setSemEspaco(!gravou)
    if (!gravou) setFalhasAoGuardar(n => n + 1)
    if (skipPush.current) { skipPush.current = false; return }
    if (!gravou) { clearTimeout(pushTimer.current); pushToCloud(); return }
    scheduleCloudPush()
  }, [obras, editoras, fila, listas, perfil, conta, scheduleCloudPush, pushToCloud])

  /* Usado só pelo applyData: troca o perfil inteiro SEM carimbar alteração.
     O `setPerfil` normal carimba, e carimbar aqui faria a coleção recém-
     puxada da nuvem parecer mais nova que a nuvem — e voltar para lá. */
  const setPerfil_aplicar = useCallback((p) => {
    setPerfilState({ ...PERFIL_VAZIO(), ...(p || {}) })
  }, [])

  /* DEVOLVE `true` QUANDO TROCOU MESMO.
   *
   * O `return` abaixo é a saída para arquivo que não é coleção — e, calado,
   * ele fazia a tela de Backup dizer "Coleção restaurada" sobre um arquivo
   * que não restaurou nada. Quem chama precisa saber a diferença. */
  const applyData = useCallback((data, { fromCloud = false } = {}) => {
    if (!ehColecao(data)) return false
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
    /* Arquivo sem perfil (backup anterior a isto) devolve o perfil VAZIO, e
       não o que está na tela: restaurar é trocar a coleção inteira, e um
       nome sobrevivente seria o dono errado numa coleção que não é dele. */
    setPerfil_aplicar(data.perfil)
    /* A conta vem do arquivo; a SESSAO nao. Restaurar e trocar a colecao,
       inclusive de quem ela e — mas quem esta logado neste aparelho continua
       sendo quem digitou o e-mail aqui. Se o arquivo for de outra conta, o
       portao do App ve sessao e conta discordando e pede login de novo. */
    setContaState({ ...CONTA_VAZIA(), ...(data.conta || {}) })
    setPage(1)
    return true
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

        const decisao = decidirAoAbrir({
          carimboLocal: carimbo.current,
          carimboNuvem: laFora,
          temCoisaAqui: (dataRef.current.obras || []).length > 0,
        })
        if (decisao === 'conflito') { setSync('conflito'); return }
        if (decisao === 'puxar') applyData(dados, { fromCloud: true })
        else if (decisao === 'enviar') { setSync('ok'); scheduleCloudPush(); return }
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

  /* APAGAR A CONTA — o fim da linha, e o unico caminho que leva tudo.
   *
   * Passa pelo applyData, e nao por um `localStorage.clear()`, porque e o
   * mesmo caminho de restaurar um backup: ja testado, ja carimbado, ja
   * sincronizado. Um clear cru deixaria o React desenhando o estado antigo
   * sobre um armazenamento vazio ate alguem recarregar a pagina.
   *
   * A SESSAO sai junto, e e a unica diferenca em relacao a restaurar: sem
   * conta nao ha sessao possivel, e deixar a sessao viva depois de apagar
   * deixaria o portao do App aberto para uma conta que nao existe mais.
   *
   * O codigo pendente tambem morre: um codigo valido sobrando apontaria para
   * um e-mail que esta conta ja nao tem.
   *
   * O QUE ISTO NAO APAGA: o que ja subiu para a nuvem. A nuvem e um
   * repositorio do GitHub com historico, e apagar de verdade la e outro
   * assunto — por isso o aviso na tela diz exatamente isso em vez de
   * prometer uma faxina que o app ainda nao sabe fazer.
   */
  const apagarConta = useCallback(() => {
    sairDaConta()
    limparCodigo()
    applyData({ obras: [], editoras: EDITORAS, fila: [], listas: [], perfil: null, conta: null })
  }, [applyData, sairDaConta])
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
    // agrupado, a fixada NÃO sobe para o topo: ela pertence ao bloco dela, e
    // puxá-la para fora abriria um buraco no meio da grade
    if (fixada == null || agrupar) return lista
    const i = lista.findIndex(o => o.id === fixada)
    if (i <= 0) return lista               // não está na lista, ou já é a primeira
    return [lista[i], ...lista.slice(0, i), ...lista.slice(i + 1)]
  }, [obras, filters, sort, fixada, agrupar])

  /* A sequência de CARTÕES. Sem agrupamento é a própria lista; agrupada, é a
     lista reordenada em blocos — e maior que ela, porque a obra de dois
     autores aparece em dois blocos. É sobre ela que a paginação corre. */
  const sequencia = useMemo(
    () => (agrupar ? sequenciaAgrupada(filtered, agrupar, sort.dir) : null),
    [filtered, agrupar, sort.dir])

  const total = filtered.length          // OBRAS, não cartões: é o que o botão conta
  const cartoes = sequencia ? sequencia.length : total
  const all = pageSize >= 99999
  const totalPages = all ? 1 : Math.max(1, Math.ceil(cartoes / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = all ? 0 : (safePage - 1) * pageSize
  const fatia = sequencia
    ? (all ? sequencia : sequencia.slice(start, start + pageSize))
    : (all ? filtered : filtered.slice(start, start + pageSize))
  const pageItems = sequencia ? fatia.map(x => x.obra) : fatia

  /* O que a vitrine precisa para desenhar os cabeçalhos: o grupo de cada
     cartão da página, o tamanho de cada bloco (o total dele, não o que coube
     na página) e se o primeiro bloco da página já vinha da página anterior. */
  const pageGrupos = sequencia ? fatia.map(x => x.grupo) : null
  const tamanhosDeGrupo = useMemo(() => {
    const m = new Map()
    if (sequencia) for (const x of sequencia) m.set(x.grupo, (m.get(x.grupo) || 0) + 1)
    return m
  }, [sequencia])
  const grupoContinua = !!(sequencia && start > 0 && fatia.length
    && sequencia[start - 1] && sequencia[start - 1].grupo === fatia[0].grupo)

  const setAgrupar = useCallback((v) => { setAgruparState(v); setPage(1) }, [])

  /* O VALOR DO CONTEXTO É MEMORIZADO.
   *
   * Sem isto ele era um objeto novo a cada render do provider, e um objeto
   * novo faz TODA tela que lê o store se redesenhar — inclusive as que não
   * têm nada a ver com o que mudou. Com 600 obras isso aparece ao digitar.
   *
   * A lista de dependências abaixo é literalmente tudo que o objeto lê. Ela
   * é longa de propósito: esquecer um nome aqui congela a tela com dado
   * velho, que é um defeito muito pior do que o que isto conserta.
   * `setRecemCadastrado` é setter do React (estável) e não entra. */
  const value = useMemo(() => ({
    obras, editoras, filters, sort, view, page: safePage, pageSize,
    setSort, setView, setPage, setPageSize, setFilter, resetFilters, loadBackup, aplicarObras,
    tema, setTema,
    nextId, upsertObra, duplicarObra, desmembrarObra, deleteObra, setCovers,
    // fila de leitura
    fila, alternarFila, removerDaFila, reordenarFila, marcarLido,
    // perfil
    perfil, setPerfil,
    /* A TRAVA DE IDADE MORA AQUI, e não na tela do interruptor.

       `verAdulto` é o que todo desenho de capa pergunta. Deixar cada tela
       olhar `perfil.mostrarAdulto` direto faria a trava valer só no botão — e
       bastaria restaurar um backup de conta adulta numa conta de menor para o
       ajuste chegar ligado e o véu sair. Com a conta entrando na conta, o
       dado sozinho nunca basta.

       `podeAdulto` é separado porque a tela precisa dos dois: o interruptor
       fica desligado E impedido quando a idade não permite. */
    verAdulto: !!perfil.mostrarAdulto && maiorDeIdade(conta.nascimento),
    podeAdulto: maiorDeIdade(conta.nascimento),
    recemCadastrado, limparRecemCadastrado: () => setRecemCadastrado(false),
    // conta e sessao
    conta, setConta, sessao, criarConta, entrarNaConta, sairDaConta, apagarConta,
    // listas
    listas, criarLista, renomearLista, apagarLista, alternarNaLista, definirListasDaObra, alternarNumeracao, reordenarLista,
    filtered, total, totalPages, start, pageItems, all,
    agrupar, setAgrupar, pageGrupos, tamanhosDeGrupo, grupoContinua,
    fixada, fixarObra,
    // nuvem
    cloud, sync, syncErro, semEspaco, falhasAoGuardar, dadoIlegivel, guessRepo, cloudConnect, cloudDisconnect, pullFromCloud, cloudPushNow,
  }), [
    agrupar, all, alternarFila, alternarNaLista, alternarNumeracao, apagarConta,
    apagarLista, aplicarObras, cloud, cloudConnect, cloudDisconnect, cloudPushNow,
    conta, criarConta, criarLista, dadoIlegivel, definirListasDaObra, deleteObra,
    desmembrarObra, duplicarObra, editoras, entrarNaConta, falhasAoGuardar, fila,
    filtered, filters, fixada, fixarObra, grupoContinua, guessRepo, listas, loadBackup,
    marcarLido, nextId, obras, pageGrupos, pageItems, pageSize, perfil, pullFromCloud,
    recemCadastrado, removerDaFila, renomearLista, reordenarFila, reordenarLista,
    resetFilters, safePage, sairDaConta, semEspaco, sessao, setAgrupar, setConta,
    setCovers, setFilter, setPage, setPageSize, setPerfil, setSort, setTema, setView,
    sort, start, sync, syncErro, tamanhosDeGrupo, tema, total, totalPages, upsertObra,
    view,
  ])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
