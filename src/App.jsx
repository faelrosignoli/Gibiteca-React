import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './lib/store.jsx'
import Header from './components/Header.jsx'
import Abertura from './components/Abertura.jsx'
import { usaMovimentoReduzido } from './lib/motion.js'
import Collection from './components/Collection.jsx'
import Footer from './components/Footer.jsx'
import FiltersDrawer from './components/FiltersDrawer.jsx'
import DetailSheet from './components/DetailSheet.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import Editor from './components/Editor.jsx'
import Stats from './components/Stats.jsx'
import Cloud from './components/Cloud.jsx'
import BulkCovers from './components/BulkCovers.jsx'
import AvisoSemEspaco from './components/AvisoSemEspaco.jsx'
import Atividades from './components/Atividades.jsx'
import { baixarBackup } from './lib/backup.js'

export default function App() {
  const { filters, cloud: cloudCfg, obras, editoras, duplicarObra } = useStore()
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

  const [showFilters, setShowFilters] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editor, setEditor] = useState(null)   // null = fechado | {} = nova | obra = editar
  const [search, setSearch] = useState(false)
  const [stats, setStats] = useState(false)
  const [cloud, setCloud] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [atividades, setAtividades] = useState(false)
  const [toast, setToast] = useState('')

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2400) }

  const f = filters
  /* Um campo ligado conta 1, mesmo com três valores marcados: o número diz
     quantos filtros estão em uso, não quantas opções. */
  const ligado = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
  const filterCount =
    (f.status !== 'todos' ? 1 : 0) + (f.leitura !== 'todos' ? 1 : 0) +
    ['tipo', 'tipoEdicao', 'editora', 'pais', 'autor', 'importado', 'urgencia']
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
      <AvisoSemEspaco onNuvem={() => setCloud(true)} onBackup={() => baixarBackup(obras, editoras)} />

      {/* sem embrulho: o sticky e o espaçamento moram na própria barra agora */}
      <Header
          onCloud={() => setCloud(true)}
          onBulk={openBulk}
          onAtividades={() => setAtividades(true)}
          onFilters={() => setShowFilters(true)}
          onStats={() => setStats(true)}
          onSearch={() => setSearch(true)}
          filterCount={filterCount}
          aberturaNoAr={abrindo}
      />
      <Collection onOpen={setDetail} />
      <Footer />

      {/* FAB Nova obra */}
      <button
        onClick={() => openEditor(null)}
 className="cta group fixed right-5 bottom-5 z-40 !bg-moss hover:!bg-moss-2 !pl-6 !text-corpo !text-sobre-acento"
      >
        Nova obra
        <span className="knob" aria-hidden="true">
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>

      <FiltersDrawer open={showFilters} onClose={() => setShowFilters(false)} />
      <DetailSheet obra={detail} onClose={() => setDetail(null)} onEdit={openEditor} onDuplicar={duplicar} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <Stats open={stats} onClose={() => setStats(false)} />
      <Atividades open={atividades} onClose={() => setAtividades(false)} />

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
