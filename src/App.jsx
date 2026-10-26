import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './lib/store.jsx'
import Header from './components/Header.jsx'
import Abertura from './components/Abertura.jsx'
import { usaMovimentoReduzido } from './lib/motion.js'
import Collection from './components/Collection.jsx'
import Footer from './components/Footer.jsx'
import Divisoria from './components/Divisoria.jsx'
import Welcome from './components/Welcome.jsx'
import Entrada from './components/Entrada.jsx'
import Backup from './components/Backup.jsx'
import Tema from './components/Tema.jsx'
import Fila from './components/Fila.jsx'
import Listas from './components/Listas.jsx'
import FiltersDrawer from './components/FiltersDrawer.jsx'
import DetailSheet from './components/DetailSheet.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import Editor from './components/Editor.jsx'
import Stats from './components/Stats.jsx'
import Cloud from './components/Cloud.jsx'
import BulkCovers from './components/BulkCovers.jsx'
import AvisoSemEspaco from './components/AvisoSemEspaco.jsx'
import FichaAtividades from './components/FichaAtividades.jsx'
import Configuracoes from './components/Configuracoes.jsx'
import Ajuda from './components/Ajuda.jsx'
import { baixarBackup } from './lib/backup.js'

export default function App() {
  const { filters, cloud: cloudCfg, obras, editoras, duplicarObra, desmembrarObra, fila, listas, conta, sessao,
          recemCadastrado, limparRecemCadastrado } = useStore()

  /* O PORTÃO: entrou ou não entrou.
   *
   * Exige as DUAS coisas de acordo — a sessão deste aparelho e a conta
   * guardada. Uma sessão sozinha deixaria entrar sem perfil nenhum; uma
   * conta sozinha deixaria entrar quem nunca digitou o e-mail aqui.
   *
   * E compara os e-mails porque restaurar um backup troca a CONTA e não a
   * sessão (ver applyData no store): o arquivo de outra pessoa deixaria a
   * sessão antiga valendo sobre dados que não são dela. Discordando, a porta
   * reaparece e pede o e-mail de quem a coleção é agora.
   */
  const entrou = !!sessao && !!conta.email && sessao.email === conta.email
  // Abertura: a marca aparece no meio e viaja até o cabeçalho encolhendo.
  // Quem pediu menos movimento não vê tela nenhuma — entra direto na estante.
  const semMovimento = usaMovimentoReduzido()
  const [abrindo, setAbrindo] = useState(() => !semMovimento)
  useEffect(() => {
    if (!abrindo) return
    // uma batida só: tempo de reconhecer a marca, não de esperar por ela
    const t = setTimeout(() => setAbrindo(false), 550)
    return () => clearTimeout(t)
  }, [abrindo])

  /* A capa da gibiteca. Aparece a cada carregamento e sai no clique do botão
     — como abrir um gibi pela capa. Não fica guardada em lugar nenhum: se um
     dia incomodar ver a capa toda vez, é aqui que se troca por um
     localStorage. */
  const [welcome, setWelcome] = useState(true)

  const [showFilters, setShowFilters] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editor, setEditor] = useState(null)   // null = fechado | {} = nova | obra = editar
  const [search, setSearch] = useState(false)
  const [stats, setStats] = useState(false)
  const [cloud, setCloud] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [movimentacao, setMovimentacao] = useState(false)
  const [config, setConfig] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const [backup, setBackup] = useState(false)
  const [temaAberto, setTemaAberto] = useState(false)

  /* O TEMA ABRE SOZINHO AO FIM DO CADASTRO.
   *
   * É a primeira coisa que se pode escolher nesta casa, e a única que muda a
   * cara do app inteiro — mostrá-la de saída transforma o primeiro segundo de
   * quem chegou, que seria uma estante vazia, numa escolha.
   *
   * Só no CADASTRO, não no login: quem volta já escolheu o tema dele, e
   * reabrir a cada entrada seria pedir a mesma decisão para sempre.
   *
   * A marca é consumida na hora, e vive só em memória — recarregar a página
   * não é cadastrar de novo. O `limpar` roda ANTES de abrir para o efeito não
   * reentrar se o React remontar. */
  useEffect(() => {
    if (!recemCadastrado) return
    limparRecemCadastrado()
    setTemaAberto(true)
  }, [recemCadastrado, limparRecemCadastrado])
  const [filaAberta, setFilaAberta] = useState(false)
  const [listasAbertas, setListasAbertas] = useState(false)
  const [toast, setToast] = useState('')

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2400) }

  const f = filters
  /* Um campo ligado conta 1, mesmo com três valores marcados: o número diz
     quantos filtros estão em uso, não quantas opções. */
  const ligado = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
  const filterCount =
    (f.status !== 'todos' ? 1 : 0) + (f.leitura !== 'todos' ? 1 : 0) +
    ['tipo', 'tipoEdicao', 'editora', 'autor', 'nota', 'importado', 'urgencia']
      .reduce((n, k) => n + (ligado(f[k]) ? 1 : 0), 0)

  const openEditor = (obra) => { setDetail(null); setEditor(obra || {}) }

  /* Duplicar já grava a cópia e abre o editor nela: o nome vem com "(cópia)"
     e é justamente o que a pessoa vai querer trocar primeiro. */
  const duplicar = (obra) => {
    const nova = duplicarObra(obra.id)
    if (!nova) return
    setDetail(null); setEditor(nova)
    say('Cópia criada — ajuste o que mudar ✓')
  }

  /* Desmembrar fecha a gaveta e NÃO abre o editor — ao contrário de duplicar.
     Duplicar entrega uma obra só, que a pessoa vai querer renomear na hora;
     desmembrar entrega N, e abrir o editor em qualquer uma delas seria
     escolher uma por conta própria. O aviso diz quantas nasceram e a estante
     mostra todas. */
  const desmembrar = (obra) => {
    const novas = desmembrarObra(obra.id)
    if (!novas) return
    setDetail(null)
    say(`Desmembrada em ${novas.length} obras avulsas ✓`)
  }

  const openBulk = () => {
    if (!cloudCfg.connected) { say('Conecte a nuvem primeiro para enviar as capas.'); setCloud(true); return }
    setBulk(true)
  }

  return (
    <>
      {/* Cabeçalho, números e barra grudam juntos: numa coleção de 142
          itens a barra de filtros não pode sumir ao rolar. As referências
          usam sticky com muito mais liberdade (45 declarações no United
          Carriers) do que só no topo da página. */}
      <Abertura aberto={abrindo} />

      {/* Uma barra só, de ponta a ponta, com a marca no centro nos dois
          tamanhos. No celular ela ganha uma segunda linha com filtro e
          galeria/lista — ver Header.jsx. */}
      {/* Se o navegador recusou guardar, isto precisa aparecer antes de
          qualquer outra coisa: as alterações só existem nesta aba. */}
      <AvisoSemEspaco onNuvem={() => setCloud(true)} onBackup={() => baixarBackup(obras, editoras, fila, listas)} />

      {/* Na capa NÃO há cabeçalho — só o logo, grande e solto. Ele e o logo da
          barra são o MESMO elemento para o framer-motion (`layoutId="marca"`),
          então ao entrar na coleção a marca viaja até a barra encolhendo, em
          vez de uma sumir e outra aparecer.

          Por isso os dois nunca podem existir ao mesmo tempo: dois elementos
          com o mesmo layoutId quebram a animação. É o ternário abaixo que
          garante isso — um renderiza exatamente quando o outro não. */}
      {welcome ? (
        <Welcome onEntrar={() => setWelcome(false)} aberturaNoAr={abrindo} />
      ) : !entrou ? (
      /* A PORTA. O cabeçalho fica, só com a marca (`soMarca`): é ela que
         viaja da capa até a barra, e cortar o cabeçalho aqui faria o logo
         sumir no meio da viagem para voltar depois do login. Busca, menu e
         contagem saem — são portas para uma coleção que ainda não se sabe
         de quem é. */
      <>
        <Header soMarca aberturaNoAr={abrindo} />
        <Entrada />
      </>
      ) : (
      <>
      {/* sem embrulho: o sticky e o espaçamento moram na própria barra agora */}
      <Header
          onCloud={() => setCloud(true)}
          onConfig={() => setConfig(true)}
          onAjuda={() => setAjuda(true)}
          onBackup={() => setBackup(true)}
          onTema={() => setTemaAberto(true)}
          onFila={() => setFilaAberta(true)}
          onListas={() => setListasAbertas(true)}
          onFilters={() => setShowFilters(true)}
          onStats={() => setStats(true)}
          onSearch={() => setSearch(true)}
          filterCount={filterCount}
          aberturaNoAr={abrindo}
      />
      <Collection onOpen={setDetail} />
      <Divisoria />
      <Footer onAbrirFicha={() => setMovimentacao(true)} fichaAberta={movimentacao} />

      {/* FAB Nova obra */}
      <button
        onClick={() => openEditor(null)}
 className="cta cta-carimbo group fixed right-5 bottom-5 z-40 !bg-moss hover:!bg-moss-2 !pl-6 !text-corpo !text-sobre-acento"
      >
        Nova obra
        <span className="knob" aria-hidden="true">
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      </>
      )}

      <Backup open={backup} onClose={() => setBackup(false)} onNotice={say} />
      <Tema open={temaAberto} onClose={() => setTemaAberto(false)} />
      <Fila open={filaAberta} onClose={() => setFilaAberta(false)} onNotice={say} onEditar={setEditor} />
      <Listas open={listasAbertas} onClose={() => setListasAbertas(false)} onNotice={say} onEditar={setEditor} />
      <FiltersDrawer open={showFilters} onClose={() => setShowFilters(false)} />
      <DetailSheet obra={detail} onClose={() => setDetail(null)} onEdit={openEditor} onDuplicar={duplicar} onDesmembrar={desmembrar} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <Stats open={stats} onClose={() => setStats(false)} />
      <FichaAtividades open={movimentacao} onClose={() => setMovimentacao(false)} />
      <Configuracoes
        open={config} onClose={() => setConfig(false)}
        onBulk={openBulk} onBackup={() => setBackup(true)} onNotice={say}
      />
      <Ajuda open={ajuda} onClose={() => setAjuda(false)} onNotice={say} />

      <Cloud open={cloud} onClose={() => setCloud(false)} onNotice={say} />
      <BulkCovers open={bulk} onClose={() => setBulk(false)} onNotice={say} />
      <Editor target={editor} onClose={() => setEditor(null)} onSaved={say} />

      <AnimatePresence>
        {toast && (
          <motion.div
 className="fixed left-1/2 bottom-6 z-[90] -translate-x-1/2 bg-ink text-paper px-6 py-3.5 rounded-full text-sm shadow-amb-lg"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
