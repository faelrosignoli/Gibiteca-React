import React from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import { StoreProvider } from './lib/store.jsx'
import Salvaguarda from './components/Salvaguarda.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* A salvaguarda fica POR FORA do StoreProvider de propósito: se o erro
        vier do próprio store, ela ainda precisa conseguir desenhar a tela de
        resgate e oferecer o backup. */}
    <Salvaguarda>
      <MotionConfig reducedMotion="user">
        <StoreProvider>
          <App />
        </StoreProvider>
      </MotionConfig>
    </Salvaguarda>
  </React.StrictMode>
)
