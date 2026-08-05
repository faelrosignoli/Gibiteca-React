# Minha Gibiteca — React (componentizado)

**Fase 2 da migração:** a interface agora é feita de **componentes React reais**,
com **Tailwind CSS** + **Framer Motion**. Esta versão foca a **visualização da
coleção** (Header, Toolbar, Cards 3D, Marquee, Paginação, Filtros em gaveta,
detalhe da obra, Rodapé). Editor, Estatísticas e sincronização com a nuvem
chegam nas próximas fases.

> Rode localmente pra ver. Seu app publicado (a versão anterior) continua
> funcionando como está — troque só quando esta alcançar tudo.

## Rodar
```bash
npm install     # instala as dependências (inclui as novas: tailwind, framer-motion)
npm run dev     # http://localhost:5173
```

## Ver com seus dados
O app lê sua coleção do navegador (localStorage). Se abrir vazio, clique em
**Backup** (no topo) e carregue seu **gibiteca-dados.json** — a coleção aparece
nos componentes novos.

## Estrutura
- `src/lib/helpers.js` — funções puras do modelo (mesma lógica do app original).
- `src/lib/store.jsx` — estado global (coleção, filtros, ordenação, paginação).
- `src/components/` — `Header`, `Toolbar`, `Card` (tilt 3D), `Marquee`,
  `Collection`, `Pagination`, `FiltersDrawer`, `DetailSheet`, `Footer`, `Ticker`.
- `tailwind.config.js` — cores da marca (creme, verde musgo, dourado, ferrugem)
  + sombra neobrutalista.

## Publicar
`npm run build` gera `dist/`. O workflow em `.github/workflows/deploy.yml`
publica automático no GitHub Pages (Settings → Pages → Source: GitHub Actions).
