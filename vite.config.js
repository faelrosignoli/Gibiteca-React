import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* A VERSÃO, do package.json para dentro do app.
 *
 * As Configurações imprimem o número da edição, e ele só existe no
 * package.json. Entra como constante de COMPILAÇÃO — o valor é trocado no
 * build e nenhum JSON vai parar no bundle.
 *
 * Lido com readFileSync, e não com `import ... with { type: 'json' }`, que
 * ainda muda de sintaxe entre versões do Node. */
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// base: './' => build funciona como site estático em qualquer pasta (GitHub Pages inclusive)
export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __VERSAO__: JSON.stringify(version) },
  server: {
    open: true,   // abre o navegador sozinho ao subir o servidor
    port: 5173,
  },
})
