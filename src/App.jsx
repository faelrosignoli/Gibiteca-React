import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './lib/store.jsx'
import Header, { LogoMobile } from './components/Header.jsx'
import Collection from './components/Collection.jsx'
import Footer from './components/Footer.jsx'
import FiltersDrawer from './components/FiltersDrawer.jsx'
import DetailSheet from './components/DetailSheet.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import Editor from './components/Editor.jsx'
import Stats from './components/Stats.jsx'
import Cloud from './components/Cloud.jsx'
import BulkCovers from './components/BulkCovers.jsx'

export default function App() {
  const { filters, cloud: cloudCfg } = useStore()
  const [showFilters, setShowFilters] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editor, setEditor] = useState(null)   // null = fechado | {} = nova | obra = editar
  const [search, setSearch] = useState(false)
  const [stats, setStats] = useState(false)
  const [cloud, setCloud] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [toast, setToast] = useState('')

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2400) }

  const f = filters
  const filterCount = ['status', 'tipo', 'editora', 'pais', 'autor'].reduce((n, k) => n + (k === 'status' ? (f.status !== 'todos' ? 1 : 0) : (f[k] ? 1 : 0)), 0)
    + (f.leitura !== 'todos' ? 1 : 0) + (f.importado ? 1 : 0) + (f.urgencia ? 1 : 0)

  const openEditor = (obra) => { setDetail(null); setEditor(obra || {}) }

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
      {/* No celular o logo fica no topo da página e rola junto com o conteúdo;
          só a pílula de botões acompanha a rolagem. No desktop o logo vive
          dentro da própria pílula, no centro. */}
      <LogoMobile />

      {/* uma barra só: Busca · Filtros · Estatísticas · logo · Galeria/Lista · ☰
          Sem faixa de fundo e sem desfoque: o que flutua é a pílula, e só ela. */}
      <div className="sticky top-0 z-30 pt-3 pb-3">
        <Header
          onCloud={() => setCloud(true)}
          onBulk={openBulk}
          onFilters={() => setShowFilters(true)}
          onStats={() => setStats(true)}
          onSearch={() => setSearch(true)}
          filterCount={filterCount}
        />
      </div>
      <Collection onOpen={setDetail} />
      <Footer />

      {/* FAB Nova obra */}
      <button
        onClick={() => openEditor(null)}
 className="cta group fixed right-5 bottom-5 z-40 !bg-moss hover:!bg-moss-2 !pl-6 !text-corpo"
      >
        Nova obra
        <span className="knob" aria-hidden="true">
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>

      <FiltersDrawer open={showFilters} onClose={() => setShowFilters(false)} />
      <DetailSheet obra={detail} onClose={() => setDetail(null)} onEdit={openEditor} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <Stats open={stats} onClose={() => setStats(false)} />
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
