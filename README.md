# Minha Gibiteca — React (componentizado)

**Fase 3 da migração:** além da visualização, agora tem o **Editor** — dá pra
**cadastrar, editar e excluir** obras (avulso, box e série), com volumes,
gêneros, capa, status/urgência/lido/nota e valor. Interface em **componentes
React reais** com **Tailwind CSS** + **Framer Motion**.

## O que já funciona
- **Coleção:** Header (busca em pop-up, botões à direita), Toolbar, Cards 3D
  (sombra dura, sem brilho), Marquee, Galeria/Lista, Paginação.
- **Filtros** em gaveta (status, tipo, editora, país, autor, gênero, leitura,
  ordenação, importados/urgentes).
- **Detalhe** da obra com botão **Editar**.
- **Editor** (novo): cadastro/edição/exclusão, com persistência automática no
  navegador (localStorage) e datalists de editora/país/autor.
- **Backup:** baixar e restaurar `.json`.

## Próximas fases
- **Estatísticas** (painel da coleção).
- **Nuvem** (sincronização com o GitHub) e **Capas em massa**.
  (os botões já existem no topo e avisam que chegam depois.)

## Cores / estilo
Fiéis à última versão HTML: `--ink #23271C`, selos moss/gold, importado em
azul (`#2f5aa8`), box em marrom (`#8a6a45`), urgente em rust com triângulo.

## Rodar
```bash
npm install     # inclui tailwind + framer-motion
npm run dev     # http://localhost:5173
```

## Ver com seus dados
O app lê a coleção do navegador (localStorage). Se abrir vazio, clique em
**Backup → Restaurar** (no topo) e carregue seu **gibiteca-dados.json** — a
coleção aparece e passa a ser salva automaticamente a cada alteração.

## Build
```bash
npm run build   # gera /dist (site estático, base relativa — serve em qualquer pasta)
```
