import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' => build funciona como site estático em qualquer pasta (GitHub Pages inclusive)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    open: true,   // abre o navegador sozinho ao subir o servidor
    port: 5173,
  },
})
