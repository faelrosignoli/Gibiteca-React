# Minha Gibiteca — projeto React (Vite)

O app **Minha Gibiteca** rodando dentro de um projeto **Vite + React**.
Esta é a **Fase 1 da migração**: o app é idêntico à versão HTML anterior
(mesmo markup, mesmo CSS, mesma lógica), agora dentro da arquitetura React.
A partir daqui, conforme as mudanças visuais forem pedidas, cada parte
(cabeçalho, cards, editor, filtros…) vai virando um componente React de verdade.

## Rodar localmente

Precisa do Node.js 18+.

```bash
npm install     # só na primeira vez
npm run dev     # http://localhost:5173  (recarrega ao salvar)
```

## Publicar

```bash
npm run build   # gera dist/ (site estático, pronto pro GitHub Pages/Netlify/Vercel)
npm run preview # testa o dist/ localmente
```

`vite.config.js` usa `base: './'`, então funciona em qualquer subpasta.

## Estrutura

- `src/App.jsx` — monta o app dentro do React.
- `src/app.css` — o CSS do app (idêntico ao original).
- `src/data.js` — listas fixas: 128 editoras + 43 gêneros.
- `src/gibiteca/markup.html` — o HTML do app (cabeçalho, toolbar, modais…).
- `src/gibiteca/logic.js` — toda a lógica (estado, coleção, editor, filtros,
  estatísticas, nuvem/GitHub, backup). É o mesmo código da versão HTML.
- `src/assets/logo.png` — o logo.

> Nas próximas fases, o conteúdo de `markup.html` + `logic.js` vai sendo
> transformado em componentes `.jsx` conforme cada parte for redesenhada.
