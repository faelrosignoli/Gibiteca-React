# CLAUDE.md — Minha Gibiteca (React)

> Este arquivo é a **memória do projeto** para o Claude Code. Ele é lido
> automaticamente no início de cada sessão. Mantenha-o atualizado quando
> mudar convenções, o modelo de dados ou o fluxo de release.

## O que é
App pessoal para catalogar uma coleção de quadrinhos ("gibiteca"). Migrado de
um único `index.html` (vanilla JS) para **Vite + React 18 + Tailwind CSS +
Framer Motion**. SPA de uma tela só, sem backend próprio: os dados vivem no
navegador (localStorage) e, opcionalmente, sincronizam com um repositório do
GitHub via Contents API. Idioma da interface e dos commits: **português (BR)**.

## Stack e comandos
- Node **>= 22** (declarado em `package.json` → `engines`). Gerenciador: npm.
- O CI builda em **Node 24**, a mesma versão da máquina de desenvolvimento.
  Estava em 20 — abaixo do próprio mínimo do projeto — e o site publicado era
  construído num Node diferente do usado para escrevê-lo.
- As ações do workflow ficam nas majors atuais. `upload-pages-artifact` e
  `deploy-pages` **andam em par**: subir só uma costuma gerar artefato que a
  outra não entende.
- `npm install` — instala dependências (React, framer-motion, tailwind, vite).
- `npm run dev` — servidor de desenvolvimento (Vite, porta 5173).
- `npm run build` — gera `/dist` (site estático, base relativa; serve em qualquer subpasta, inclusive GitHub Pages).
- `npm run preview` — pré-visualiza o build.
- Deploy: GitHub Pages via `.github/workflows` (Actions).

## Estrutura
```
src/
  main.jsx                 # entrypoint; monta <StoreProvider><App/>
  App.jsx                  # orquestra modais (Filtros, Detalhe, Editor, Stats, Nuvem, Capas), busca, FAB, toasts
  index.css                # Tailwind + tokens CSS + classes .neo-btn/.neo-icon/.pill/.field-*
  data.js                  # SOMENTE listas de apoio: EDITORAS e GENRES (nenhuma obra embutida)
  lib/
    store.jsx              # StoreProvider (contexto global): obras, filtros, paginação, persistência, nuvem
    helpers.js             # funções puras: coverOf, unitsOf, tipoOf, edOf, edicaoDe, statusMatch, avgNota, canon, slugify, fmtBRL, moneyToNumber/Format, tintIndex/classeTinta, initials...
    cloud.js               # GitHub Contents API: ghCheckRepo, ghGet, ghPut, b64enc/dec, guessRepo
    motion.js              # tokens de movimento: molas, projeção de momento, elástico das bordas, hooks de viewport e movimento reduzido
  components/
    Header.jsx             # barra de ponta a ponta, sticky: véu desfocado no topo, cortina moss ao rolar
    (Toolbar.jsx foi absorvido pelo Header — não recriar uma segunda faixa)
    SearchOverlay.jsx      # busca em pop-up (backdrop desfocado)
    Collection.jsx         # grade (Card) + Lista (Ficha) + estado vazio; usa Pagination
    Card.jsx               # card 3D (tilt), sombra dura, selos; SEM brilho de cursor
    Marca.jsx              # a marca em SVG inline, duas tintas trocáveis (gerada de assets/logo.svg)
    Selos.jsx              # linha de selos do card com teto de 2 linhas e pílula "+N"
    Pessoas.jsx            # autor/artista como etiquetas; entrega a string com " / "
    Divisoria.jsx          # faixa ilustrada entre a paginação e o rodapé (<img>, uma arte por largura)
    Ticker.jsx, Pagination.jsx, Footer.jsx   (Marquee e Resumo foram removidos)
    FiltersDrawer.jsx      # gaveta de filtros (grid content-start para não esticar as linhas)
    DetailSheet.jsx        # painel de detalhe; botão Editar; grade de capas por volume
    Editor.jsx             # cadastro/edição/exclusão (avulso, box, série) + VolPanel + CheckTile
    Stats.jsx              # painel de estatísticas (KPIs, médias, histograma, barras) com escopo
    Cloud.jsx              # modal de conexão/sincronização com o GitHub
    BulkCovers.jsx         # envio de capas em massa (casa por nome, sobe p/ covers/)
    Welcome.jsx            # a capa: uma imagem por visita (lista CAPAS), celular/desktop por <picture>
    Backup.jsx             # pop-up de exportar/importar a coleção
    Tema.jsx               # pop-up da escolha de tema (Moss / Nockout) — mesmo molde do Backup
```

## Regras inegociáveis
1. **NUNCA embutir os dados do usuário no app.** `data.js` só tem `EDITORAS` e
   `GENRES`. A coleção entra por Backup→Restaurar (JSON) ou pela Nuvem. O app
   inicia vazio. (O arquivo `gibiteca-dados.json` é referência do modelo de
   dados, não deve ir para o bundle.)
2. **Cores fiéis ao `index.html` original.** Fonte de verdade dos tokens abaixo.
3. **Português** na UI, nos comentários e nas mensagens de commit da nuvem.
4. Ao terminar uma feature, **buildar** (`npm run build`) e rodar o
   **smoke-test em jsdom** (ver skill `jsdom-smoke-test`) antes de empacotar.

## Sistema de tokens (regra dura)
Depois da auditoria de coerência, **nenhum valor visual solto nos componentes**.
Nada de `text-[13px]`, `rounded-[12px]`, `#FFFDF8` ou `ink/[.07]`. Se falta um
valor, o lugar de criá-lo é o `tailwind.config.js`, não o JSX.

### Escala tipográfica — 7 níveis, nunca um oitavo
Cada nível traz **tamanho + entrelinha + entreletras juntos**. A entrelinha cai
conforme o tamanho sobe; a entreletras é negativa acima de 16px, zero no texto
corrido e positiva só no rótulo. **Não escrever `tracking-*` à mão** — a escala
é dona disso.

| classe | px | entrelinha | entreletras | uso |
|---|---|---|---|---|
| `text-display` | 40 | .92 | −.03em | número grande, marca |
| `text-titulo` | 28 | .98 | −.025em | título de modal |
| `text-secao` | 20 | 1.1 | −.02em | cabeçalho de seção |
| `text-obra` | 16 | 1.15 | −.015em | nome de obra |
| `text-corpo` | 14 | 1.55 | 0 | texto corrido |
| `text-apoio` | 12 | 1.45 | 0 | texto secundário |
| `text-rotulo` | 10 | 1 | +.16em | rótulo mono em caixa alta |

