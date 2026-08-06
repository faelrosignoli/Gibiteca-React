# Minha Gibiteca — React

**Migração completa (v1.0):** todas as funcionalidades da versão HTML agora vivem em componentes React.

**Última fase:** além da visualização, agora tem o **Editor** — dá pra
**cadastrar, editar e excluir** obras (avulso, box e série), com volumes,
gêneros, capa, status/urgência/lido/nota e valor. Interface em **componentes
React reais** com **Tailwind CSS** + **Framer Motion**.

## O que já funciona
- **Coleção:** Header (busca em pop-up, botões à direita), Toolbar, Cards 3D
  (sombra dura, sem brilho), Marquee, Galeria/Lista, Paginação.
- **Filtros** em gaveta (status, tipo, editora, país, autor, gênero, leitura,
  ordenação, importados/urgentes).
- **Detalhe** da obra com botão **Editar**.
- **Estatísticas** (novo): painel da coleção com investido, tenho/quero,
  % lidos, nota média, valor médio, histograma de notas e barras por
  editora, investimento, país e gênero — com escopo (coleção inteira ou
  filtro atual).
- **Editor** (novo): cadastro/edição/exclusão, com persistência automática no
  navegador (localStorage) e datalists de editora/país/autor.
- **Backup:** baixar e restaurar `.json`.
- **Capas em massa** (novo): envia várias capas de uma vez, casando cada
  arquivo com a obra pelo nome, subindo para `covers/` no repositório e
  vinculando a URL à obra.
- **Nuvem**: sincroniza a coleção com o **seu repositório do GitHub**
  (Contents API + token fine-grained). Ao conectar, puxa/cria o arquivo; a
  cada alteração, envia automaticamente (com retry em conflito). Botões de
  puxar/enviar/desconectar e indicador de status no botão Nuvem.

## Tudo migrado
Coleção, filtros, busca, detalhe, editor, estatísticas, nuvem e capas em
massa — paridade completa com a versão HTML, agora componentizado.

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

## Nuvem — como funciona
Conecte pelo botão **Nuvem** (topo): informe usuário, repositório e um **token
fine-grained** do GitHub com permissão de **Contents: Read and write** no seu
repositório. O app guarda a coleção em `data/gibiteca.json` (caminho editável)
e passa a enviar automaticamente a cada mudança. Em outro aparelho, conecte uma
vez e use **Puxar da nuvem**. O token fica salvo apenas **neste navegador**
(localStorage); se vazar, revogue na página de tokens do GitHub.
