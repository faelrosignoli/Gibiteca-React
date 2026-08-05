import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './lib/store.jsx'
import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import Collection from './components/Collection.jsx'
import Footer from './components/Footer.jsx'
import FiltersDrawer from './components/FiltersDrawer.jsx'
import DetailSheet from './components/DetailSheet.jsx'

export default function App() {
  const { filters } = useStore()
  const [showFilters, setShowFilters] = useState(false)
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState('')

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2400) }

  const f = filters
  const filterCount = ['status','tipo','editora','pais','autor','genero'].reduce((n,k)=> n + (k==='status' ? (f.status!=='todos'?1:0) : (f[k]?1:0)), 0)
    + (f.leitura !== 'todos' ? 1 : 0) + (f.importado ? 1 : 0) + (f.urgencia ? 1 : 0)

  return (
    <>
      <Header />
      <Toolbar
        onFilters={() => setShowFilters(true)}
        onStats={() => say('Estatísticas chegam na próxima fase 📊')}
        filterCount={filterCount}
      />
      <Collection onOpen={setDetail} />
      <Footer />

      {/* FAB Nova obra */}
      <button
        onClick={() => say('O editor chega na próxima fase ✍️')}
        className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full border-[1.8px] border-ink bg-moss text-white px-5 py-3.5 font-bold text-[15px] shadow-neo-lg hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 transition"
      >
        <span className="text-[22px] leading-none">＋</span> Nova obra
      </button>

      <FiltersDrawer open={showFilters} onClose={() => setShowFilters(false)} />
      <DetailSheet obra={detail} onClose={() => setDetail(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed left-1/2 bottom-6 z-[60] -translate-x-1/2 bg-ink text-paper px-5 py-3 rounded-[10px] text-sm shadow-neo"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