### Cores por papel
- Superfícies: `bg-paper` (fundo), `bg-surface` (**#FFFDF8, creme — não branco**).
  Branco puro existe como `surface-pure`, para uso pontual.
- Texto: `text-ink` → `text-ink-soft` → `text-ink-faint` → `text-ink-mute`
  → `text-ink-sussurro` (10%). O último não é texto para ler: é marca-d'água,
  e existe como token justamente para ninguém escrever `ink/10` avulso.
- Famílias: `font-display` (Bricolage) para conteúdo · `font-sans` (Inter) para
  corpo · `font-rotulo` (**Montserrat**) para rótulo em caixa alta ·
  `font-mono` (Space Mono) para o que PRECISA de largura fixa · `font-cartaz`
  (Lexend Zetta) para **títulos de painel**, sempre em CAIXA ALTA, e palavra
  grande. A Lexend entra em dois pesos: **600** nos títulos e **900** na
  marca-d'água — título em Black competiria com o conteúdo do painel.

  **A Space Mono não saiu de cena, encolheu de papel.** Ela cobria três usos:
  rótulo, número e string literal. Rótulo não precisa de monoespaçada — precisa
  de legibilidade em corpo pequeno, e foi o que migrou (31 ocorrências). Ficam
  em Space Mono os números com `tabular-nums`, que alinham em coluna, e as
  strings literais (`100 Balas.jpg`, `data/gibiteca.json`), onde a largura fixa
  sinaliza "isto é texto de máquina".

  Ela é larguíssima: medido, "Sincronizar com o GitHub" ocupa 405px num modal
  de 560 no desktop, e **quebra em duas linhas a 375px** — sem estouro, mas é
  o custo de usá-la em frase, não em palavra.

- **`#212121` existe só na capa** (`.welcome`), no botão e na sombra do logo.
  É um preto diferente do `ink` (`#23271C`) do resto do app, e fica preso
  àquele escopo de propósito — solto, viraria uma segunda tinta preta
  competindo com a do projeto. No rodapé, por exemplo, o logo segue em `ink`.
- Véus de tinta, nomeados pela função (antes eram 12 opacidades avulsas):
  `linha` (8%, fio de 1px) · `separador` (12%, divisória) ·
  `toque` (5,5%, fundo de hover) · `veu` (50%, backdrop de modal).
  Use `border-linha`, `bg-toque`, `bg-veu` — nunca `ink/10`.
- Tintas pálidas de estado: `tinta-moss`, `tinta-gold`, `tinta-rust`.
- Selos mantêm as cores semânticas: moss, blue (Importado), box, rust (Urgente), gold (nota).

### Movimento — duração vem de token
`--dur` (.22s) e `--dur-lento` (.34s) no `index.css`. **Não escrever duração
solta.** As cinco referências analisadas ficam entre 0,12s e 0,4s; o app já
esteve em 0,7s, o dobro da mais lenta delas — não voltar para lá.

### Escala ajustável por um número
Todos os tamanhos são `calc(Npx * var(--escala))`. Mudar `--escala` no
`index.css` reescala a tipografia inteira do app. Padrão: `1`.

### Primeiro nível: só o que se usa sempre
Uma barra única, com o logo no centro nos **dois** tamanhos:

```
desktop:  Busca · Filtros · LOGO · Galeria/Lista · ☰

celular:  Busca ········ LOGO ········ ☰
          Filtros ············ Galeria/Lista
```

É uma grade `[1fr auto 1fr]` — só assim o logo fica no centro exato
independente da largura dos dois lados.

**A marca entrou na barra.** Antes era um bloco solto acima, que rolava embora
(`LogoMobile`, removido); agora acompanha a rolagem como em qualquer site, e o
que desceu para a segunda linha foi o que é ferramenta, não marca.

**O arranjo é o MESMO em qualquer largura:** barra com três peças (busca ·
marca · ☰) e, abaixo dela, a segunda linha. O conteúdo dela MUDA com a
largura:

| | esquerda | direita |
|---|---|---|
| desktop | marca-d'água **COLEÇÃO** | Filtros · Galeria/Lista |
| celular | **Filtros** | Galeria/Lista |

No celular a marca sai e o Filtros toma o lugar dela. Numa tela estreita o
vazio que a marca preenchia não existe, e pôr o Filtros na ponta oposta do
alternador dá alvo grande para o polegar nos dois cantos.

**A escolha é em JS (`ehDesktop`), não duas cópias escondidas por CSS** —
uma instância só, um lugar de verdade. (Ao contrário do que esta nota dizia
antes: `display:none` REMOVE o elemento da árvore de acessibilidade, então
duplicar por CSS não causaria leitura dobrada. O motivo aqui é manter um nó
só. O seletor de escopo do painel de estatísticas usa o caminho do CSS, e
está correto.)

**O alternador fica sempre no mesmo embrulho**, em qualquer largura — ele
carrega `layoutId`, e trocá-lo de pai ao cruzar o corte remontaria a pastilha
no meio da animação. Houve uma versão em que no
desktop esses dois moravam dentro da barra; unificar deixou a marca centrada de
verdade sempre, e encolheu a barra de 69 para 57px.

A segunda linha fica **fora** da barra fixa: ela rola embora com a página. Só a
marca, a busca e o ☰ acompanham a rolagem — o que é ferramenta da estante fica
com a estante. Medido a 1280px, rolando 600px: a barra para em `top: 0` e o
Filtros vai para `-535`.

**O alternador Galeria/Lista existe uma vez só no DOM.** Ele carrega um
`layoutId`, e dois elementos com o mesmo id ao mesmo tempo quebram a animação
da pastilha. Hoje há uma instância só, na segunda linha — mas a regra continua
valendo para quem for duplicá-lo por CSS para "mostrar em dois lugares".

### O ☰: um painel no celular, uma folha no desktop
Três assuntos, nesta ordem: **tema**, **estatísticas** e **um tópico só** para
tudo que é dado — nuvem, atividades, capas em massa e os dois backups. Eram
cinco itens soltos competindo com o resto; agora são cinco coisas da mesma
família atrás de uma porta que abre em sanfona.

**Os três são PORTAS: cada linha abre uma tela.** O tema era a exceção — a
escolha de cor morava aqui dentro, feita ali mesmo, com um fio mais forte
(`separador`, não `linha`) em volta para avisar que aquilo não era item de
lista, era ajuste. Virou pop-up e entrou na fila; o fio de exceção saiu junto,
e com ele a única regra do menu que precisava de explicação.

O menu é o **mesmo nos dois tamanhos**. Estatísticas chegou a viver na barra do
desktop; manter os dois caminhos daria duas portas para a mesma tela, então ela
mora só no ☰.

Com o menu aberto a segunda linha **não precisa sumir à mão**: o painel é fixo e
começa embaixo da barra, então a cobre sozinho. Escondê-la daria um pulo na
página ao abrir o menu, porque ela está no fluxo normal.

**No painel, as linhas são grandes (`text-titulo`, 28px) e sem ícone.** São três
assuntos, não uma lista de comandos, e a essa altura o ícone vira enfeite ao
lado de uma palavra que já se lê de longe. Na folha do desktop, que é compacta,
o ícone continua ajudando a varrer — o mesmo componente serve os dois pela
prop `grande`.

Com o ícone da nuvem fora, o **ponto de sincronização** ganhou lugar próprio ao
lado do rótulo: a ação pode se esconder atrás de uma porta, o alerta não pode.

No celular o menu é um painel de tela cheia que começa embaixo da barra, com a
altura dela medida em `useLayoutEffect`. Ele mora **fora do `<header>`**, e
isso não é arbitrário: como filho, ele pegava a regra
`.barra-topo > * { position: relative }` — a que mantém o conteúdo acima da
cortina do acento — e com isso perdia o `fixed`, caía no fluxo e passava a
entrar na altura da própria barra, que é justamente a referência que ele usa
para se posicionar. Um ciclo que só aparece medindo.

### A barra do topo: véu no alto, cortina do acento quando se enche
Não é mais uma pílula flutuante — é uma **barra de ponta a ponta** (`.barra-topo`,
no `index.css`), com dois estados ligados pelo `data-acento`:

| | Fundo | Tinta |
|---|---|---|
| Vazia | papel a 62% + `backdrop-filter: blur(16px) saturate(1.4)` | ink (escura) |
| Cheia | painel do **acento** | `--sobre-acento` |

**Ela se enche quando a página rola — e, SÓ NO CELULAR, também com o menu
aberto:** `rolado || (menu && !ehDesktop)`. É o que `comAcento` resolve no
`Header`, e tudo que muda de cor junto com a cortina olha para ele — nunca
para `rolado` direto, senão o fundo vira acento e os botões ficam na tinta
escura.

O atributo chamava-se `data-rolado` e foi renomeado quando o menu virou um
segundo motivo: ele diz o **estado**, não a causa.

**Por que o menu só conta no celular.** O motivo nunca foi "menu aberto", foi o
painel não ter onde terminar: no celular ele é de tela cheia e encosta na
barra, e sobre uma barra quase branca os dois viravam uma mancha só. No desktop
o menu é uma folha flutuante de 290px que sobrepõe a barra em 5px e no resto
cai sobre o conteúdo — ela se delimita pela própria sombra, não pela cor da
barra. Ali tingir a barra era efeito colateral: a página inteira mudava de cor
por causa de um menu de três itens.

**A cortina não é fade de opacidade — é `clip-path`.** Um painel moss já opaco
mora no `::before` e fica escondido num polígono de área zero colado na borda
de baixo (`polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)`); ao rolar ele abre
para o retângulo cheio, e quem viaja é a **aresta de cima**. O acento sobe.

Por que não opacidade: com ela você veria a página **através** do acento durante
toda a transição. O recorte dá aresta dura — o moss nasce cheio, só está
escondido. E `clip-path` não causa reflow, ao contrário de animar `height`.

`--dur-cortina` é **0.9s**, o dobro do teto do resto do app, com
`cubic-bezier(.22, 1, .36, 1)` (easeOutQuint). É exceção consciente: aqui o
movimento é encenação, não resposta a toque. **O token não deve ser reusado em
botão nenhum.**

A inversão da tinta roda em **0.45s, não em 0.9s**: a cortina leva quase meio
segundo para cobrir o meio da barra, e um texto cinza-médio parado ali por 0.9s
não se lê em fundo nenhum.

O `::before` é posicionado, então `.barra-topo > *` precisa de
`position: relative; z-index: 1` — sem isso o painel pinta **por cima** dos
botões.

A marca NÃO acompanha a inversão — ver **A marca é SVG, em duas tintas**,
abaixo.

O limite de rolagem é **24px**, não 1px: com 0.9s de animação, disparar no
primeiro pixel faria um tremidinho de dedo abrir e fechar o acento inteiro.

**Nuvem, Enviar capas e as duas ações de backup vivem dentro do ☰** — são
operações raras e não devem disputar atenção com a coleção. Ação nova e rara
vai para dentro do menu, não ao lado dele.

O **ponto de status da sincronização ficou no próprio ☰**: a ação pode se
esconder, o aviso não pode. E o item da nuvem no menu diz o estado
("Nuvem — em dia", "Nuvem — erro ao sincronizar"), não só a categoria.

O ☰ vira X animando **só transform e opacity** (animar `top` custaria layout a
cada quadro). Fecha no Esc, no clique fora e ao escolher um item.

### Volumes seguem o filtro de status
`statusMatch` deixa a obra passar se **qualquer** unidade bater — então uma
série 1-de-2 aparece tanto em "Tenho" quanto em "Quero". Sob um filtro, o
cartão mostra **um volume** dessa série: o da _vitrine_.

`unidadeVitrine(obra, status)` escolhe esse volume — o primeiro que combina
com o filtro e tem capa (senão o primeiro que combina). **Capa, selo de status
e selo de urgência saem todos dele**; se cada um escolhesse sozinho, o cartão
mostraria a capa de um volume com os selos de outro.

**O título nunca muda**: é sempre o nome da série. É por ela que a obra é
reconhecida na estante — trocar por "Volume Dois" apaga a identidade do
cartão. Quem diz qual volume está na capa é a linha de apoio.

Sob "Tenho" / "Quero", no cartão da grade e na ficha da lista:

- **título** → sempre `obra.nome`, o da série
- **capa** → `coverOf(obra, status)`, a do volume da vitrine
- **linha de apoio** → o nome do volume da vitrine, no lugar de "N volumes"
- **selo de status** → o status do próprio volume, não o da série (nada de
  "Tenho 1/2" num cartão que está mostrando o volume que falta)
- **selo de urgência** → `urgenteNaVitrine(obra, status)`. Em "Tenho" ele
  **nunca aparece**: volume que já está na estante não é urgente, e o cartão
  está falando justamente dele.
- **barra de progresso** → **não existe mais no cartão da grade**, em filtro
  nenhum. Ela ocupava duas peças (o fio de 2px e o "faltam N de N") para dizer
  o que o selo **"Tenho 1/3"** logo abaixo já dizia em uma linha. Quem quer o
  progresso lê o selo; quem quer saber QUAIS volumes faltam abre a ficha, e
  nenhuma barra respondia isso. Na vista em LISTA ela continua — lá há largura
  para ela e o texto é por extenso ("falta o vol. 3").

Na gaveta de detalhe a lista de volumes segue o mesmo recorte:

- **Tenho** → só os volumes com `status === 'biblioteca'`
- **Quero** → só os volumes com `status !== 'biblioteca'` (inclusive os sem
  status, para nada sumir)
- **Todos** → todos

O cabeçalho mantém a contagem real ("2 de 5") e acrescenta o aviso do recorte,
senão o número não bate com o que está na tela.

### Campos que aceitam "/" — autores e países
`splitLista()` é a regra única: `"Argentina / Espanha"` são dois países,
`"Manu Larcenet / Outro Autor"` são dois autores. Vale para **roteirista,
desenhista e país**, na obra e em cada volume.

Quem usa: os selects de Filtros, os `datalist` do Editor, o filtro
(`passes`), a ordenação (`sortKey`), o "Por país" das Estatísticas e a ficha
técnica da gaveta. Campo novo que aceite vários valores usa `splitLista` —
não `.split('/')` solto.

Os rótulos dizem o que cabe: **"Autor / Roteirista"** e **"Desenhista /
Colorista / Finalista"**, ambos com o *placeholder* "Use / p/ separar".

### Guia dos Quadrinhos — atalho, nunca raspagem
Dois lugares abrem o Guia dos Quadrinhos em aba nova, com o título já na busca:
**no Editor**, ao lado do campo de título (acompanha o que está sendo digitado),
e **na gaveta de detalhe**, abaixo da ficha técnica. `linkDoGuia()` em
`lib/catalogo.js` é a única peça — não há busca automática, e o app **não faz
nenhuma chamada de rede** por causa disso.

**Por que só um link, e não uma integração.** O Guia é o melhor acervo de HQ
brasileira e o único lugar onde a editora da edição nacional está certa, mas
não dá para consultar por código — verificado com `curl`:

- responde **403** com `Cf-Mitigated: challenge` (desafio anti-bot da Cloudflare)
- manda `Cross-Origin-Resource-Policy: same-origin` e **não** manda
  `Access-Control-Allow-Origin` — CORS fechado de propósito
- `robots.txt`: `search=yes, ai-train=no, use=reference` — e, explicitamente,
  `User-agent: ClaudeBot` → `Disallow: /`

Passar pelo desafio da Cloudflare seria burlar detecção de bot, e o robots.txt
veta o acesso automatizado por nome. **Não fazer, nem para "só descobrir o
formato da URL".** A regra vale para robô; a pessoa navegando no site e o link
que o navegador dela abre não têm nada a ver com isso.

O endereço é a **busca do próprio site**, e o formato veio de dois exemplos
reais que o usuário tirou da barra de pesquisa:

| digitado | endereço |
|---|---|
| `conan` | `/titulos/conan` |
| `conan cimério` | `/titulos/conan%20cim%C3%A9rio` |

`/titulos/` recebe o termo **cru, só percent-encoded** — espaço vira `%20` e o
acento é preservado em UTF-8. Por isso `encodeURIComponent` e **não**
`slugify`: virar "conan-cimerio" mandaria um termo que a pessoa não digitou.
Sendo busca e não ficha fixa, título parcial funciona e não há 404 por apelido
divergente. O termo vai como foi escrito, inclusive caixa e pontuação.

**Houve aqui uma busca automática no Open Library.** Saiu a pedido: trazia
título e autores, mas errava a editora — agrega todas as edições de uma obra e
devolve a original ("Dark Horse" para Funny Creek). Um catálogo que acerta
metade e erra a metade que importa custa mais conferência do que digitação.
Não reintroduzir sem pedido.

### O selo de série/box não fica sobre a capa
Ele morava no canto inferior esquerdo **da capa** e tapava a arte — numa capa
que preenche o quadrado não existe canto vazio para ele ocupar. Desceu para o
corpo do cartão.

Ele já dizia a contagem ("Série 4"), a mesma coisa que a linha "4 volumes"
logo abaixo; lado a lado a repetição ficou óbvia, então o selo ficou com o
recado e a linha saiu. Sob filtro, o nome do volume da vitrine aparece ao lado
do selo.

O **selo de urgência continua sobre a capa**, no canto superior direito: é
aviso, precisa ser visto antes do texto — e é pequeno o bastante para não
tapar a arte.

### Gêneros saíram da interface (o dado, não)
Não existe mais campo de gêneros no cadastro, filtro de Gênero, gráfico "Por
gênero", pílulas no detalhe nem contagem no rodapé. `GENRES`, `tagsOf` e o
`GenrePicker` foram removidos, e o gênero saiu também da busca — procurar por
um campo que não aparece em lugar nenhum devolveria resultado sem explicação.

**O que está gravado continua gravado.** As obras antigas mantêm o array
`tags`, e o Editor o atravessa intacto (`genres` segue no rascunho só para
isso): editar uma obra antiga **não** apaga os gêneros dela. Tirar um campo da
tela não é motivo para destruir dado do usuário — se um dia os gêneros
voltarem, estão lá.

### Listas suspensas: Combo e Selecao, nada nativo
`<datalist>` e `<select>` estão os dois proibidos. Nenhum aceita os tokens do
app — a folha aberta quem desenha é o sistema operacional —, então a gaveta de
Filtros e o Editor ficavam com um pedaço de outra interface no meio deles.

Dois componentes, para os dois casos:

| | quando | onde |
|---|---|---|
| `Combo` | **texto livre** com sugestões | Editor: Editora, País, Autor, Desenhista |
| `Selecao` | **lista fechada**, escolha única | Filtros (7 campos) e o "Por página" da paginação |

O que os dois dividem mora em `lib/lista-suspensa.js`: `useLugarDaLista`
(de que lado abre e com que altura), `useFechaAoClicarFora`,
`useSeguirDestaque` e as classes da folha. Duas cópias da mesma medição
acabariam desencontrando.

**Lado e altura saem do container que rola**, não da janela. O corpo do Editor
e o da gaveta de Filtros são baixos: medindo contra `window` a lista abria
para baixo e ficava cortada. Abre para o lado mais folgado e ocupa só o que
cabe (120–232px).

No `Selecao`, lista com **8 opções ou mais ganha campo de busca** — achar uma
editora entre trinta no `<select>` nativo era rolar no olho. A escolha atual
leva um tique moss, e o gatilho mostra o rótulo dela.

**Teclado nos dois:** ↑ ↓ andam, Enter escolhe, Esc fecha **só a folha** (com
`stopPropagation`, senão fecharia a gaveta junto), Tab fecha. O `Selecao`
ainda aceita Home/End. Clique fora fecha a folha, nunca o modal.

**Custo assumido:** no celular some o seletor nativo do sistema. Em troca vêm
os tokens do app, o campo de busca e a folha que não vaza do modal.

### Diário: o commit conta o que mudou
Cada envio para a nuvem sempre foi um commit — mas todos se chamavam
"Atualiza coleção", o que torna o histórico inútil justamente quando ele
seria preciso ("o que eu mudei?", "perdi alguma coisa?").

`lib/diario.js` compara a coleção que está na nuvem com a que vai subir e
transforma a diferença em frase. Como o envio **já busca** o arquivo de lá
para conferir o carimbo, a comparação não custa nenhuma requisição a mais.

| mudança | frase |
|---|---|
| obra nova | `Adicionou “Conan, o Cimério”` |
| obra apagada | `Removeu “Blast”` |
| nome trocado | `Renomeou “Sandman” para “Sandman — Edição Definitiva”` |
| volume marcado | `Marcou como Tenho: 1 volume de “Sandman” (2 de 3)` |
| capa | `Pôs capa em “A”` |
| resto | `Editou “A”` |

**Uma mudança vira o assunto do commit; várias viram "N alterações" com a
lista embaixo** — é o formato que o git espera, e o que deixa o histórico
legível direto no GitHub, sem app nenhum.

### O diário nomeia cada tipo de alteração
`mudancasInternas` devolve uma LISTA, não a primeira mudança que encontra:
marcar como lido e dar nota na mesma edição são duas coisas, e o histórico diz
as duas. Frases próprias para leitura, urgência, nota (`Deu 3,5 estrelas`),
valor pago, editora, país, origem, autoria, anotação e capa. O genérico
`Editou “X”` só sobra para o que nenhuma regra soube nomear.

Duas decisões: **roteirista e desenhista viram uma frase só** ("a autoria"),
porque é assim que se lê; e **o texto da anotação não vai para o histórico**,
só o fato de ter mudado — o commit é público.

### Leva grande: o título resume, o detalhe fica fechado
Subir 110 capas gerava "110 alterações na coleção" e despejava 110 fichas na
tela — a linha do tempo deixava de servir para olhar de relance, que é para
o que ela existe.

Duas correções:

1. **`resumoDe`**: quando a leva inteira é do mesmo tipo, o título diz o que
   foi feito — `Subiu 110 capas para a nuvem`. Tipos misturados voltam para
   `N alterações na coleção`, e uma mudança só continua sendo o próprio texto.
2. **A entrada abre sob demanda** (`Entrada` em `Atividades.jsx`): fechada por
   padrão, com `N itens` no rótulo. Entrada sem detalhe não vira botão — não
   há o que abrir.

**As capas são comparadas volume a volume**, não por `coverOf`: numa série ele
só olha o volume 1, então mover a capa dos outros caía no genérico "Editou" —
foi o que encheu o histórico de 110 linhas iguais. E `data:` → endereço é tipo
próprio (`capa-nuvem`): é arrumação, não capa nova.

### Barras das estatísticas empilham sempre
O rótulo tinha 120px fixos e o número 86px. Sobravam ~100px de barra no
celular e **78px no desktop** — pior lá, porque a partir de `sm:` os gráficos
ficam em duas colunas e a coluna nunca passa de ~316px. Empilhado (rótulo em
cima, barra e número embaixo) a barra fica com ~70% em qualquer tela, e nome
de editora longo para de ser cortado.

### Alvo de toque do Galeria/Lista
No celular o rótulo some e sobra só o ícone; sem `min-w-[44px] min-h-[40px]`
o botão encolhia para 39x27, abaixo do alvo confortável — e errar ali troca o
modo de exibição sem querer.

### Atividades: linha do tempo lida do repositório
`components/Atividades.jsx`, no menu ☰. **Não guarda histórico nenhum**: lê os
commits com `ghCommits` e desenha. A fonte da verdade continua sendo o GitHub.

O desenho vem do painel de Atividades do Drive, e as razões valem repetir:

- **o evento é a ação, não o item**: um envio com 5 mudanças é uma entrada só,
  com as 5 aninhadas embaixo. Por obra, um dia de arrumação enterraria o resto;
- as mudanças aparecem como fichas indentadas, ligadas por um fio — a relação
  é mostrada pelo espaço, em vez de repetir a data em cada linha;
- agrupado por período (Hoje · Ontem · Nos últimos 7 dias · Este ano · ano);
- **é leitura, não controle**: sem desfazer, sem botão por item. É isso que
  permite ser denso sem assustar.

`lerMensagem` aceita as mensagens antigas ("Atualiza coleção — …"): elas viram
uma entrada sem detalhe, em vez de sumirem do histórico.

### Capas moram no repositório, não dentro da coleção
**Medido na coleção real:** 3,78 MB dos 3,94 MB eram **80 imagens em base64**
(49 obras + 31 volumes). Todo o resto — 554 obras, 238 volumes, nomes,
editoras, autores, preços, notas — somava **115 KB**. Ou seja, 98% do peso
vinha de 9% das obras.

`lib/capas.js` move as embutidas para `covers/` e troca por endereço
`raw.githubusercontent.com` — o mesmo esquema que o "Enviar capas" já usava.
O botão aparece no modal da Nuvem **só quando há o que mover**, com o peso em
MB, e some depois.

Regras: capa que falha ao subir **continua embutida** (melhor pesada do que
sumida); o caminho leva o id da obra e o número do volume, senão dois volumes
da mesma série disputam o mesmo arquivo.

**Isto exige repositório público** para as imagens abrirem via URL direta.
O do usuário é público — o que também significa que a coleção inteira é.

### Salvaguarda: erro de render não apaga a tela
`components/Salvaguarda.jsx`, por **fora** do `StoreProvider` em `main.jsx`:
se o erro vier do próprio store, a tela de resgate ainda precisa desenhar.
Mostra o erro e oferece **baixar backup lendo o localStorage direto** — sem
passar pelo store, que pode ser justamente o que quebrou.

### Lista grande entra sem animação
Cada cartão anima opacity + y + **blur**. Em 40 dá para pagar; com "Todas" e
554 obras são 554 blurs na mesma tela. Acima de **60 itens** a entrada é
estática (`animarEntrada`). `loading="lazy"` não ajudava: capa em `data:` já
está na memória, não há download a adiar.

### Galeria é operável pelo teclado
O cartão era `<div onClick>` — a galeria inteira ficava fora do alcance do
teclado, enquanto o modo lista (que usa `<button>`) funcionava. Virou
`motion.button`. **Ação não pode ser acessível de um jeito e inacessível de
outro no mesmo app.**

### Falha guardada é falha dita
`loadInitial` distingue "não havia nada" de "havia e não abriu": o segundo
caso vira `dadoIlegivel` e um aviso. Antes virava estante vazia sem uma
palavra — o susto de achar que 554 obras sumiram. O carimbo fica em zero,
então esse vazio nunca sobe por cima do que está na nuvem. `writeCloud`
também deixou de falhar calado.

### O localStorage não cabe uma coleção com capas
**Medido:** a coleção real tem 4,03 MB de texto. O `localStorage` conta em
UTF-16, então ela pede **8,07 MB** de cota — contra um limite típico de **5 MB**.
O `setItem` estoura, e havia um `catch (e) { /* */ }` engolindo a falha.

O efeito era o pior possível: a obra aparecia na tela, a pessoa achava que
tinha salvado, e ao recarregar tinha sumido. Nada avisava.

Agora:

- a falha vira um **aviso** (`AvisoSemEspaco`), com botões para a nuvem e para
  o backup. Ele **pode ser fechado** — aviso grudado na tela vira paisagem e
  deixa de avisar —, mas fechar vale só para a falha de agora: o store conta
  as falhas (`falhasAoGuardar`) em vez de guardar um sim/não, então **uma
  falha nova traz o aviso de volta**. Respira 24px do topo no desktop (16 no
  celular): colado na borda ele parecia parte do cabeçalho. **No celular
  empilha** — texto em cima, botões embaixo na largura toda, e o × sai do
  fluxo (absolute) no canto: em linha, o grupo de botões não encolhia e
  espremia o texto numa coluna de uma palavra por linha. Os dois avisos usam
  a mesma `Faixa`, porque a cópia quebrou no celular sem ninguém notar;
- quando a gravação local falha, o envio para a nuvem **deixa de esperar os
  1,5s** e sai na hora — a nuvem passa a ser a única cópia que sobrevive a
  fechar a aba.

**Isto é remendo, não cura.** A cura é parar de guardar a imagem da capa
dentro da coleção: com o endereço em vez do base64, o JSON cai para poucos KB
e o problema some — junto com os 4 MB que sobem a cada sincronização. O app já
tem 'Enviar capas', que põe as imagens como arquivos no repositório. Mexer
nisso muda o modelo de dados do usuário, então não fazer sem pedido.

### Nuvem: quem decide é o carimbo de tempo
A sincronização tinha dois furos que, juntos, faziam parecer que a nuvem não
salvava:

1. **o app nunca falava com a nuvem ao abrir** — só quando alguém apertava um
   botão ou editava algo. Cada aparelho mostrava o próprio `localStorage` para
   sempre, e o celular exibia uma cópia velha achando que estava certo;
2. **`updated` era escrito no arquivo da nuvem e nunca lido.** Sem comparar
   nada, qualquer envio gravava por cima — o aparelho atrasado atropelava o
   adiantado, em silêncio.

**`carimboDe(dados)`** é a régua: lê `atualizadoEm` (número) e aceita o antigo
`updated`/`exported` em texto ISO, para os arquivos que já existem
continuarem valendo. O carimbo é gravado junto dos dados, local e na nuvem.

- **Toda alteração local avança o carimbo** (`marcarAlterado()`). O que vem da
  nuvem **herda o carimbo de lá** — a cópia passa a ser aquela.
- **Ao abrir**, com a nuvem conectada: nuvem mais nova → puxa; local mais novo
  → envia; iguais → nada.
- **Antes de gravar**, o envio lê a nuvem. Se o que está lá for mais novo,
  **não grava** e o estado vira `conflito` ("Nuvem — há algo mais novo lá",
  ponto rust piscando). Conflito silencioso é o que causou o problema; ele
  precisa aparecer.

Restaurar um backup conta como alteração local: ganha a hora de agora e sobe.

**Carimbo zero quer dizer DESCONHECIDO, não "muito antigo".** É o caso de quem
já usava o app antes desta mudança: os dados estão salvos sem carimbo. Tratar
isso como antigo faz a nuvem ganhar sempre — e apaga o que está no aparelho.
Sem saber quem é mais novo, o app **só puxa se aqui não houver nada a perder**;
havendo, para em `conflito` e deixa a escolha para a pessoa.

**"Enviar agora" força.** É a saída do impasse: decisão explícita, grava por
cima. O envio automático **nunca** força.

**`sha` só existe para arquivo que já está lá.** Se a nuvem não tem o arquivo,
o envio vai **sem sha** — mandar um guardado de antes faz o GitHub recusar. E
se o arquivo não existe mas há coleção aqui, o app **cria** em vez de dizer
"tudo certo" e não sincronizar nunca.

**Coleção acima de 1 MB precisa da API de blobs.** A Contents API do GitHub
devolve `content` **vazio** para arquivos maiores que ~1 MB — e uma coleção com
capas em base64 passa disso fácil (a real tem 4 MB). O sintoma era
*"Unexpected end of JSON input"*: o app recebia string vazia e tentava dar
`JSON.parse` nela, sem nada indicando que era tamanho. `ghGet` agora percebe o
corpo vazio e busca o conteúdo em `git/blobs/{sha}`, que atende até 100 MB.
Toda leitura passa por `lerColecao(f)`, que reclama com o tamanho em vez de
estourar um erro de JSON.

**Erro tem nome.** `syncErro` guarda o que o GitHub respondeu e o modal mostra
embaixo do estado. `ghPut` traduz os códigos: 401 token inválido, 403 falta
`Contents: Read and write`, 404 repositório/caminho ou token sem acesso, 409/422
versão fora de sincronia. "Erro de sincronização" sozinho não diz onde mexer.

Limite conhecido: a comparação é por relógio de aparelho. Para uso pessoal
resolve; não é um CRDT.

### Filtros em cascata
As opções de cada campo saem das obras que passam por **todos os outros**
filtros — nunca por ele mesmo. Com "Tenho" ligado, a lista de editoras mostra
só as editoras de obras que você tem; com "Quero", só as das que faltam. Vale
para Tipo, Tipo de edição, Editora, País e Autor.

**Por que o campo não entra na própria conta.** Se entrasse, escolher "Panini"
deixaria a lista de editoras só com "Panini", e não daria para trocar de ideia
sem limpar tudo. É o `sobraSem(campo)` no `FiltersDrawer`.

**O escolhido nunca some da própria lista** (`comOEscolhido`). Duas escolhas
que se excluem — editora que só existe em "Quero" mais o status "Tenho" —
fariam o valor sumir das opções enquanto continua filtrando: o campo mostraria
"Todas" e a estante viria vazia, sem explicação. Ele fica lá, para poder ser
desfeito.

A lista de editoras vem das **obras**, não do catálogo fixo do `data.js`:
filtrar por uma editora de que não se tem nada só serviria para esvaziar a
estante. O Editor continua oferecendo o catálogo inteiro — lá o objetivo é
outro, é cadastrar.

Os segmentos (Tenho/Quero, Leitura) e as caixas (Importados, Urgentes) **não**
entram na cascata: são a navegação principal, e escondê-los prenderia a pessoa
num filtro sem saída.

### Abertura: a marca viaja até o cabeçalho
`components/Abertura.jsx`. O logo entra grande no meio da tela e, ao sair, vai
até o cabeçalho encolhendo — é a **mesma marca mudando de lugar**, não uma que
some e outra que aparece. Quem faz isso é `layoutId="marca"`.

Duas regras que o resto do código precisa respeitar, ou a animação quebra:

1. **o cabeçalho não desenha o logo enquanto a abertura está no ar**
   (`aberturaNoAr`), porque dois elementos com o mesmo `layoutId` ao mesmo
   tempo brigam;
2. **só um dos dois logos do cabeçalho recebe o `layoutId`** — o visível,
   decidido por `useEhDesktop()`. Os dois ficam montados, só que um está
   escondido por CSS.

A imagem da abertura **não tem animação de saída**: se tivesse, o
`AnimatePresence` a seguraria montada e cairíamos no problema 1. Só o fundo
faz fade — e leva `pointer-events-none`, para que um fade que não termine
deixe a tela feia, não travada.

A abertura dura **550ms**: uma batida para reconhecer a marca, não uma espera.
Quem tem **movimento reduzido não vê abertura nenhuma** — entra direto.

### O logo é o botão de recomeçar
Clicar no logo — nos dois, o do topo do celular e o da pílula no desktop —
chama `resetFilters()`, devolve o **modo galeria** e sobe a página. Limpa
**tudo**, inclusive a busca, e volta para a página 1: recomeçar é voltar à
estante como ela é por padrão, e isso inclui sair do modo lista.

Não é enfeite: com filtro apertado a estante fica vazia e o caminho de volta
ficava escondido dentro da gaveta de Filtros. O logo é o lugar onde todo mundo
já clica para voltar ao começo.

O comportamento mora em `useVoltarAoInicio()`, no `Header.jsx` — um hook só
para os dois logos, para não desencontrarem.

### Estrelas: componente Estrelas.jsx, meia estrela é metade
Eram três cópias quase iguais (Card, Ficha, Editor) e as três resolviam a meia
estrela com **opacidade** — a estrela inteira ficava mais fraca, o que lê como
"estrela apagada", não como metade.

`components/Estrelas.jsx` é a implementação única: a estrela dourada é
desenhada por cima da vazia e cortada ao meio com `clip-path: inset(0 50% 0 0)`.
É **SVG e não o caractere ★** de propósito: a entreletras da escala
tipográfica entra na largura do glifo e o corte de 50% cairia fora do meio.

- `<Estrelas n={nota} />` — leitura, 16px (`w-4 h-4`)
- `<EstrelasInput value onChange />` — Editor, 24px; clicar na mesma estrela
  alterna inteira ↔ metade
- Vazia é `text-ink-mute`, cheia é `text-gold`

### Sugestão de campo: componente Combo, nunca <datalist>
`<datalist>` está proibido. Ele não obedece a token nenhum — fonte do sistema,
largura própria, e dentro do Editor a lista escapava do modal.

`components/Combo.jsx` faz o lugar dele. Continua sendo **texto livre**: a
lista sugere, não obriga; editora, país e autor novos entram digitando.

- **Respeita o "/"** (`multi`): a sugestão entra só no trecho que está sendo
  digitado. Com "Argentina / " no campo, escolher Espanha dá
  "Argentina / Espanha" — o datalist trocava o campo inteiro, o que o tornava
  inútil justamente nos campos de vários valores. Quem já foi escolhido sai
  da lista.
- **Filtra por `gNorm`**, então "fran" acha "França". O destaque do trecho
  usa o texto cru: `gNorm` decompõe (NFD) e embaralharia os índices.
- **Escolhe o lado e a altura pelo container que rola**, não pela janela. O
  corpo do Editor é baixo; medir contra `window` fazia a lista abrir para
  baixo e ficar cortada. Abre para o lado mais folgado e ocupa só o que cabe
  (entre 120 e 232px).
- **Teclado:** ↑ ↓ andam, Enter escolhe, Esc fecha **só a lista** (com
  `stopPropagation`), Tab fecha. O clique fora fecha a lista, não o Editor.
- `onMouseDown` com `preventDefault` nas opções — sem isso o input perde o
  foco antes do clique registrar.

Usam Combo: Editora, País, Autor/Roteirista e Desenhista — na obra avulsa e
em cada volume. Os `<select>` dos Filtros continuam nativos: são escolha
única de lista fechada, onde o nativo se comporta bem (inclusive no celular).

### O Editor não fecha por clique fora
Gavetas e painéis de leitura (Filtros, Detalhe, Estatísticas) fecham no clique
fora. O **Editor não**: ele tem formulário preenchido, e perder um cadastro por
um clique no vazio custa caro. Saída só pelo **X**, **Cancelar** ou **Salvar**.
Modal novo que tenha campo preenchível segue a mesma regra.

### A página de boas-vindas
`Welcome.jsx` é a capa da gibiteca: uma imagem grande ocupando tudo abaixo da
barra e um botão "Minha Gibiteca" no rodapé dela, centrado. Clicar entra na
coleção.

**A capa muda a cada abertura.** A lista de arquivos é a constante `CAPAS` no
topo do `Welcome.jsx`; para acrescentar uma, ponha o arquivo em `public/` e
escreva o nome na lista. Qualquer nome, qualquer formato que o navegador abra
— a lista guarda NOMES, não um padrão de numeração, para não obrigar ninguém
a renomear arte.

Lista no código, e não um manifesto JSON em `public/` que desse para editar
direto no GitHub sem recompilar: o manifesto seria uma requisição a mais
*antes* de o navegador saber qual imagem buscar, e essa imagem é a coisa mais
pesada e mais importante da tela. A lista vem no bundle, então o download da
capa começa no primeiro render.

**Só UMA é baixada por visita**, nunca a soma — as outras o navegador nem sabe
que existem.

**Cada capa tem DUAS versões: celular e desktop.** Só a de desktop se escreve
na lista; a de celular é o mesmo nome com **`-m` antes da extensão**, igual ao
par `divisoria` / `divisoria-m` do rodapé:

```
moore.alan.jpg     ->  moore.alan-m.jpg
hurlant.metal.jpg  ->  hurlant.metal-m.jpg
```

Convenção, e não um par escrito à mão (`{d: ..., m: ...}`): toda capa TEM as
duas versões, e um campo que nunca varia é um campo que só serve para ser
esquecido. O `-m` entra por `lastIndexOf('.')`, não por `split('.')` — os
nomes têm ponto no meio, e quebrar no primeiro daria `moore-m.alan.jpg`.

**A escolha é `<picture>` com `<source media>`, não CSS escondendo uma das
duas.** Escondendo por CSS o navegador baixaria as DUAS, e aqui cada uma é uma
foto inteira. O corte é 640px, o mesmo do `sm:` do Tailwind, do
`useEhDesktop()` e da divisória. Medido no build: **um arquivo por visita** —
a 1280 só a de desktop, a 375 só a `-m`.

**No servidor de desenvolvimento aparecem DOIS downloads a 375px.** É artefato
do StrictMode remontando o componente, não defeito: no build de produção é um
só. Vale lembrar na próxima vez que alguém for medir isso — a medição que
importa é contra `vite preview`, não contra `vite dev`.

**A `key` do `<picture>` carrega o nome da capa E o degrau de queda.** O
navegador decide a fonte uma vez, quando o elemento nasce; trocar só os filhos
não o faz decidir de novo.

**Falha cai em dois degraus**, porque há duas perdas de tamanhos diferentes:

| o que faltou | o que acontece |
|---|---|
| só a versão `-m` | fica a de desktop: mais pesada num telefone, mas é a capa certa |
| a capa inteira | tenta outra capa |
| todas as capas | papel com o logo e o botão |

Quem diz qual arquivo falhou é o `currentSrc`, que traz o endereço que o
`<picture>` escolheu de verdade — no celular ele não é o `src`. O primeiro
degrau existe para o estado normal de hoje: **as versões `-m` ainda não
existem**, e sem ele a capa sumiria no celular em vez de aparecer em desktop.

O conjunto de capas sem celular mora em ESTADO (muda o que se desenha: o
`<source>` some); o de capas mortas mora num ref (não desenha nada, e em
estado só custaria um render a mais).

Medido no build de produção, a 375px: com `-m` presente baixa só o `-m`; com
`-m` ausente tenta o `-m`, falha e mostra a de desktop, visível. O servidor do
`vite preview` devolve `index.html` com status 200 para arquivo que não
existe, e o `onError` dispara do mesmo jeito — não é imagem. No GitHub Pages
seria um 404 de verdade, com o mesmo resultado.

**O sorteio foge da capa da visita anterior** (`gibiteca_capa` no
localStorage). Sorteio puro repete: com 3 capas, uma abertura em cada 3 cairia
na mesma de antes, e "cada vez uma imagem diferente" quebraria já na segunda.
É memória de navegador, por aparelho; perdê-la não quebra nada, volta a ser
sorteio puro por uma visita.

A mesma regra vale no caminho de erro, e isso custou um defeito para
descobrir: enquanto só o sorteio da abertura a obedecia, uma capa inexistente
na lista fazia a substituta ser sorteada do zero, caindo na capa anterior com
frequência de 1 em N. Apareceu num teste de 14 aberturas — a mesma capa duas
vezes seguidas. Hoje os dois caminhos passam por `escolherEntre(lista,
anterior)`. Medido depois da correção: **20 aberturas, 0 repetições seguidas**,
distribuição 6/8/6 entre três capas.

**Com uma capa só**, falhar significava esconder a imagem e ficar o papel com
o logo — melhor que um ícone de imagem quebrada ocupando a tela. Com uma LISTA
falhar ficou mais provável (basta escrever um nome e esquecer de subir o
arquivo), e por isso a queda ganhou os degraus da tabela acima.

**O sorteio mora em `useState`, não em variável de módulo**: módulo roda uma
vez por carregamento de página, e voltar à abertura dentro da mesma sessão
traria sempre a mesma capa. E a GRAVAÇÃO mora num efeito, não no sorteio — em
modo estrito o React roda o inicializador de estado duas vezes e fica com o
primeiro resultado; gravando ali, o registro guardaria a capa descartada e a
visita seguinte evitaria a imagem errada.

**Os arquivos não perdem nada no caminho.** `public/` é copiado byte a byte para
o `dist/` — conferido com `md5sum` e `cmp` na imagem real —, e o projeto não
tem plugin de imagem, `sharp` nem `imagemin`. O que chega ao navegador é
exatamente o que se pôs lá.

**O que PODE borrar é ampliação, e hoje borra.** Com `cover`, se a tela em
pixels reais (largura × densidade) for maior que o arquivo, o navegador
estica. Medido com o arquivo atual, de **1200×675**, numa janela de 1280×900 e
densidade 1: **ampliação de 1,33×** — e numa tela de densidade 2 seriam 2,67×.
Para nunca ampliar numa janela de 1920 com densidade 2, o arquivo precisa de
~**3840px de largura**. Daí para cima o navegador só reduz, e reduzir não
borra.

**O botão é só texto**, em Lexend Zetta Black caixa alta (`font-cartaz`), sem
o disco de seta. O `.cta` nasceu com padding assimétrico para abrigar esse
disco; sem ele o `.welcome__botao` devolve a simetria. A fonte é larguíssima,
então leva corpo menor (13px) e `max-width` — senão a pílula não cabe num
telefone estreito. Medido a 375px: 217×44, centrado, sem rolagem lateral.

**Não há véu atrás do botão.** Houve um degradê para garantir contraste sobre
qualquer foto; saiu a pedido, e a imagem chega limpa até a borda de baixo. O
botão se sustenta sozinho por ser pílula escura (`ink`) com tinta clara. Se um
dia a área sob ele ficar clara demais, o caminho é escurecer o BOTÃO, não
devolver a névoa sobre a arte.

**NÃO há cabeçalho na capa** — só o logo, grande e abaixo do topo. Ele e o
logo da barra são o MESMO elemento para o framer-motion (`layoutId="marca"`),
então ao entrar na coleção a marca **viaja** daqui até a barra encolhendo, em
vez de uma sumir e outra aparecer.

Por isso os dois nunca podem coexistir: dois elementos com o mesmo layoutId
quebram a animação. Quem garante isso é o ternário do `App` — um renderiza
exatamente quando o outro não. `aberturaNoAr` existe pelo mesmo motivo:
enquanto a tela de abertura está no ar, é ELA quem desenha a marca.

A viagem usa `MOLA_CALMA` (0,4s, sem ultrapassagem): a marca percorre meia
tela, e ultrapassar o alvo numa distância dessas lê como tranco.

O logo começa **abaixo do topo** de propósito — colado no alto, a viagem seria
quase imperceptível, e é o deslocamento que conta a história. Medido:

| | capa | barra | meio do voo |
|---|---|---|---|
| desktop | 420×63 @y126 | 190 @y14 | 218 @y28 |
| celular | 293×44 @y114 | — | — |

A capa ocupa `100svh` (não `vh`: no celular o `vh` conta a barra do navegador
que se esconde ao rolar, e a capa ficaria mais alta que a tela). Medido: 900 e
812, exatamente a janela, sem rolagem.

**Ao medir essa transição, desconfie de "não animou".** Uma primeira leitura
deu 420 → 418 → 190, um salto — mas era o painel congelando o `rAF` em
segundo plano. Alongando a transição para 1,6s os quadros intermediários
apareceram. Com screenshot forçando repaint entre as leituras, dá para pegar o
meio do voo mesmo a 0,4s.

**A capa aparece a cada carregamento** e sai no clique — como abrir um gibi
pela capa. Não fica guardada: se um dia incomodar vê-la toda vez, o lugar de
trocar por `localStorage` é o `useState` do `welcome` no `App.jsx`.

**O contraste do botão sobre foto desconhecida** era o que o véu resolvia, e
com capas sorteadas o problema cresceu: o botão cai sobre uma imagem
diferente a cada abertura, nenhuma conhecida de antemão. A regra continua a
mesma de quando o degradê saiu — se a área sob o botão ficar clara demais em
alguma capa, escurece-se o BOTÃO, não se devolve a névoa sobre a arte. Quem
escolhe as capas também escolhe isso: uma foto estourada no rodapé é um
problema da foto.

### Acento não conta: nem na ordem, nem na busca
**Ordem alfabética.** `sortList` comparava com `<`/`>` cru sobre texto
minúsculo — comparação por ponto de código, onde "é" (U+00E9) cai DEPOIS de
"z" (U+007A). Uma estante com Zorro, Ésfera e Últimas Balas saía nessa ordem.
Agora usa um `Intl.Collator('pt', { sensitivity: 'base' })`, que faz "é"
valer igual a "e" — como num índice de papel. Medido: Água Viva · Alpha ·
Ésfera · Esfera · Últimas Balas · Zorro.

O Collator é **um só, criado fora do comparador**: construí-lo dentro custaria
uma instância por par comparado.

**Busca.** `passes` usava `toLowerCase()` nos dois lados, que baixa a caixa
mas mantém o acento — procurar "esfera" não achava "Ésfera". Agora usa o
`gNorm` que o projeto já tinha, nos DOIS lados. Conferido nos dois sentidos:
"esfera" acha Ésfera e Esfera; "ésfera" também; "ultimas" acha Últimas Balas.

Ninguém digita acento numa caixa de busca, e quem catalogou a obra com acento
não deveria ser punido por isso.

### A marca-d'água COLEÇÃO
Na segunda linha, à esquerda. Tinta a **10%** (`text-ink-sussurro`), em
**Lexend Zetta Black** (`font-cartaz`, peso 900), caixa alta. A família entra
pelo mesmo `@import` do Google Fonts das outras três — o nome do token diz o
PAPEL (palavra grande como elemento gráfico), não a fonte. Não é título: é textura que preenche o vazio aberto
quando as ferramentas foram todas para a direita. Por isso `aria-hidden` —
anunciar "Coleção" para quem ouve seria prometer um título que visualmente não
existe — e `select-none`, porque marca-d'água que se seleciona vira tropeço.

**A entreletras é a da escala**, sem ajuste próprio: −0,02em no `text-secao`
e −0,025em no `sm:text-titulo`. Houve uma versão com `-.05em` numa classe
dedicada, desfeita a pedido.

Se algum dia voltar a mexer nisso, saiba que `tracking-tighter` **não resolve**:
ele pega no celular e não no desktop, porque `sm:text-titulo` traz a
entreletras do próprio nível e o Tailwind emite as variantes de media DEPOIS
das regras no fim do arquivo — estar por último não basta. O caminho é uma
classe com especificidade dobrada (`.x.x`, que dá (0,2,0) contra (0,1,0) do
utilitário), nunca `!important`.

**O token de 10% foi criado para isto.** A rampa de tinta parava em
`ink-mute` (38%), e a regra do projeto proíbe `ink/10` avulso. Mudança em
`tailwind.config.js` **exige reiniciar o servidor de dev**: o Tailwind lê a
config na subida, e enquanto o processo antigo roda a classe nova simplesmente
não gera CSS — o texto sai com tinta cheia e parece erro de código. O build de
produção já saía certo (`#23271c1a`) enquanto a tela mentia.

### Animação de ícone nos botões
No `index.css`, bloco próprio no fim. Seis gestos, todos dentro do teto de
0.4s:

| onde | gesto | mecânica |
|---|---|---|
| Filtros | a gota desce pelo funil e some | `@keyframes cai-gota` |
| Busca | a lente gira 14° e revela meio-tom | `<pattern>` de pontos + `transform-box: fill-box` |
| Galeria (inativa) | os quatro quadros brotam em sequência | `@keyframes brota-quadro` |
| Lista (inativa) | as três linhas entram pela esquerda | `@keyframes entra-linha` |
| Lixeira | a tampa levanta 18° | grupo próprio, pivô em `12.5% 100%` |
| MOSS / NOCKOUT | a palavra se entinta da esquerda | duas camadas + `clip-path` |
| Voltar ao topo | a seta sobe e outra toma o lugar | duas setas em janela de `1em` |
| Nova obra | carimbo no CLIQUE | `:active` + easing com ultrapassagem |

**A regra que separa estas das do site que as inspirou: nada roda em laço.**
Uma página de portfólio pode ter um asterisco girando para sempre porque o
movimento É o produto. Aqui você clica em "Filtros" quinhentas vezes, e o que
encanta na primeira irrita na quinquagésima. Toda animação tem início, fim e
motivo. A do carimbo é a única expressiva, e pode ser porque acontece no
clique — cadastrar obra é raro perto de filtrar.

**Keyframe, não transição com repouso alterado.** A primeira versão do
alternador deixava as linhas da Lista recuadas e a 40% enquanto ninguém
passava o mouse: o ícone ficava permanentemente meio-desenhado, parecendo
defeito. Com `@keyframes` o repouso é o ícone inteiro e o gesto só existe
durante o hover.

**Armadilha de especificidade no escalonamento.** O atalho `animation` também
zera `animation-delay`. Se a regra que declara a animação for mais específica
que as que definem os atrasos, os atrasos somem e tudo dispara junto — o
escalonamento existe no código e não na tela. Foi o que aconteceu com
`.ico-grade rect` (seletor de tipo a mais) contra `.ico-grade__q2`. A saída é
listar as mesmas classes nas duas regras, empatando a especificidade, e deixar
a ordem do arquivo decidir. **Conferir sempre lendo `animationDelay`
computado**, não só olhando: a tela em movimento engana.

**Movimento reduzido desliga o deslocamento, não tudo.** Ficam a retícula da
lupa e a tinta da palavra, que INFORMAM; some todo o resto, que só se mexe.

### A tela de erro
`Salvaguarda.jsx` é a rede que segura erro de renderização — e a única TELA de
erro do app (o aviso de espaço é faixa, a falha de nuvem é linha de texto, e
"Nada por aqui" é vazio, não erro).

**Duas colunas: o quadrinho à esquerda, o texto à direita.** O cartão é bem
mais largo que os outros do app e cresce num degrau — 720px, e **980px a partir
de `lg`**. A ilustração de 500px só aparece nesse segundo degrau: num cartão de
720 ela deixaria 148px para o texto, que não é coluna, é tira.

Abaixo de `sm` as duas empilham e a ilustração se centra. Lado a lado numa tela
de 375px sobrariam ~140px de texto, com o título quebrando em quatro linhas.

| largura | ilustração | coluna de texto | cartão |
|---|---|---|---|
| 375 | **285×261** (travada) | largura toda | 335 |
| 390 | 300×275 | largura toda | 350 |
| 640 | 300×275 | 226px | 600 |
| 1023 | 300×275 | 346px | 720 |
| 1024+ | **500×458** | 406px | 980 |

**`w-[300px]` anda com `max-w-full`.** Num aparelho de 375px o cartão só tem
287px por dentro, e os 300 vazariam. A trava faz a imagem valer 300 onde cabe
(de 390px para cima, que é o grosso dos telefones) e encolher onde não cabe, em
vez de empurrar o cartão para fora da tela.

A ilustração se centra com `mx-auto`, **não** com `items-center` no contêiner:
centrar pelo flex centraria também a coluna de texto, que encolheria para o
tamanho do conteúdo.

**O texto fica um degrau abaixo do normal em todas as larguras**
(`text-secao` 20px no título, `text-apoio` 12px no corpo). É a menor redução
que a escala permite — entre 28 e 20 não há nada, e inventar um tamanho solto
aqui quebraria a regra do projeto.

A coluna de texto leva `min-w-0`. Sem isso ela não encolhe abaixo do próprio
conteúdo, e o `pre` do detalhe técnico — que tem linhas longas de stack —
empurra o cartão para fora da tela.

**O `viewBox` foi apertado na tinta: `28.78 72.16 1022.36 935.61`.** O arquivo
veio em `0 0 1080 1080` com 72 unidades de vazio no topo — a 500px isso vira
33px de transparência, e o desenho aparecia 33px abaixo do título mesmo com as
CAIXAS perfeitamente alinhadas. É a mesma armadilha do logo, e aqui ela se
manifesta como desalinhamento em vez de encolhimento. A arte deixou de ser
quadrada (1,09:1), então a imagem é 500×458 e não 500×500 — a tinta visível
CRESCEU, o que sumiu foi margem vazia. Só o `viewBox` mudou no arquivo:
nenhum traço, nenhuma cor.

**Ao alinhar imagem com texto, meça a TINTA, não o elemento.** `items-start`
alinha caixas; se o SVG tiver margem interna, o olho vê desalinhado e a medição
do `getBoundingClientRect` diz que está certo. O jeito honesto é somar
`(bbox.y - viewBox.y) × escala` ao topo do elemento.

O quadrinho é `public/erro.svg`, painel preto sobre
vermelho `#df3722` com a palavra "Erro" desenhada em curvas. **O vermelho não é
o `rust` do projeto (`#9C4A2E`)** e fica assim de propósito: a arte vem com a
cor dela, como as faixas da divisória.

Vai num `<img>` apontando para `public/`, nunca importada pelo bundle. O motivo
é o próprio lugar: aqui o bundle é o que acabou de falhar, e um arquivo
estático é uma requisição que não depende de nada que quebrou. Pelo mesmo
motivo o botão de backup lê o `localStorage` direto, sem passar pelo store.

`aria-hidden` com `alt` vazio: o desenho já traz a palavra "Erro", mas quem dá
o recado é o título ao lado — anunciar a imagem repetiria em voz alta o que o
texto já diz.

**Para ver a tela, acrescente `?erro=1` ao endereço** — vale no preview e no
site publicado. Antes disso só dava editando o construtor e lembrando de
desfazer, porque ela só aparece quando um componente estoura no render. O
"Detalhe técnico" dessa tela forçada diz em voz alta que nada quebrou, para
ninguém se assustar ao cair ali por um link.

### País usa o campo de etiquetas
O campo de **País de origem** é o MESMO `Pessoas` de Autor e Artista. Era
texto livre com o aviso "Use / p/ separar": a barra é detalhe de
armazenamento, e o campo obrigava a pessoa a conhecê-la para cadastrar dois
países. Com etiquetas, cada país vira item que se vê e se apaga sozinho.

**Nada a migrar.** `Pessoas` devolve a mesma string unida por " / " que o
`paisesOf` já lia — os dois usam o mesmo `splitLista`. Conferido ponta a
ponta: cadastrando Brasil e Argentina, o `localStorage` gravou
`"Brasil / Argentina"`.


### O pop-up de Tema
Mesmo molde do Backup — mesma moldura, mesma entrada, mesmo título em Lexend
caixa alta, tela cheia no celular e cartão de 460px no desktop. Dois pop-ups
abertos do mesmo menu que chegassem de jeitos diferentes fariam o menu parecer
duas coisas.

**As opções ficam LADO A LADO, e no Backup em coluna.** Não é capricho: no
Backup são duas ações de pesos diferentes — uma delas substitui a coleção
inteira —, e a coluna serve para afastá-las. Aqui são dois pares, uma escolha
entre iguais, e lado a lado é como se lê escolha entre iguais.

**A palavra É a amostra** (`.tema-palavra`, no index.css): sem contorno e sem
bolinha. Duas camadas do mesmo texto, a de baixo em 30% e a de cima cheia,
recortada por `clip-path`; no hover o recorte abre da esquerda para a direita
e a palavra se **entinta como pincelada**. Na escolhida a transição é zerada —
a troca de tema já é instantânea na página inteira, e a palavra chegando
depois pareceria atraso.

O hex de cada tema é **cravado no `style`**, não token: a palavra mostra a cor
daquele tema, então não pode seguir o tema atual.

`role="radiogroup"` com `aria-checked`: são duas faces da MESMA escolha. Sem
isso o leitor de tela anuncia "Moss, botão" sem dizer de que pergunta aquilo é
resposta — e, como o que marca o escolhido é tinta e opacidade, sem o
`aria-checked` não sobraria nada para quem não enxerga a diferença.

**O pop-up NÃO fecha ao escolher.** A troca repinta a página inteira atrás do
véu, e fechar junto tiraria da vista justamente o que mudou — além de impedir
experimentar os dois sem reabrir o menu duas vezes.

Herda do Backup o vazio no celular: o painel é de tela cheia e o conteúdo é
curto, então sobra fundo embaixo. É traço do molde, não deste pop-up — o
Backup faz igual, e mexer num sem mexer no outro quebraria a semelhança que é
o ponto.

### O menu de dados e o pop-up de Backup
**Um nome por assunto, nos dois lugares.** O item do menu e o título do painel
que ele abre usam a MESMA palavra: Nuvem · Atividades · Capas · Backup. Antes
"Enviar capas" abria "Capas em massa" e "Nuvem — em dia" abria "Sincronizar
com o GitHub" — quem clicava chegava numa tela que parecia outra.

**O ponto de estado da nuvem existe UMA vez**, logo depois da palavra "Nuvem"
na subcategoria, centrado na altura dela. Saiu do ☰ e do título "Nuvem e
backup": repetido em três lugares, o mesmo alerta deixava de chamar atenção em
qualquer um deles.

**O estado saiu do rótulo, não do app.** O menu dizia "Nuvem — em dia",
"Nuvem — sincronizando". Agora diz só "Nuvem", e quem informa é a cor do
ponto. Mas cor sozinha não é informação — quem não distingue verde de laranja,
ou usa leitor de tela, ficaria sem saber. Por isso o estado continua em texto
no `title` e num `sr-only`: visualmente é um ponto, para quem ouve é
"Nuvem — em dia".

`PontoNuvem` substituiu o `SyncDot`. O antigo era um selo colado no canto de
um ícone — posição absoluta e anel de 2px da cor do papel, para se destacar do
desenho embaixo. Em linha ao lado de uma palavra, o anel só engorda o ponto e
a posição absoluta o tiraria da linha do texto.

As ações sob "Nuvem e backup" **não têm ícone**: são frases curtas numa lista
já recuada, e ali o ícone vira enfeite ao lado de uma palavra que já se lê. O
ponto de sincronização continua — é alerta, não decoração.

**Baixar e restaurar viraram um item só, "Backup"**, que abre pop-up próprio
(`Backup.jsx`). Lado a lado numa lista de atalhos eles se pareciam demais para
a diferença que têm: um grava um arquivo, o outro SUBSTITUI a coleção inteira.
No pop-up ficam **em coluna**, e o de importar usa `cta-ghost` — botões irmãos
de peso igual convidam ao clique rápido, e restaurar não é ação para clique
rápido.

O "(.json)" saiu dos rótulos: quem abre o menu quer salvar a coleção, não
escolher formato.

**As linhas do menu encolheram** de `text-titulo` para `text-obra`. Em Lexend
e no tamanho de título, "ESTATÍSTICAS" e "NUVEM E BACKUP" dominavam a tela
inteira do celular.

### O painel de estatísticas
Título **ESTATÍSTICAS**, fixo — antes trocava para "N de M itens na estante",
e o cabeçalho do painel mudava de assunto conforme o conteúdo.

No celular o seletor **Coleção / Filtro atual** desce para uma faixa própria
abaixo do título. Na mesma linha ele espremia a palavra em três linhas.

### A nuvem: "Como fazer?"
A explicação do token ficava sempre aberta no topo do painel. Quem já conectou
uma vez não precisa dela nunca mais, mas lia o parágrafo inteiro antes de
chegar nos campos. Agora mora atrás de um botão **"Como fazer?"**, junto com o
passo a passo que já era escondido: um assunto, uma porta.

### O logo no rodapé
Entrou no lugar do "A Gibiteca" escrito: os dois diziam a mesma coisa, e a
marca diz melhor. O `Marca` já traz `role="img"` com nome acessível, então
quem ouve não perde o texto.

**Sem `layoutId` aqui.** Esse id pertence ao par capa↔barra; um terceiro
elemento com o mesmo id quebraria a viagem do logo. Hoje há duas marcas no DOM
da coleção (barra e rodapé) e só a da barra é `motion`.

### A divisória ilustrada
Entre a paginação e o rodapé corre uma faixa de ponta a ponta: um rasgo de
papel, escuro, encostado no rodapé.

**Uma arte por LARGURA, e só.** São DOIS arquivos — `divisoria` (telas largas)
e `divisoria-m` (celular) — e eles valem igual no Moss e no Nockout.

| arquivo | caixa | paths | peso | faixa a 375px | faixa a 1280px |
|---|---|---|---|---|---|
| `divisoria` | 1920×100 | 1 | 1,9 kB | — | **66,7px** |
| `divisoria-m` | 1920×100 | 1 | 2,0 kB | **19,5px** | — |

Houve antes QUATRO arquivos (dois temas × duas larguras), com `useStore()`
dentro do componente só para escolher entre eles e caixas diferentes por
largura (1920×150 no desktop, 1920×250 no celular). A arte nova é a mesma nos
dois temas — decisão de desenho — e o código seguiu: sumiram metade dos
arquivos, o eixo de tema do gerador e a dependência do componente em relação ao
store.

**A caixa agora é a mesma nos dois (1920×100); quem muda é o DESENHO dentro
dela.** O rasgo de desktop ocupa os 26,85 últimos pontos da caixa, o de celular
ocupa 74,18 — é assim que a arte de celular compensa a faixa mais curta que uma
tela estreita produz. Mantenha a caixa ao trocar a arte: mudá-la muda a altura
da faixa em todas as larguras de uma vez.

**AS CORES DA ARTE NÃO SE TOCAM.** Houve uma versão do gerador com tabela de
cores por tema: ela trocava o preto dos caminhos sem classe por ink (`#23271C`)
e reescrevia o acento. Estava errado. A arte é de quem desenhou, e um gerador
que decide a cor faz o arquivo de saída mentir sobre o de entrada. Hoje `fill` e
`opacity` saem do próprio SVG como vieram, e caminho sem classe continua **sem
classe** — o que no SVG é preto, que é a cor que a arte tem. Conferido a cada
troca: a saída tem exatamente os mesmos hex da fonte.

Hoje a arte inteira é uma silhueta `#212121`, declarada na própria arte. Os dois
papéis são claros (`#F4F0E6` no Moss, `#F0F0F0` no Nockout), então a mesma
silhueta escura funciona nos dois — é por isso que a arte única é possível aqui,
e não só uma economia de arquivos.

O gerador (`tools/gerar-ilustra.cjs`) lê `src/assets/divisoria[-m].svg` e
escreve `public/divisoria[-m].svg`, fazendo só o que a arte não traz pronto:
- **joga fora as sobras de `fill: none`**: caminhos que não desenham nada. Nos
  exports atuais não há nenhuma, mas já houve 48 de 79 num deles — a limpeza
  fica porque o editor volta a produzi-las sem aviso.
- **renomeia as classes** por PAPEL (`silhueta`, `acento`, `acento-meio`), uma
  por combinação de `fill`+`opacity`, numerando só quando há colisão de
  verdade. Os nomes do editor são sorteados a cada export: `.cls-1` é
  `fill: none` num arquivo e a cor do desenho no outro.

  **Quem é a silhueta é a cor MAIS ESCURA do arquivo**, por luminância. A regra
  antes era "tem cor declarada = acento", e ela quebrou quando a arte passou a
  declarar a silhueta (`#212121`) em vez de deixá-la no preto padrão: a massa do
  desenho ia sair rotulada de acento. Contar caminhos também não resolve — numa
  arte antiga eram 4 de cada. Isto é só NOME: nenhuma cor é lida de tabela nem
  reescrita.
- **recusa `<text>`.** Sem a fonte instalada o navegador troca por outra e o
  desenho muda de forma; tem de vir em curvas.
- **fixa o `preserveAspectRatio`.**

**Vai num `<img>`, não inline como a Marca.** Inline, a arte entraria no bundle
de JS e pesaria mais do que a divisória vale. Em `<img>` o navegador busca o
arquivo uma vez, guarda em cache e nunca passa pelo JS. (Quando havia arte por
tema, o `src` TINHA de sair do store: com as duas no DOM e CSS escondendo uma, o
navegador baixaria as duas. Sem tema, esse problema não existe mais.)

**A largura é escolhida por `<picture>`, não por hook.** O navegador baixa SÓ a
fonte que casa com a consulta. Um hook de viewport montaria o `<img>` depois do
primeiro render e, ao trocar o `src` no resize, já teria baixado o arquivo
errado antes. Medido: cada largura faz exatamente uma requisição.

O corte é 640px — o mesmo do `sm:` do Tailwind e do `useEhDesktop()`.

Detalhe de navegador: ao **redimensionar** por cima da fronteira, o `currentSrc`
continua no arquivo já carregado até recarregar. Não é defeito, e usuário real
não atravessa 640px arrastando a janela; só atrapalha quem está medindo.

**`BASE_URL`, nunca `/`:** o build usa base relativa (`base: './'`) para rodar
em subpasta no GitHub Pages, e um caminho absoluto quebraria lá.

**A faixa aparece inteira em qualquer largura** (`preserveAspectRatio` em
`meet`). Cortar daria uma faixa mais alta, mas o rasgo é composto de ponta a
ponta, e o corte comeria as bordas deixando o miolo, que é o trecho mais vazio.
O Y em `Max`: se algum dia alguém impuser altura fixa aqui, o que se preserva é
a BASE do desenho, que é onde a faixa encosta no rodapé.

**O rodapé perdeu a margem e a borda de topo.** Quem separa agora é a faixa, e
ela encosta. Os dois juntos davam 44px de vão mais um fio — e como o pé da
ilustração é escuro, essa fresta clara aparecia. O `line-height: 0` no embrulho
existe pelo mesmo motivo: `<img>` é elemento de linha e apoia na linha de base,
deixando alguns pixels de folga embaixo.

### Modo lista — formato ficha
A lista **não é uma tabela**. Cada obra é uma ficha clicável: capa quadrada de
64px, título em display, apoio categórico em rótulo mono (editora, tipo), selos,
estrelas, barra de progresso da série e o valor investido à direita.
No celular a terceira coluna some e o valor desce para dentro do corpo.
O que falta é escrito por extenso — "falta o vol. 3", não "1/4".

### Obra fixada — o cartão em destaque
O destaque 2x2 da grade **não é a primeira obra qualquer**: é a obra que o
usuário fixou. Fixa-se pelo botão de alfinete no Detalhe.

- O store guarda **um id**, nunca uma lista (`gibiteca_fixada` no localStorage).
  Fixar outra troca a anterior por construção — é impossível ter duas.
- Clicar de novo na mesma **desafixa**.
- A fixada vai para o **início da lista filtrada**, então cai sempre na
  primeira posição da página 1 e vira o destaque.
- Se ela não passar no filtro atual, simplesmente não há destaque.
- Apagar a obra fixada limpa a fixação junto (ver `deleteObra`).

### Tela inicial: coleção e nada mais
Sem carrossel de capas e sem faixa de estatísticas. A tela inicial é a barra e a
grade — os números vivem no painel de Estatísticas.

### A marca é SVG, em duas tintas
O desenho tem **duas partes**: a sombra deslocada e as letras por cima. Como
PNG, a única ferramenta de recolorir seria `filter`, que achata tudo numa cor
só — e isso apagaria a sombra contra as letras, deixando um borrão. Por isso a
marca é **SVG inline** (`Marca.jsx`), onde cada parte tem o próprio `fill`.

As cores saem de variáveis, e só elas mudam:

| Parte | Cor | Onde |
|---|---|---|
| `--marca-sombra` | ink | sempre |
| `--marca-letra` | `paper` | sempre |

### A segunda marca, no hover
Passar o mouse sobre o logo troca pela arte alternativa do tema —
`MarcaAlt.jsx`, uma por tema, as duas no DOM, com o CSS escolhendo qual
aparece. A troca também é CSS puro (`.grupo-marca:hover`): passar hover por
estado faria o cabeçalho redesenhar a cada passada de mouse, para um efeito
que o navegador já resolve.

A classe do hover mora no **botão**, não no `span` interno — ele é
`pointer-events-none` e nunca receberia o evento.

**A tinta acompanha a barra, em dois registros.** No topo, sobre papel, a arte
sai na **cor do tema** (`--acento-texto`): moss no Moss, laranja no Nockout.
Com a cortina do acento no ar ela vira `paper` — a mesma tinta clara do miolo
da marca principal, nunca `#fff`.

É a única peça do cabeçalho que muda de cor com o tema, e pode: ela só aparece
no hover, então não é a assinatura. Quem assina é a marca principal, que fica
**parada de propósito** nos dois temas e nos dois estados. Esta é a piscada do
tema.

Sobre o acento a cor do tema se perde por necessidade, não por gosto: arte na
cor do acento, em cima do acento, não existe.

`--acento-texto` e **não** `--moss` cru: no Nockout o `#FF5000` sobre o
prateado dá 2,8:1 e a arte quase some. O `--acento-texto` é o mesmo laranja
levado ao ponto em que ainda se lê (`#C23A00`, 4,6:1). No Moss os dois são a
mesma cor, e por isso a diferença só aparece num dos temas.

Antes disto a arte era ink fixo (`#23271C`) no topo. Ficava legível, mas
igualzinha nos dois temas — e o hover do logo era justamente o lugar barato de
mostrar em que tema a pessoa está.

**A troca é revezamento, não mistura.** As duas artes não têm nada em comum —
letra gótica de um lado, katakana do outro —, e cruzar as opacidades ao mesmo
tempo deixaria as duas meio visíveis no meio do caminho: duas palavras
diferentes sobrepostas viram borrão. Então quem sai vai primeiro (sem atraso,
150ms) e quem entra começa 60ms depois. Na volta o atraso troca de lado,
acompanhando sempre quem está chegando.

Quem sai sobe, quem entra vem de baixo (`translateY` de 16% com `scale(.96)`),
dando direção à troca — e por ser transform, roda no compositor. Movimento
reduzido mantém só o esmaecimento.

Só o ponteiro alcança. Em tela de toque não há hover e a segunda arte não
aparece — é enfeite, não informação.

**As artes precisam vir em curvas.** `tools/gerar-marca-alt.cjs` recusa SVG com
`<text>`: com texto vivo o navegador troca a fonte por uma do sistema, e sem a
família certa instalada vira quadradinho — funciona só na máquina de quem
exportou.

**A marca é a única peça do cabeçalho que NÃO inverte.** Ela chegou a inverter
junto com a barra, e ficava parecendo outra marca a cada rolagem — assinatura
não muda de cor. Sombra ink, miolo `paper`, nos dois temas e nos dois estados.

Isso funciona porque **a marca contrasta consigo mesma**: miolo contra sombra dá
**13,39:1**, independente do fundo. Cada tema derruba uma parte diferente —
sobre o moss a sombra quase some (2,12) e as letras saltam (6,31); sobre o
laranja é o contrário (4,64 e 2,88) —, mas sempre sobra uma parte carregando a
forma. É por isso que um logotipo de duas tintas aguenta ficar fixo onde um de
uma tinta só precisaria inverter.

**O miolo das letras é sempre a cor do fundo atrás da marca**, nunca branco
puro: assim o desenho lê como recorte no papel, e não como adesivo colado por
cima. Quem carrega a forma é a sombra.

**O viewBox tem que abraçar a arte.** Os três SVG saíram do editor numa caixa
de `0 0 4000 1080` com o desenho centrado no meio dela, ocupando **51%** da
largura no `logo.svg`, 49% no alt-moss e **31%** no alt-nockout. Como o
`preserveAspectRatio` encaixa a caixa inteira — vazio incluso —, `h-12` rendia
48px de caixa e só ~24px de letra: a marca aparecia pela metade, e centrar no
cabeçalho centrava o vazio, não o desenho. As caixas foram apertadas na tinta,
medidas com `getBBox()`:

| arquivo | viewBox | proporção |
|---|---|---|
| `logo.svg` | `152 264 3695 551` | 6,71:1 |
| `marca-alt-moss.svg` | `887 276 2225 528` | 4,21:1 |
| `marca-alt-nockout.svg` | `207 374 3586 332` | 10,80:1 |

Um re-export com margem **não quebra nada visível** — só encolhe o logo pela
metade de novo, em silêncio. Quem trocar a arte mede o `getBBox()` antes de
rodar o gerador. E a proporção é parte do contrato: ela quase dobrou ao apertar
a caixa (3,70 → 6,71), então toda altura em uso vale uma medida nova.

**Na barra a marca é medida pela LARGURA: `w-[175px] md:w-[190px] h-auto`.** É a
largura que aperta aqui — é ela que disputa espaço com as duas pontas —, e com
o viewBox encostado na arte a altura sai sozinha da proporção (6,71:1): 26,1 e
28,3px. Dois degraus, e para por aí.

Ela chegou a ir a `h-10` (268×40) no desktop e ficava pesada: a 40px era o
elemento mais ALTO da barra, acima das pílulas de 34–36px, e um logotipo de
display preto nesse tamanho domina tudo em volta. Agora é o mais baixo. O aperto é entre 640 e
768, onde o cabeçalho já tem três colunas mas pouco mais de 600px úteis e os
dois lados comem ~330px. É lá que o degrau precisa ser medido, não a 1280px:
com a caixa apertada, `h-10` a 640px daria 268px de marca numa coluna de 236 —
ela transbordaria 16px para cada lado e encostaria no botão de filtros com
**folga zero**. Por isso o salto espera o `md`.

Medido, sem rolagem lateral em nenhuma largura:

| largura | marca | folga esq / dir |
|---|---|---|
| 375 | 175×26,1 | 48 / 48 |
| 640 | 175×26,1 | — |
| 768 | 190×28,3 | — |
| 1340 | 190×28,3 | — |

**Ao medir a marca, tire o ponteiro de cima dela.** O hover troca a arte e
aplica `scale(.96)`: uma medida feita com o cursor parado ali devolve 206×31
onde o valor real é 215×32, e a diferença é pequena o bastante para passar por
boa.

Na abertura a marca é dimensionada pela **largura** (`w-[86vw]`), não pela
altura: com altura fixa mais `max-width`, o SVG não encolhe — ele sobra caixa
vazia em volta, porque o `preserveAspectRatio` centraliza o desenho dentro do
espaço em vez de reduzi-lo. No cabeçalho a altura manda, porque ali a marca
precisa casar com a altura dos botões ao lado.

**O botão da marca é `inline-flex items-center`.** Sem o `items-center` o
`<span>` de dentro é elemento de linha, apoia na linha de base, e o espaço que
o navegador reserva para o descendente da fonte empurra a marca ~3px acima dos
ícones vizinhos. Com ele, medido nos três alvos do cabeçalho mobile: centros em
28, 28 e 28.

Quem precisar de uma combinação nova **muda a variável no contexto**, não o
componente.

**O favicon segue a mesma regra, e tem uma a mais.** `public/favicon.svg` é o
monograma "GIBI" em bloco 2×2. Veio em `0 0 1080 1080` com a tinta ocupando 60%
da largura e 79% da altura; num ícone de 16px esse vazio é perda direta de
legibilidade. A caixa foi apertada para o quadrado `80 80 920 920` — quadrado
porque o ícone é exibido num espaço quadrado, e centrado porque a tinta já
estava no centro (539,95 × 540,05).

A cor vem de um `<style>` DENTRO do SVG, com `prefers-color-scheme`: `#23271C`
no claro, `#F4F0E6` no escuro. É o esquema do **navegador**, não o tema do site
— o favicon vive na aba, não na página, e não tem como saber se quem abriu está
em Moss ou Nockout. Firefox e Chrome respeitam a consulta; **o Safari não**, e
nele fica sempre a versão clara (tinta escura), que some numa barra escura. Não
há `.ico` de reserva no projeto.

**Para trocar a arte:** aperte o viewBox na tinta (ver acima), substitua
`src/assets/logo.svg` e rode
`node tools/gerar-marca.cjs` — os `d` não se editam à mão. O gerador separa os caminhos por classe:
sem classe vira `.marca-sombra`, `.cls-1` vira `.marca-letra`, e `.cls-2`
(`fill: none`, sobras do editor) é descartado.

O `layoutId="marca"` da abertura saiu da imagem e foi para um `motion.span` em
volta do SVG — a viagem da marca continua igual.

### Dois temas de cor
O app tem **dois temas**: **Moss** (verde, padrão) e **Nockout**
(laranja `#FF5000`). Mudam o **acento** e o **papel**; tinta, gold, rust e blue
são os mesmos nos dois.

| Papel | Moss | Nockout |
|---|---|---|
| `--paper` | `#F4F0E6` creme | `#F0F0F0` prateado |
| `--paper-2` | `#EBE5D4` | `#E4E4E4` |
| `--paper-3` | `#E1DAC4` | `#D6D6D6` |

O prateado é **neutro**: R = G = B, e os degraus caem parelhos para a rampa não
ganhar cor ao escurecer. O creme do Moss, ao contrário, esquenta conforme
escurece (o B cai mais rápido que o R) — são duas famílias com lógicas
diferentes, não uma derivada da outra.

Dois efeitos que isso traz, nenhum deles problema até agora:

- O `surface` dos cartões (`#FFFDF8`) é quente e é o mesmo nos dois temas, então
  no Nockout ele fica levemente ameno sobre o cinza. Lê como papel sobre mesa,
  não como erro.
- O cartão separa **menos** do fundo: 1,12 contra 1,29 do prateado anterior. O
  que segura a leitura são a borda e a sombra do `.bezel`, não a diferença de
  tom. Se um dia o cartão perder a borda, isso precisa ser reavaliado.

Seguem o papel, por tabela: o fundo da página, o pontilhado (que também era
moss cravado), o véu da abertura, o fundo translúcido da barra, a borda da
barra de rolagem e o miolo da marca.

Moss é o `:root`; Nockout é `[data-tema='nockout']` no `<html>`. **O atributo
só existe quando há desvio**, então o padrão nunca fica pendurado em lugar
nenhum, e um dia que o Nockout saia não sobra resíduo.

**Os valores são canais RGB separados por espaço** (`--moss: 75 93 58`), não
hex. O Tailwind monta `rgb(var(--moss) / <alpha-value>)` em cima deles; com hex,
todo `bg-moss/40` do app pararia de funcionar.

**O acento tem três papéis, não um.** No Moss os três quase coincidem e a
separação nunca fez falta; no Nockout eles divergem, e é por isso que ela
existe:

| Token | Papel | Moss | Nockout |
|---|---|---|---|
| `--moss`, `-2`, `-3`, `-line` | preenchimento, borda, anel | #4B5D3A… | #FF5000… |
| `--acento-texto` | o acento usado como **texto** | = moss | #C23A00 |
| `--sobre-acento` | a tinta que vai **em cima** do preenchimento | paper | ink |

Os números que obrigaram a isso, medidos: #FF5000 como texto sobre creme dá
**2,8:1**; creme sobre #FF5000 dá **2,88:1** — os dois reprovam para corpo
pequeno. Com os tons separados a barra rolada sobe para **4,64:1**.

**Auditoria feita** (varredura de todo texto da tela, comparando os dois temas
no mesmo DOM). Só 7 elementos pioravam de passa→reprova, todos o mesmo selo —
já corrigidos:

| O quê | Moss | Nockout | Limite |
|---|---|---|---|
| Selo `Série N` | 7,18 → 6,31 | 3,28 → **4,64** | 4,5 |
| Contorno do botão na barra rolada | 2,11 → **4,37** | 1,72 → **3,39** | 3,0 |
| Ícones da barra rolada | — | 3,86 | 3,0 (objeto gráfico) |
| CTA e texto dos botões na barra | 6,31 | 4,64 | 4,5 |

Duas lições do exercício:

- O selo `Série` escapou do passe de tema porque `text-white` morava na string
  base e `bg-moss` era anexado depois — **nenhuma linha continha os dois**.
  Busca por texto não acha classe montada em pedaços.
- O contorno a `.34` **já reprovava no Moss** (2,11 contra os 3:1 que um
  contorno de componente pede). O laranja não criou o defeito, só o tornou
  visível. Contorno não é texto: o alvo dele é 3:1, não 4,5:1.

O que passa no Nockout passa **raspando** (4,64 contra 4,5). Escurecer o
laranja daria folga; clarear quebra.

### Capa ausente: a tinta também é do tema
Obra sem capa ganha um dos **oito** tons sorteados pelo nome da editora
(`classeTinta()`). Eles eram derivações do moss cravadas num array de JS, e por
isso não acompanhavam o tema.

Agora o **JS só sorteia** (`tintIndex` devolve 0–7) e a **cor sai de variável
de CSS** (`.tinta-N`, com a família do Nockout em `[data-tema='nockout']`).
Essa separação não é preciosismo: um hex vindo do JS ficaria **congelado até o
React redesenhar o cartão**, então trocar de tema deixaria capas da cor antiga
espalhadas pela estante. Em CSS a cascata repinta na hora.

O hash é o mesmo de antes, então cada editora continua caindo na mesma tinta e
nenhuma obra troca de cor dentro do tema Moss.

A família do Nockout **não é o `#FF5000` puro** — com branco por cima ele daria
3,3:1. São terracotas e barros: o laranja levado para o mesmo registro terroso
em que os verdes já estavam. Medidos, branco sobre cada um dos oito: pior caso
**5,24:1** no Nockout e **5,27:1** no Moss.

De passagem, os três gradientes levemente diferentes que existiam nos pontos de
uso (155°/160°, `cc`/`dd`) viraram **um só** — a variação era incidental, não
decisão de ninguém.

**Regra para quem for mexer:** `bg-moss`/`border-moss`/`ring-moss` seguem o
acento; o acento como texto é `text-acento-texto`; o que fica **sobre** um
preenchimento de acento é `text-sobre-acento`, nunca `text-white`.

Efeito colateral assumido: no Moss, o texto sobre o acento saiu de branco
puro para `paper`. A diferença é quase imperceptível e alinha com a regra da
casa de que nenhuma superfície usa `#fff`.

O seletor vive **dentro do ☰** (ação rara, pela regra do primeiro nível) e
**não fecha o menu** ao trocar: é ajuste, não comando, e dá para comparar os
dois sem reabrir.

Os dois botões são **só a palavra**: sem contorno, sem fundo, sem bolinha de
amostra — MOSS em verde, NOCKOUT em laranja, em `font-display` peso 800 e caixa
alta. A palavra É a amostra, por isso a cor é **hex cravado**: ela mostra a cor
de cada tema e não pode seguir o tema atual.

Sem contorno nem fundo, quem marca o escolhido é a **opacidade** (1 contra 0,3).
Para leitor de tela quem conta é o `aria-checked` do `role="menuitemradio"`, que
não depende de cor nem de opacidade — e o foco de teclado tem anel próprio em
`focus-visible`, que não aparece para quem usa o mouse.

O `index.html` lê o tema num script **antes do React**: sem isso, quem usa
Nockout veria o Moss piscar enquanto o bundle carrega.

### Topo fixo
O `sticky top-0` mora na própria `.barra-topo` — o `App.jsx` não embrulha mais
o `Header` em nada. Numa coleção grande a barra de filtros não pode sumir ao
rolar.

### Raios — três cascas, um núcleo para cada
`rounded-pequeno` (8px) · `rounded-medio` (16px) · `rounded-grande` (28px).
Pílulas seguem `rounded-full`.

Os núcleos **não são arbitrários**: cada um é a casca menos o padding dela,
para a curva do bezel duplo ficar concêntrica.

| tela | casca | padding | núcleo |
|---|---|---|---|
| celular | `medio` 16 | 4px | `core-medio` 12 |
| `sm:` em diante | `grande` 28 | 6px | `core` 22 |

Casca e núcleo mudam **sempre juntos** — o cartão usa
`rounded-medio sm:rounded-grande` e `rounded-core-medio sm:rounded-core`. No
celular o cartão é pequeno, e 28px de raio deixava a casca com cara de pastilha.

### Família
`font-display` (Bricolage Grotesque) · `font-sans` (Inter) · `font-mono` (Space Mono).
**`font-serif` não existe mais** — era mentira, Bricolage é uma grotesca.

### Informação de apoio
Dado **categórico** (contagem de volumes, tipo, editora, status) vira
`font-mono text-rotulo uppercase`. Nome de pessoa **não** — roteirista e
desenhista continuam em `text-apoio`.

## Design system (tokens — de tailwind.config.js e index.css)
- Papel/fundo: `paper #F4F0E6`, `paper-2 #EBE5D4`, `paper-3 #E1DAC4`.
- Tinta: uma só, `#23271C`, em quatro degraus de opacidade — `ink` 100%,
  `ink-soft` 78%, `ink-faint` 56%, `ink-mute` 38%. Por serem a mesma tinta,
  funcionam sobre qualquer superfície, inclusive sobre capa colorida.
- Acento (temável, ver **Dois temas de cor**): `moss`, `moss-2`, `moss-3`,
  `moss-line`. No tema **Moss**: `#4B5D3A`, `#5E7146`, `#879266`, `#c4cbaf`.
  Os nomes dos tokens continuam `moss` nos dois temas — é o papel, não a cor.
- Destaques: `gold #B0862B`, `rust #9C4A2E`, `blue #2f5aa8` (Importado), `box #8a6a45` (Box).
- Fontes: serif `Bricolage Grotesque` (títulos), sans `Inter` (texto), mono `Space Mono` (rótulos/pills).
- **Uma linguagem só, em todo o app** (tela principal e modais):
  - Sombra **ambiente**: `shadow-amb`, `shadow-amb-lg`, `shadow-island`.
    A sombra dura `3px 3px 0` foi **aposentada** — não reintroduzir.
  - Superfícies: bezel duplo `.bezel` (raio 28px) + `.bezel-core` (raio 22px).
    Raios nomeados: `rounded-bezel` (28px), `rounded-core` (22px).
  - Botões: `.cta` / `.cta-ghost` (pílula com ícone aninhado em `.knob`),
    `.pill-btn`, `.isl-btn`, `.isl-icon`. As classes `.neo-btn` e
    `.neo-icon` **mantiveram o nome mas mudaram de estilo** — hoje são
    pílula de contorno e botão circular. O prefixo "neo" é histórico.
  - Campos: `.field-input` (raio 14px, borda `ink/12`), `.field-select`.
  - Modais: backdrop `bg-ink/50 backdrop-blur-xl`; casca `rounded-bezel`,
    borda `ink/10`, fundo `#FFFDF8`, sombra difusa larga.
  - Movimento: `--ease-prem` = `cubic-bezier(.32,.72,0,1)` a 700ms.

### Tipo da edição
`data.js` guarda `TIPOS_EDICAO` (absoluta, definitiva, integral, omnibus,
bolso) como pares `[valor, rótulo]` — a obra grava a **chave**, a tela mostra
o rótulo, e renomear um rótulo não reescreve a coleção. `edicaoDe(obra)` traduz.

**Escolha única, com volta.** No Editor são pílulas, não caixas: uma obra tem
um formato só. Clicar na marcada **desmarca** — a maioria das edições não é
especial, e sem isso faltaria uma quinta pílula "nenhuma" só para desfazer.
A mesma regra vale no seletor de tipo dos Filtros.

### Teto de duas linhas nos selos (`Selos.jsx`)
No celular a grade é de **duas colunas** e sobram ~141px por card. Com status,
Importado, nota e tipo da edição, a linha de selos virava quatro linhas e
desalinhava a grade inteira. `Selos` corta em duas linhas e joga o resto numa
pílula **"+N"**, que abre no hover e no **toque** (hover não existe em celular,
e é lá que o corte acontece).

**A ordem dos filhos é a prioridade**: o que vem primeiro é o que fica. Hoje:
status (tenho/quero) → Importado → nota → tipo da edição.

**No celular só fica o status.** Importado, nota e tipo da edição têm
`hidden sm:inline-flex`: em ~141px eles não cabem de jeito nenhum, e o que
sobrava era um "+N" em todo cartão — um botão que não informa nada. Os três
continuam inteiros no painel de detalhe, a um toque. A ficha técnica do
`DetailSheet` ganhou as linhas **Edição** e **Origem** por causa disso; a nota
já estava nos indicadores do topo.

**Escondidos por CSS, não por JS.** Um `useEhDesktop()` por cartão seria um
`matchMedia` por cartão — com 554 obras, 554 ouvintes. Com `display:none` o
`Selos` mede largura zero e conclui sozinho que cabe tudo, então no celular
nunca sobra "+N". Trocar a largura da janela acerta os dois lados na hora, sem
recarregar.

**Mede, não chuta.** As larguras variam muito ("Tenho 4/12" contra "Bolso"),
então o componente lê a largura real de cada selo e empacota em linhas,
contando também a largura do próprio "+N" — que precisa caber junto. Uma sonda
invisível dá essa largura antes de o "+N" existir. A primeira versão só olhava
em que linha cada selo tinha caído e subtraía um: era pessimista e cortava na
primeira linha quando duas cabiam.

**O `ResizeObserver` só reage à LARGURA.** Reagir à altura seria um laço:
esconder selos encolhe a caixa, o que dispararia outra medição, que os
mostraria de novo.

### Excluir um volume só
`VolPanel` tem "Excluir este volume" (rust, sublinhado, atrás de uma régua):
é a única ação do painel que destrói dado, e fica longe dos "copiar p/ todos".
Some quando resta **um** volume — série sem volume nenhum não é um estado que
valha a pena existir. A quantidade acompanha sozinha.

### Filtros multi-seleção
**Editora, País, Autor e Tipo de edição guardam LISTA**, não valor único.
Dentro do campo os valores **somam** (Panini OU Pipoca); entre campos continuam
se **cruzando** (Panini E Japão). `filtrosPadrao()` é função, não constante:
devolvendo listas novas a cada chamada, "limpar filtros" não entrega ao estado
os mesmos arrays que estavam em uso.

`comoLista(v)` em `helpers.js` aceita lista **e** valor solto — um filtro
gravado por uma versão anterior não derruba o `passes()`.

O `Selecao multi` **não fecha a folha a cada escolha**: marcar cinco editoras
seriam cinco idas e vindas. Fecha no clique fora, no Esc ou no botão. A opção
vazia ("Todas") não vira mais um item marcado — ela **zera** a lista, e aparece
marcada justamente quando nada está. Fechado, o botão mostra o primeiro rótulo
mais um contador (`Panini +2`), com o contador **fora** do truncate: ele some
justamente quando o nome é longo, que é quando mais importa.

O contador de filtros do cabeçalho conta **campos ligados**, não valores
marcados: três editoras são um filtro só.

A folha abre com até **340px** (eram 232): 7 opções à vista em vez de 5. O teto
real continua sendo o container que rola.

### Autor e artista são etiquetas, não texto com "/"
`Pessoas.jsx`. Cada nome é uma etiqueta fechada com × próprio; fecha com
Enter, vírgula, ponto e vírgula ou Tab, e **colar uma lista** ("Alan Moore,
Dave Gibbons; John Higgins") abre todas de uma vez. Backspace no campo vazio
tira a última. Sair do campo fecha o nome pendente — ninguém perde o que
digitou por clicar fora.

**O que sai do componente continua sendo a mesma string separada por " / "**:
modelo de dados, `splitLista`, `authorsOf`, filtros, diário e backups não
mudaram nada. A obra antiga abre em etiquetas sozinha.

Repetido não entra duas vezes, comparando por `gNorm` (sem acento, sem caixa).
Antes, errar uma barra juntava dois nomes num só e o filtro de autor passava a
listar "Alan Moore Dave Gibbons" como se fosse uma pessoa.

Os rótulos são **"Autor"** e **"Artista"** — não mais "Autor / Roteirista" e
"Desenhista / Colorista / Finalista", que só existiam para explicar a barra.
**O rótulo é desenhado pelo próprio `Pessoas`** (prop `rotulo`), não por fora:
é na linha dele que mora o botão de dobrar.

**Teto de uma linha.** Uma edição com trinta artistas creditados fazia a caixa
crescer meia tela e empurrar o resto do formulário para fora da vista. Em
repouso só aparece o que cabe numa linha; o resto fica atrás de um **"+N" com
seta**, na linha do rótulo.

Mede a largura real de cada etiqueta — "Jim Lee" e "Daniel Dan Brown" não têm
nem perto do mesmo tamanho —, e o espaço do campo de digitar entra na conta,
porque os dois dividem a linha. Por isso o mesmo campo mostra **dois** nomes no
celular e **um** no desktop (lá a coluna é mais estreita): quem decide é a
medida, não um número fixo.

O botão fica **na linha do rótulo, não no fim das etiquetas**: aberto, o fim da
lista está a trinta etiquetas de distância, e fechar exigiria rolar até lá.

Fechar um nome novo **abre a lista sozinho** — senão você digitaria, apertaria
Enter e nada apareceria, porque a etiqueta teria ido direto para a parte
escondida.

Como em `Selos`, o `ResizeObserver` **só reage à largura**: reagir à altura
seria um laço. E se o `requestAnimationFrame` não rodar, o campo fica aberto
mostrando tudo — degradação boa, não quebra.

### Contraste: `contorno` é o fio de campo
`separador` (12%) é véu de **divisória**. Num formulário inteiro de caixas ele
some, e a tela vira creme sobre creme — era a queixa de "tudo monocromático".

`contorno` (24%) é o fio de **campo**: `.field-input`, `.neo-btn`, gatilho do
`Selecao`, trilha do `Seg`/`Switch`, `CheckTile` e as caixas de marcação. Quem
desenhar controle novo usa `contorno`; quem separar blocos continua em
`separador`/`linha`.

Veio junto: rótulo de campo em `text-ink-soft` (era `ink-faint`), fio da
`Secao` em `separador` com um quadradinho moss ancorando o título, e as
etiquetas do `Pessoas` com borda `moss-3` e texto `font-semibold`.

### O Editor é dividido em seções
`Secao` (mono, moss, com um fio até a margem). Ordem: **Cadastro ·
Publicação · Capa · Autoria · Situação · Volumes · Anotações**. Eram quinze
campos em fila única, todos com o mesmo peso.

Duas mudanças de lugar que vieram junto: **"Tipo da edição" subiu** para
Publicação (é dado de publicação, e estava largado depois da resenha), e o link
**"Ver no Guia" saiu de dentro da linha do título** — ali comia metade da
largura do campo justamente no celular. Agora fica abaixo, alinhado à direita.

### Ícone em vez de texto, mas nunca ícone sozinho
`BotaoIcone` no Editor: círculo de contorno, variante `perigo` em rust.
Todos levam `title` **e** `aria-label` por extenso.

A barra do rodapé do volume é uma só: o rótulo visível **"Copiar p/ todos"**
seguido de três ícones (caneta = autor, paleta = artista, marcador = status), o
vão, e a **lixeira** à direita. O rótulo fica à vista de propósito — ícone
sozinho vira charada, e no celular não existe o balãozinho do `title` para
salvar. A paleta não é pincel: pincel e caneta viram o mesmo risco diagonal a
15px, e trocar um pelo outro aqui sobrescreve o campo em **todos** os volumes.

### Duplicar obra
Ícone ao lado de Editar, na gaveta de detalhe. `duplicarObra(id)` no store faz
**clone profundo** (`JSON.parse(JSON.stringify())`) — série e box têm volumes,
e dois registros apontando para o mesmo array fariam editar um mexer no outro.
Id novo, "(cópia)" no nome.

A cópia **nasce gravada** e o Editor abre nela: quem duplica quer editar em
seguida, e um rascunho que só existisse no modal se perderia num Cancelar.
Consequência a lembrar: duplicar uma série com capas embutidas **dobra** o peso
dela no armazenamento.


### Desmembrar: uma série vira N obras avulsas
O caminho inverso do cadastro. Quem comprou a série inteira a cadastrou como
série; quem depois quer tratar cada volume como obra própria — porque vendeu
metade, porque só lê salteado, porque a "série" na verdade era um punhado de
histórias sem ordem — não tinha saída a não ser recadastrar volume por volume.

Botão **Desmembrar** no cabeçalho da seção **Volumes**, na gaveta de detalhe.
Ali, e não junto de Fixar/Duplicar/Editar: aquele cabeçalho já carrega quatro
controles, e desmembrar não é irmão deles — é ação de **estrutura**, e só
existe para quem tem volumes. Encostada no que ela desfaz.

**A regra de herança mora em `helpers.js`, não no store.** `fragmentosDe(obra,
ultimoId)` é função pura: recebe a obra e o último id em uso, devolve os
registros novos. Fica ao lado de `tipoOf` e `volsOf`, que são quem define a
forma do registro; o store só cuida de ids e de estado.

| sai de | campos |
|---|---|
| do **conjunto** | `origem`, `editora`, `pais`, `tipoEdicao`, `tags` (clonadas), `resenha` |
| do **volume** | `imagem`, `status`, `urgencia`, `valorPago`, `lido`, `nota` |
| do volume, caindo para o conjunto | `roteirista`, `desenhista` |

Autor e artista caem para os da série quando o volume não os traz: numa série
de autor único eles só foram preenchidos uma vez, lá em cima. As tags saem
**clonadas** — um array compartilhado faria editar os gêneros de uma obra
mexer nas outras N−1.

**O nome ganha a série na frente.** "Vol. 3" sozinho na estante não diz nada: o
nome da série era o contexto, e desmembrar é tirar esse contexto. Salvo quando
ele já está lá — quem nomeou os volumes de "Sandman 3" não quer "Sandman —
Sandman 3". A comparação passa por `gNorm`, então acento e caixa não contam.
Caso conhecido e aceito: um box "Box Akira" com volumes "Akira 1" vira "Box
Akira — Akira 1", verboso. É o preço de não usar casamento aproximado, que
poderia **engolir** o nome da série e deixar obras chamadas "1", "2", "3".

**Capa: a do volume, e só.** Se NENHUM volume tem capa própria — é o box, onde
o editor nem oferece o campo —, a capa do conjunto desce para todos; sem isso,
desmembrar um box apagaria a única capa que existia. Havendo uma capa de
volume que seja, cada um fica com a sua e quem não tem fica sem: herdar ali
espalharia a capa do volume 1 pela série inteira, e **capa errada é pior que
capa nenhuma**.

**As travas do editor valem aqui.** Urgência só no que falta; valor, lido e
nota só no que está na estante. Sem isso, desmembrar criaria obras em estados
que o editor não deixa salvar.

**Uma passada de estado**, não "apaga e depois cria": entre as duas o app
renderizaria uma coleção sem a série e sem os volumes, e a gravação automática
poderia pegar justamente esse intervalo e salvar o buraco.

**Ids corridos, nenhum reaproveitado.** Dar o id da série ao primeiro volume
economizaria um número e custaria caro: a obra fixada é guardada POR ID, e o
alfinete passaria sozinho da série para o volume 1. Pelo mesmo motivo a
fixação some junto quando é a série que está fixada — escolher um volume para
herdar o destaque seria o app decidindo no lugar de quem fixou.

**Pergunta com números, porque não tem desfazer.** O `confirm` diz quantas
obras vão nascer e **quantas vão ficar sem capa** — capa é o que não dá para
recuperar digitando de novo. E conta o TOTAL, não o que está na tela: com o
filtro em "Tenho" a lista abaixo mostra 3 de 8 volumes, mas o desmembramento
vale para os 8, e quem só olhasse a tela contaria errado.

**Fecha a gaveta e NÃO abre o editor**, ao contrário de Duplicar. Duplicar
entrega uma obra só, que a pessoa vai renomear na hora; desmembrar entrega N, e
abrir o editor em qualquer uma delas seria escolher uma por conta própria.

### O × da busca limpa a busca
Não só fecha: apaga o termo. Antes a coleção continuava filtrada por um texto
que não estava mais à vista, e dava a impressão de que obras tinham sumido.
O **Esc continua só fechando**, para quem quer conferir o resultado.

### A tela branca era o véu da abertura
Sintoma: recarregar durante uma sincronia e o app aparecer em branco. A causa
não era a sincronia — era o fade de saída da `Abertura`.

O fundo creme era um `AnimatePresence` com fade em **JS**. Se a thread
principal travasse durante os 340ms — e serializar uma coleção de 4 MB trava —,
a animação parava no meio, nunca "terminava", e o `AnimatePresence` segurava a
camada `z-95` montada **cobrindo o app inteiro**, para sempre.

Agora o elemento fica **sempre montado** e some por transição de **CSS**
(`.veu-abertura`, com `data-fora`): a opacidade roda no compositor e termina
mesmo com a thread ocupada, e sem presença condicional não há o que segurar.

**Regra que fica:** camada de tela inteira não depende de animação de JS
terminar para sair do caminho. Quando depender, ela precisa de
`pointer-events-none` no `exit` — é o que o `SearchOverlay` faz, para que uma
saída travada não engula todo clique do app com a tela aparentemente normal.

## Convenções de componentes
- Componentes funcionais, um por arquivo, export default. Estado local via hooks;
  estado global via `useStore()` (contexto). Sem libs de estado externas.
## Movimento (skill `apple-design`)
Todo movimento sai de `src/lib/motion.js` — **não escrever durações soltas
nos componentes**. Molas em vez de duração fixa, porque uma duração fixa não
sabe responder a uma entrada nova no meio do caminho.

- `MOLA_CALMA` (`bounce 0`, `0.4s`) — padrão. Não passa do alvo.
- `MOLA_GAVETA` (`bounce 0.18`, `0.3s`) — gavetas e modais. A leve
  ultrapassagem só se justifica porque vêm de um gesto.
- `MOLA_TOQUE` (`bounce 0`, `0.22s`) — resposta a toque, menus curtos.
- `FADE` — backdrops. Opacidade não precisa de mola.
- `projetar(v)` — onde o gesto ia parar. Forma exponencial da Apple
  (`(v/1000)·0.998/0.002`), **não** a fórmula de física.
- `deveDispensar({...})` — decide arrastar-para-fechar. Com velocidade alta
  o **sinal** decide; senão decide a projeção contra 40% do tamanho.
- `ELASTICO_DIREITA`/`ELASTICO_BAIXO` — `1` no lado que dispensa (segue o
  dedo 1:1) e `0.06` no lado sem saída (resiste em vez de travar).
- `useEhDesktop()` / `usaMovimentoReduzido()` — a gaveta sai pelo mesmo lado
  por onde entrou, e quem pediu menos movimento não recebe arrasto nem mola.

**Gavetas arrastáveis** (Detalhe e Filtros): `useDragControls` com
`dragListener={false}`, e o arrasto começa **só pelo cabeçalho** — senão o
corpo rolável briga com o gesto. Entrada e saída percorrem o caminho inteiro
(`'100%'`), não um deslocamento curto: se o usuário arrastou para longe, um
deslocamento curto faria a gaveta repuxar para perto antes de sumir.

**Resposta ao toque:** o destaque acontece no `pointerdown`, não no `click`.
No Card é `whileTap`; nos botões é `:active` no CSS, que já dispara ao apertar.

- Modais/gavetas usam **framer-motion** com `AnimatePresence`; backdrop
  `bg-ink/45 backdrop-blur-[2px]`; fecham no clique do backdrop e no Esc.
- **Card:** tilt 3D com `useMotionValue`/`useSpring` (rotateX/rotateY) e
  **bezel duplo** — casca `.bezel` (raio 28px) envolvendo `.bezel-core`
  (raio 22px, brilho interno no topo). Entrada por `whileInView` (sobe 24px e
  tira o desfoque). Aceita `feature` (destaque 2×2 da grade bento, só a partir
  de `lg:`). **Proibido** brilho/glare seguindo o cursor.
- **Capas (Card da grade):** a caixa da capa é **quadrada** (`aspect-square`),
  para que todos os cartões de uma linha alinhem os textos na mesma altura.
  A capa fica **contida** dentro dela: `absolute inset-0 m-auto max-w-full
  max-h-full w-auto h-auto object-contain` — formato natural preservado, nada
  recortado. O `absolute` é obrigatório: sem ele o `max-h-full` não tem altura
  definida para resolver e uma capa alta estica a caixa, desalinhando a linha.
  Continuam valendo: **sem recorte** (`object-cover` proibido), **sem** moldura
  preta e **sem** fundo branco sobrando. Placeholder (sem capa): preenche o
  quadrado (`w-full h-full`) com `classeTinta()` + iniciais.
  Fora da grade (Detalhe, volumes) a capa segue no formato natural livre.
- **Grade da galeria:** `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`.
  Duas colunas no celular, não três: com três sobravam ~86px úteis e todo selo
  caía no "+N".
- **Selos (.pill):** Tenho = `pill-tenho` (moss cheio), Quero = `pill-quero`
  (suave), Importado = `pill-imp` (azul), tipo da edição = `pill-edicao` (gold). Urgente = quadrado `rust` com triângulo
  branco (SVG), no canto superior direito da capa.
- **Seletor de segmentos (`Seg`, em `FiltersDrawer`):** duas variantes. A
  normal marca com **moss cheio** (Todos/Tenho/Quero, Leitura). A `claro` marca
  com **pastilha branca sobre trilha de papel**, com contorno moss — usada no
  Tipo (Avulsos/Boxes/Séries), que fica logo abaixo do status: dois seletores
  de acento empilhados brigariam pela atenção. A variante clara precisa de folga
  (`p-1`) e `rounded-full` no botão, senão o contorno do marcado bate no
  arredondado da trilha e sai cortado nas pontas.
  Tipo sem nenhuma obra no recorte atual fica **visível e apagado**, não some:
  sumir mudaria a largura dos outros dois a cada filtro.
- **Editor:** campos em grid 2 colunas, **todos com rótulo** para alinhar em
  linha e coluna. Urgente e Lido são **checkbox** (componente `CheckTile`,
  altura 42px = a dos inputs), nunca seletores Sim/Não. Nota (estrelas) só
  aparece quando Lido está marcado. `FiltersDrawer` usa `content-start` no grid
  para as linhas não esticarem verticalmente.

## Modelo de dados (uma "obra")
```js
{
  id: Number,                       // único; nextId = max(id)+1
  nome: String,
  tipo: 'avulso' | 'box' | 'serie', // 'avulsa' é legado -> tratar como 'avulso'
  origem: 'nacional' | 'importado',
  editora: String,                  // helper edOf(o)
  pais: String,
  tags: [String],                   // gêneros; helper tagsOf(o)
  imagem: String|null,              // capa (base64 ou URL raw do GitHub)
  resenha: String,
  // AVULSO (campos no topo):
  roteirista, desenhista: String,
  status: 'wishlist' | 'biblioteca',// "Quero" | "Tenho"; helper statusMatch(o,'biblioteca')
  urgencia: Boolean,                // só faz sentido quando NÃO possui (wishlist)
  valorPago: Number,                // centavos->reais via moneyToNumber; só quando possui
  lido: Boolean, nota: Number,      // 0..5 em passos de 0.5; só quando possui e lido
  // SÉRIE/BOX:
  volumes: [ { nome, imagem, roteirista, desenhista, status, urgencia, valorPago, lido, nota } ]
}
```
- **Unidades:** `unitsOf(o)` = `[o]` para avulso, ou `o.volumes` para série/box.
  Estatísticas e contagens operam sobre unidades. `ownedCount`, `unitsOf`,
  `avgNota`, `sumValor` já encapsulam isso — reúse-os, não recalcule.
- `coverOf(o)` = `o.imagem || o.volumes?.[0]?.imagem`.

## Store e persistência (lib/store.jsx)
- Chaves no localStorage: `gibiteca_v1` (`{version, obras, editoras}`),
  `gibiteca_pagesize`, `gibiteca_cloud` (config da nuvem, inclui o token).
- Um `ref` `dirty` evita persistir/enviar antes da 1ª alteração real.
- Mutações: `upsertObra`, `duplicarObra`, `desmembrarObra`, `deleteObra`,
  `setCovers`, `loadBackup`. Toda alteração persiste local e, se a nuvem
  estiver conectada, **agenda push** (debounce 1,5s).
- `skipPush` evita reenviar dados recém-puxados da nuvem (senão vira loop).

## Nuvem (GitHub Contents API — lib/cloud.js + store)
- Guarda a coleção em `data/gibiteca.json` (caminho configurável) no repo do
  usuário. Requer token fine-grained com **Contents: Read and write**.
- `cloudConnect` valida o repo (GET /repos), puxa o arquivo (ou cria se 404).
- Push: `ghPut` com o `sha` atual; em conflito, refaz GET do sha e tenta 1x.
- Status de sync: `off | ok | sync | pending | err` (SyncDot no Header).
- Token fica só no localStorage do navegador (paridade com a versão HTML).

## Capas em massa (BulkCovers.jsx)
- Casa cada arquivo com a obra por **nome canônico** (`canon()` — ignora acento e
  pontuação). Status por arquivo: associada / ambígua / sem par.
- Sobe cada imagem para `covers/{slugify(nome)}-{id}.{ext}` no repo (precisa da
  nuvem conectada) e grava `obra.imagem` = URL `raw.githubusercontent.com/...`.
- Depois chama `setCovers`, que atualiza as obras e dispara o push do JSON.

## Testes (obrigatório antes de empacotar)
Não há framework de testes instalado; usamos um **smoke-test com esbuild +
jsdom** que empacota o app e monta os componentes com dados reais/mocks.
Ver a skill `jsdom-smoke-test` para o passo a passo e os patches necessários
(ex.: remover a opção `signal` do `addEventListener` porque o jsdom não a
aceita do framer-motion; mockar `fetch` para simular o GitHub). Cheque sempre
"0 erros reais" e os fluxos: render da coleção, criar/editar/excluir, abrir
cada modal, e (com mock) conectar nuvem / push automático / capas em massa.

## Release / empacotar
1. `npm run build` (tem que passar; hoje ~404 módulos).
2. Rodar o smoke-test (skill `jsdom-smoke-test`). Exigir 0 erros reais.
3. Subir a versão em `package.json` (semver; hoje `1.0.3`).
4. Empacotar SEM `node_modules`, `dist`, `_test`:
   `zip -r gibiteca-react.zip gibiteca-react -x '*/node_modules/*' '*/dist/*' '*/_test/*' '*/.git/*'`.
Os artefatos de teste ficam numa pasta `_test/` descartável (não versionar).

## Histórico de decisões (contexto que economiza retrabalho)
- ink mudou de `#20241A` para `#23271C` para bater com o `index.html`.
- Card: removido o brilho de cursor; mantido só o 3D + sombra dura.
- Lista deixou de ser "toda branca": cabeçalho `bg-ink text-paper`, hover, pills.
- Filtros: o vão vertical exagerado era o grid esticando (align-content). Corrigido com `content-start`.
- Grade da galeria: **3 colunas no mobile, 4 em md, 5 em xl** (`Collection.jsx`).
  A primeira obra vira destaque 2×2 a partir de `lg:`, quando há 5+ itens na página.
- Cabeçalho: no mobile a ilha ocupa a largura toda (logo à esquerda, ícones à
  direita) para o logo não ficar espremido; a partir de `sm:` volta a ser pílula
  compacta centralizada. O logo tem `max-w-[46vw]` + `object-contain` no mobile.
- Tela principal passou pelo tratamento premium (skill `high-end-visual-design`,
  arquétipos Editorial Luxury + bento assimétrico): respiro maior, bezel duplo,
  pílulas com ícone aninhado, ilha flutuante no lugar da barra colada, e entrada
  com `whileInView`. **A paleta não mudou** — papel, tinta, musgo, ouro, rust,
  azul e box seguem idênticos, e os selos e as regras de capa foram preservados.
  Numa segunda rodada os modais (Editor, Filtros, Detalhe, Stats, Nuvem, Capas,
  Busca, GenrePicker) também migraram — a sombra dura saiu do app inteiro.
- Capas de volume no detalhe: naturais/flutuando, sem recorte/moldura.
- Editor: Urgente e Lido viraram checkbox (`CheckTile`), com rótulos p/ alinhar.
- "Importado" é selo azul; "Box" usa marrom `#8a6a45`; Urgente é `rust` com triângulo.
