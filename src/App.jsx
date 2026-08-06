import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './lib/store.jsx'
import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
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
  const filterCount = ['status', 'tipo', 'editora', 'pais', 'autor', 'genero'].reduce((n, k) => n + (k === 'status' ? (f.status !== 'todos' ? 1 : 0) : (f[k] ? 1 : 0)), 0)
    + (f.leitura !== 'todos' ? 1 : 0) + (f.importado ? 1 : 0) + (f.urgencia ? 1 : 0)

  const openEditor = (obra) => { setDetail(null); setEditor(obra || {}) }

  const openBulk = () => {
    if (!cloudCfg.connected) { say('Conecte a nuvem primeiro para enviar as capas.'); setCloud(true); return }
    setBulk(true)
  }

  return (
    <>
      <Header onNotice={say} onCloud={() => setCloud(true)} onBulk={openBulk} />
      <Toolbar
        onFilters={() => setShowFilters(true)}
        onStats={() => setStats(true)}
        onSearch={() => setSearch(true)}
        filterCount={filterCount}
      />
      <Collection onOpen={setDetail} />
      <Footer />

      {/* FAB Nova obra */}
      <button
        onClick={() => openEditor(null)}
        className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full border-[1.8px] border-ink bg-moss text-white px-5 py-3.5 font-bold text-[15px] shadow-neo-lg hover:-translate-x-px hover:-translate-y-px hover:bg-moss-2 active:translate-x-0.5 active:translate-y-0.5 transition"
      >
        <span className="text-[22px] leading-none">＋</span> Nova obra
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
            className="fixed left-1/2 bottom-6 z-[90] -translate-x-1/2 bg-ink text-paper px-5 py-3 rounded-[10px] text-sm shadow-neo"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
