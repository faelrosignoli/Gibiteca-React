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
    MarcaRodape.jsx        # a marca CHAPADA, só no rodapé (gerada de assets/logo-rodape.svg)
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
    Welcome.jsx            # a capa: uma imagem por visita (a pasta assets/capas É a lista), celular/desktop por <picture>
    Backup.jsx             # pop-up de exportar/importar a coleção
    Tema.jsx               # pop-up do tema: uma faixa colorida por tema, empilhadas
    Fila.jsx               # fila de leitura: gaveta com arrasto para reordenar + pop-up da nota
    Listas.jsx             # listas/pastas: índice + galeria de capas, e a grade de escolher obras
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

- **A capa (`.welcome`) crava `#212121`** no botão e na sombra do logo.
  Houve um tempo em que isso era um preto DIFERENTE do `ink` do app
  (`#23271C`); hoje os dois coincidem, porque a tinta do projeto virou
  `#212121`. As declarações ficam: elas prendem a capa a este preto, que
  responde à arte e não à interface.
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
**Nove portas, uma lista, sem gaveta**, nesta ordem:

```
Seus dados       (ou o NOME da pessoa, quando há um)    ← destaque (20px + avatar)
Tema
Fila de leitura
Listas                                                    o dia a dia (16px)
Estatísticas
Configurações    manutenção: se usa de vez em quando
Ajuda            a saída de quem não achou              ← apoio (14px + ícone)
```

**Houve um grupo e ele foi desfeito.** "Seus dados" abria uma sanfona com
Perfil, Atividades, Capas e Backup dentro — agrupamento por assunto cujo preço
era alto demais: quatro das portas custavam DOIS cliques e ficavam
invisíveis até o primeiro. Um menu deste tamanho cabe inteiro na tela; esconder
metade dele para economizar um espaço que sobra é trocar alcance por arrumação.

**A ordem é por frequência de uso, com as duas pontas marcadas.** Três portes,
não sete linhas iguais: uma lista achatada obriga a ler os sete rótulos para
achar o primeiro; com a primeira maior e a última menor, o olho pega as pontas
antes de ler qualquer palavra. A diferença entre destaque e normal é de UM
degrau da escala (20 contra 16px) — o suficiente para vir primeiro sem a linha
virar cabeçalho.

**Ícone só nas pontas.** Nos sete do meio viraria enfeite ao lado de uma palavra
em caixa alta que já se lê de longe; nas pontas reforça o que o tamanho começou.
O texto dessas duas fica recuado em relação aos outros, e é de propósito: são a
cabeça e o pé da lista, não mais dois itens dela.

**"Tema" não leva amostra de cor.** Houve duas tentativas: quatro palitos nas
cores dos temas, que liam como quatro itens de lista dentro de um item de
lista; e uma roda de cores, que resolvia isso mas ainda disputava atenção com
o avatar do Perfil logo acima. A linha ficou só com a palavra — as cores estão
a um clique, no pop-up, onde cada tema é uma faixa do tamanho de um tema.

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

**As linhas são grandes (`font-cartaz text-obra`, caixa alta) e sem ícone**, com
um fio entre elas. São assuntos, não uma lista de comandos, e a essa altura o
ícone vira enfeite ao lado de uma palavra que já se lê de longe.

**Um desenho só nos dois tamanhos.** Houve dois: o painel de tela cheia como
acima, e a folha do desktop como uma lista compacta, com ícone e fundo
arredondado no hover, servidos pelo mesmo componente através de uma prop
`grande`. A prop saiu. O desktop ficou com a MOLDURA de pop-up — borda,
sombra, 320px, ancorada no ☰ —, e o conteúdo dela passou a ser o do celular.

Dois desenhos para o mesmo menu é dívida que se paga em todo item novo: "Ajuda"
nasceu precisando de um ícone só por causa de um dos dois lados. E fazia o mesmo
app parecer dois apps conforme a largura da tela.

Com a prop foram **seis componentes de ícone** que ficaram órfãos (`IconTema`,
`IconFila`, `IconListas`, `IconStats`, `IconCloud`, `IconAjuda`) — removidos
junto, porque código morto que compila é o pior tipo: ninguém o encontra lendo,
e ele volta a ser copiado no dia em que alguém procurar "como se faz um ícone
aqui".

O que o desktop ganhou de volta foi só `hover:text-acento-texto`: o celular não
tem cursor e não precisa responder a ele, a folha suspensa precisa, ou o
ponteiro passa por cima de seis palavras sem dizer qual vai ser clicada. Muda a
COR, não o fundo — o fundo arredondado era justamente o que fazia a lista
parecer outra coisa ali.

E o fio do **último** item sai (`[&>*:last-child]:border-b-0` no pai): cada
linha carrega uma régua para separá-la da seguinte, e a última não tem seguinte.
No celular a sobra cai em espaço vazio e passa; no pop-up ela encosta na borda e
vira régua solta. A regra olha a POSIÇÃO, e quem sabe a posição é quem contém —
os filhos não são todos iguais — o primeiro e o último têm porte próprio.

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
2. **A entrada abre sob demanda** (`Linha` em `FichaAtividades.jsx`): fechada por
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

### A ficha de atividades (era Atividades, no ☰)
`components/FichaAtividades.jsx`. Vive em dois lugares: a **prévia aberta no
rodapé** e o **pop-up completo** que ela abre. **Não guarda histórico nenhum**:
lê os commits com `ghCommits` e desenha. A fonte da verdade continua sendo o
GitHub.

**Por que deixou de ser linha do tempo.** A tela anterior era uma coluna de
eventos com bolinha e fio — formato que serve para contar uma história, onde o
que importa é a ordem. Mas ninguém lê um histórico de coleção como história;
lê-se procurando: *quando foi que entrou isso?*, *o que eu mexi semana
passada?*, *subi aquelas capas ou não?*

Procurar precisa de **coluna fixa**, não de fluxo. A ficha de empréstimo da
contracapa de livro de biblioteca já é isso: datas carimbadas à esquerda, o
movimento à direita, uma linha por vez. O olho desce pela coluna e só entra na
linha quando a data interessa — o que a bolinha e o fio não permitiam, porque
ali a data vinha **depois** do texto, em letra miúda. E o app se chama
Gibiteca: a ficha é o objeto que uma biblioteca tem.

**O que foi mantido da tela antiga**, porque continuava certo:

- **o evento é a ação, não o item**: um envio com 5 mudanças é uma linha só,
  com as 5 aninhadas. Por obra, um dia de arrumação enterraria o resto;
- detalhe **fechado por padrão** (110 capas abertas enterravam o histórico);
- agrupado por período (Hoje · Ontem · Últimos 7 dias · Este ano · ano);
- **é leitura, não controle**: sem desfazer, sem botão por item.

#### O tipo precisou ser reconstruído na leitura

`compararColecoes` sabe a natureza de cada mudança (`{tipo, texto}`), mas **o
commit só leva o texto** — a mensagem tem de ser legível por um humano no
GitHub, e `[leitura] Marcou como lido` não é. O tipo se perde na escrita.

`classificar(texto)` (em `diario.js`) reconstrói o tipo a partir da frase. A
alternativa — carimbar o tipo na mensagem — foi descartada por dois motivos:

1. **funciona no histórico que já existe.** Carimbando, só os commits futuros
   seriam organizáveis, e tudo que já está no repositório de quem usa o app
   ficaria num balaio de "Outro" para sempre;
2. mantém a mensagem limpa no GitHub, que foi a razão de o diário existir.

Só se sustenta porque as frases são nossas: saem todas de `mudancasInternas` e
de `RESUMOS`, e o conjunto é fechado. **Mexer num verbo lá sem mexer nas regras
joga a linha em "Outro" sem nenhum erro aparecer** — por isso existe
`tools/conferir-movimentos.cjs`, que cobre as 55 frases que o diário sabe
escrever. Ele já pegou dois furos na primeira execução: `Mudou o país de …`
(a regra só previa `Mudou a`) e `Subiu para a nuvem a capa de …`, que tem ordem
de palavras diferente do resumo `Subiu 110 capas para a nuvem`.

```bash
node tools/conferir-movimentos.cjs
```

#### Sete movimentos, não quinze tipos

`MOVIMENTOS`: Entrou · Saiu · Estante · Leitura · Capa · Ficha · Valor · Outro.

Os quinze `tipo` do diário são a granularidade de **quem escreve a frase**.
"Mudou a editora" e "Mudou o país" são coisas diferentes para escrever e a
mesma coisa para procurar (*mexi na ficha dessa obra*). Quinze filtros não
organizam nada.

**Entrada de natureza mista não recebe etiqueta.** `movimentoDaEntrada`
devolve `null` quando a leva tem mais de um movimento, e a linha mostra a
contagem no lugar — uma leva com capa, leitura e valor junto **não é** nenhum
dos três, e etiquetar pelo primeiro faria a etiqueta mentir.

#### O filtro

Chips por movimento, com a contagem. **Conta entradas, não mudanças**: o número
tem de bater com o que o clique vai mostrar, e o clique mostra linhas. "Capa 2"
num histórico de 110 capas está certo — foram dois momentos em que se mexeu em
capa.

- **movimento sem nenhuma linha fica visível e apagado**, não some: sumindo, o
  número de alvos mudaria a cada recorte, e a mão aprende posição antes de
  rótulo. Mesma regra da cascata do painel de filtros;
- `aria-pressed`, não `aria-checked`: é interruptor, não opção de grupo;
- sob filtro a linha mostra **só os detalhes daquele movimento**, e a contagem
  passa a ser a filtrada;
- **abre sozinha até 12 detalhes.** Filtrar e depois ter de clicar em cada
  linha seria pedir o trabalho duas vezes — mas acima de uma dúzia a abertura
  automática reproduzia o enterramento que o fechado-por-padrão existe para
  evitar, só que dentro do recorte pedido justamente para enxergar melhor. A
  leva de 110 continua fechada, com o chevron, e as outras linhas de capa
  continuam na tela;
- o filtro **volta para "tudo" ao fechar** o painel: reabrir e achar a ficha
  recortada por uma escolha de três dias atrás é a tela mentindo.

#### Ela mora no rodapé, não no ☰

**A ficha saiu do menu.** No ☰ ela era uma porta como as outras, e ninguém abre
"Atividades" sem já estar procurando alguma coisa — quem não sabe que o app
registra o que você faz nunca vai procurar. O menu passou de nove portas a
oito.

No rodapé a ficha fica **aberta**, com as últimas cinco linhas escritas. Não
pede clique nenhum para informar; o clique é só para ver o resto.

**Ficha vazia não fala em nuvem.** Sem nada escrito, a prévia diz "Sua ficha
está limpa. Por enquanto." e o pop-up, "A ficha está limpa, nenhuma atividade
foi realizada ainda." Os dois textos valem tanto para quem não conectou quanto
para quem conectou e ainda não mexeu em nada — do lado de fora é a mesma
situação, e explicar o mecanismo levanta a dúvida que ele deveria acalmar.

**É um cartão claro sobre a faixa escura porque é um objeto, não uma seção.**
A ficha de empréstimo é uma coisa colada na contracapa: papel próprio, borda
própria, um pouco torta (−0,7°), com o recorte de meia-lua do bolso embaixo.
Uma lista desenhada direto sobre o #212121 seria mais uma parte do rodapé; o
cartão é algo que foi **posto** ali.

**A tinta volta ao normal dentro dele.** O rodapé inverte `--tinta` para papel,
então lá dentro `text-ink` é claro e `border-linha` é um fio claro — os dois
sumiriam num cartão de papel. A classe `.tinta-normal` devolve a rampa ao
escuro para essa ilha. É o mesmo mecanismo da inversão, usado ao contrário, e
é o que prova que a variável valeu a pena.

O recorte do bolso usa `var(--ink)` e **não** `bg-ink`: depois da inversão, o
token `ink` do Tailwind é papel ali dentro. O recorte precisa da cor da faixa,
que é a variável crua.

**O alvo de clique cobre o cartão inteiro**, como um `<button>` posicionado por
cima, em vez de o cartão ser um botão. Embrulhando a lista, o nome acessível do
botão viraria a emenda de cinco frases de histórico — ilegível para quem ouve.
Assim o nome é uma frase só e o alvo continua sendo o cartão todo.

#### O pop-up é o mesmo cartão, maior

Não é uma tela com outro desenho. Mesmo papel, mesmo cabeçalho em caixa alta
com a régua grossa embaixo, mesma coluna de datas em mono, mesmas pautas,
mesmo carimbo na mais recente. **Quem clica no cartão tem de reconhecer o que
abriu**, e a única maneira de reconhecer é ser a mesma coisa cabendo mais.

Daí `bg-paper` no lugar de `bg-surface` e canto reto: o cartão é uma folha, e
folha não tem canto redondo. O que a versão grande acrescenta é o que não cabia
na pequena — o filtro, a etiqueta de movimento em cada linha, o detalhe que
abre, a quebra de período.

**Duas coisas não vieram junto, e as duas por motivo:**

- **a inclinação.** O cartão do rodapé está torto porque está largado sobre a
  faixa. Este está sendo lido, de frente: texto longo torto cansa, e o giro
  brigaria com a rolagem;
- **o recorte do bolso.** Ele é o vazio por onde o cartão sai do bolso. Fora do
  bolso não há o que recortar — nem faixa escura atrás para a meia-lua mostrar.

**Os chips do filtro são de TINTA, não de acento.** O cartão só usa duas cores:
a tinta da escrita e o rust do carimbo. Um chip verde seria a única coisa da
ficha que não saiu nem da caneta nem do carimbo. Preenchido em tinta, o
escolhido lê pelo contraste — a mesma razão pela qual o carimbo lê como
carimbo.

#### O resto do rodapé saiu de cena

À esquerda ficaram só a marca (220px, grande), a frase e o copyright logo
abaixo dela. À direita, só a ficha. **Três coisas foram embora:**

- **os três números** (obras · séries/boxes · na estante). Já moram no painel
  de Estatísticas, que existe para isso; aqui eram resumo de resumo e
  disputavam atenção com a ficha — o rodapé ficava com dois centros;
- **o fio pontilhado** que atravessava o meio. Ele separava a assinatura da
  linha de copyright; com o copyright debaixo da frase não há mais duas coisas
  para separar, e fio que não divide nada é só um risco;
- **o "Voltar ao topo" escrito**, que virou a meia-lua.

#### A meia-lua do fim da página

Colada na borda de baixo, centrada, só com a seta dentro. **A forma rima com o
recorte do bolso da ficha, logo acima**: a mesma meia-lua, o mesmo gesto de
puxar. Ali ela é o vazio por onde o cartão sai; aqui, a aba por onde a página
volta. Duas metades do mesmo vocabulário — e por isso a segunda não precisa se
explicar.

Leva `.tinta-normal` pelo mesmo motivo do cartão: é uma peça de papel sobre a
faixa escura, e sem isso a seta seria clara sobre fundo claro.

**Fica no rodapé, não presa à viewport.** Botão flutuante acompanharia a
rolagem e brigaria com o "Nova obra", que já mora no canto. Aqui ela é o fim do
documento: você chega nela, não esbarra nela.

No hover a aba cresce 6px e a seta sobe junto — o botão inteiro faz o gesto que
a ação faz. O CSS da seta dupla antiga (`.seta-topo`) saiu do index.css junto
com o botão que a usava.

#### Mesma proporção, e um objeto só

**3:2 nos dois tamanhos.** Antes a prévia era um cartão largo e baixo e o
pop-up um painel alto; mesmo com o mesmo desenho por dentro, eram duas folhas
de formatos diferentes — e duas folhas de formatos diferentes nunca são a mesma
folha.

O número saiu da própria prévia: 380 de largura com cabeçalho, cinco linhas e o
rodapezinho dão 253 de altura, que é 3:2 com três pixels de erro. Foi só cravar
o que já estava lá e mandar o pop-up obedecer. **Medido: prévia 380×253
(1,502), pop-up 840×560 (1,500).**

A largura do pop-up tem **três tetos**: `94vw` para não encostar nas bordas,
`840px` para não virar uma folha gigante numa tela larga, e `132vh` — que é
`88vh × 1,5`. O terceiro existe porque limitar a ALTURA por `max-h` quebraria a
proporção em janela baixa: o cartão ficaria achatado justamente onde a
semelhança importa. Limitando a largura, a razão se mantém sempre.

No celular a folha ocupa a tela, como todos os painéis da casa: 3:2 em 375px
daria 235px de altura, pequeno demais para ler. A proporção vale da `sm` para
cima.

> As duas classes estão escritas por extenso (`aspect-[3/2]` e
> `sm:aspect-[3/2]`), nunca montadas com `sm:${…}`. O Tailwind varre o
> CÓDIGO-FONTE atrás de nomes de classe inteiros e não resolve template literal
> nenhum: interpolada, a variante `sm:` simplesmente não seria gerada.

**A transição é um `layoutId` só.** Quando o pop-up abre, a prévia DESMONTA e o
framer-motion leva o mesmo retângulo de lá para cá, crescendo. Não são dois
cartões: é um cartão que mudou de lugar e de tamanho, que é a única forma de a
tela contar que são a mesma ficha. Por isso a prévia precisa saber que o pop-up
está aberto (`aberta`, vinda do App pelo Footer) — as duas visíveis ao mesmo
tempo denunciam que são dois objetos.

O espaço da prévia fica reservado pelo quadro de fora, que mantém a proporção,
então o rodapé não pula quando ela sai. **A inclinação mora nesse quadro**, e
não no cartão animado: transform próprio num elemento com `layoutId` briga com
o transform que o framer-motion usa para animar. O giro é do bolso; a folha que
viaja está sempre reta.

#### Duas armadilhas de `layoutId`, as duas pagas

**1. `AnimatePresence` em volta da prévia segurava as duas na tela.** Embrulhada
nele, a prévia ficava montada esperando uma animação de saída que não existe — e
as duas fichas apareciam juntas, que é exatamente o que a transição existe para
evitar. Com `layoutId` o desmonte tem de ser seco: o pop-up registra o mesmo id,
lê a última posição conhecida da prévia e cresce de lá.

**2. O véu e o cartão tiveram de virar IRMÃOS.** Em todo outro pop-up da casa o
painel mora dentro do véu, e o clique fora fecha por comparação de alvo. Aqui
não dá: **elemento com `layoutId` dentro de um `AnimatePresence` trava a
saída**. Ao fechar, o `AnimatePresence` segurava o véu esperando o filho
terminar; o filho tinha uma animação de layout pendente contra a prévia, que
acabara de remontar reivindicando o mesmo id; a animação nunca resolvia e **o
véu ficava no DOM para sempre, invisível e por cima de tudo** — uma camada de
`z-index: 66` bloqueando a página inteira.

Separados, cada um faz uma coisa só: o véu entra e sai por opacidade dentro do
`AnimatePresence`; o cartão monta e desmonta seco, fora dele. Funciona nos dois
sentidos — abrindo, quem nasce é o pop-up e vem da prévia; fechando, quem nasce
é a prévia e vem do pop-up.

> **Medir isto no painel do Claude engana (mais uma vez).** Com a página em
> segundo plano o rAF congela, a animação de saída nunca completa e o
> `AnimatePresence` nunca desmonta — o véu parecia preso. Uma captura de tela
> força a pintura e o nó some. Conferido contra o pop-up de Tema, que tem o
> mesmo sintoma e nenhuma relação com esta mudança: era o painel, não o código.

#### A leitura é compartilhada (`lib/ficha.js`)

Dois lugares mostram a mesma ficha, e cada um buscando por conta própria daria
duas chamadas à API do GitHub por visita — com a segunda aparecendo como
espera, o pop-up abrindo vazio em cima de uma prévia que já tinha os dados.

`useFicha(cloud, ativo)` resolve com **cache de módulo** (precisa sobreviver à
desmontagem do pop-up, que é o caso em que serve) e validade de **um minuto** —
a ficha muda quando você sincroniza, e guardar por muito tempo faria o pop-up
esconder a alteração recém-feita.

Três armadilhas que custaram correção:

1. **A dependência é a CHAVE do repositório, não o objeto `cloud`.** O objeto é
   recriado a cada gravação de configuração da nuvem, e com ele na lista do
   `useEffect` qualquer sincronia disparava uma busca nova do histórico. Era
   assim no painel antigo.
2. **O estado nasce `carregando`, não vazio.** Começar parado fazia a prévia
   afirmar "Ficha nova, nenhum movimento ainda" no primeiro quadro, antes de o
   efeito rodar — mentira para quem tem histórico. Não ter lido não é o mesmo
   que não ter nada.
3. **A busca em voo fica guardada junto do resultado.** Cache de resultado
   sozinho não cumpre o que promete: dois consumidores que montam no mesmo
   quadro não acham resultado — a primeira busca ainda não voltou — e cada um
   dispara a sua. O `StrictMode` faz isso sozinho em desenvolvimento, o que
   tornou o problema visível: duas chamadas numa carga só. Guardando a
   promessa, o segundo entra de carona. **Medido: 1 busca por carga.**

`esquecerFicha()` joga o guardado fora, para quem acabar de gravar na nuvem não
receber a ficha de antes da gravação.

#### Por que não `IntersectionObserver`

A primeira versão da prévia só buscava quando o rodapé entrava na tela, para
economizar a chamada nas visitas que nunca descem até lá. Saiu por dois
motivos, e o segundo é o que decide:

1. uma chamada autenticada, assíncrona, contra um limite de 5000 por hora não é
   economia que pague o risco;
2. **enquanto o observador não dispara não há como distinguir "ainda não li" de
   "não há nada"** — e um observador que nunca dispare (aba em segundo plano,
   página não pintada) deixa a afirmação falsa na tela para sempre. Foi
   exatamente o que aconteceu ao testar no painel do Claude, onde a página roda
   sem ser pintada e nada intersecta.

#### O carimbo

Só na entrada **mais recente**. Uma ficha de biblioteca tem muitos carimbos,
mas aqui ele não registra o movimento — a linha já faz isso. Ele diz **onde
você está**. Dois carimbos e ele deixa de dizer qualquer coisa.

`rotate` e não `skew`: carimbo de mão sai torto girando, não entortando.

#### Detalhes de layout que custaram uma decisão

- **a quebra de período mora na coluna da data**, não flutuando por cima da
  lista: assim a coluna continua sendo uma coluna de tempo de cima a baixo, e
  o olho que desce por ela não sai do lugar para saber onde está;
- essa coluna é `minmax(88px,auto)`, não `88px` cravado — "Últimos 7 dias"
  quebrava em duas linhas. O rótulo curto alinha com as datas, o comprido
  empurra a régua, que tem folga de sobra;
- **a data em duas linhas**, montada à mão: `toLocaleDateString` em pt-BR
  devolve "19 de out." — três palavras numa coluna estreita;
- **todas as etiquetas na mesma tinta.** Oito cores fariam a ficha parecer um
  gráfico; a organização vem da coluna e do filtro, não de um código de cores
  que ninguém decora.

`lerMensagem` continua aceitando as mensagens antigas ("Atualiza coleção — …"):
viram uma linha sem detalhe, classificada como **Outro**, em vez de sumirem.

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

**A capa muda a cada abertura, e a lista É A PASTA `src/assets/capas/`.** Para
acrescentar uma capa, ponha os dois arquivos lá: não se escreve nada no código.
Quem lê a pasta é um `import.meta.glob` no topo do `Welcome.jsx`, na hora de
compilar — e como o GitHub Actions recompila a cada push, subir a arte já
publica a capa. Qualquer nome, qualquer formato que o navegador abra: a pasta
guarda NOMES, não um padrão de numeração, para não obrigar ninguém a renomear
arte.

**Por que em `src/assets/` e não em `public/`.** Site estático não responde "o
que tem nessa pasta?": o que está em `public/` chega ao navegador como arquivos
soltos, sem índice, e em tempo de execução não há como descobrir uma capa nova.
Daria para gerar um manifesto JSON, mas ele seria uma requisição a mais *antes*
de o navegador saber qual imagem buscar, e essa imagem é a coisa mais pesada e
mais importante da tela. Lida na compilação, a lista já vem no bundle, e o
download da capa começa no primeiro render.

`import.meta.glob` com `eager` **não embute imagem em JavaScript**: ele troca
cada arquivo por um endereço, uma linha de texto. O que entra no bundle são
quatro endereços, não quatro fotos.

**Só UMA é baixada por visita**, nunca a soma — as outras o navegador nem sabe
que existem.

**Cada capa tem DUAS versões: celular e desktop.** Nenhuma das duas se escreve
em lugar nenhum: a de celular é o mesmo nome com **`-m` antes da extensão**,
igual ao par `divisoria` / `divisoria-m` do rodapé, e o par se monta sozinho na
compilação:

```
moore.alan.jpg     ->  moore.alan-m.jpg
hurlant.metal.jpg  ->  hurlant.metal-m.jpg
```

Convenção, e não um par escrito à mão (`{d: ..., m: ...}`): toda capa TEM as
duas versões, e um campo que nunca varia é um campo que só serve para ser
esquecido. O `-m` entra por `lastIndexOf('.')`, não por `split('.')` — os
nomes têm ponto no meio, e quebrar no primeiro daria `moore-m.alan.jpg`.

Faltando o `-m` na pasta, nada quebra: a capa entra na lista com `m: null` e no
celular vai a de desktop — mais peso do que devia, mas a imagem certa. As
versões `-m` também não viram capa própria no sorteio: elas entram pelo par.

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
| a versão `-m` não abriu | fica a de desktop: mais pesada num telefone, mas é a capa certa |
| a capa inteira | tenta outra capa |
| todas as capas | papel com o logo e o botão |

Quem diz qual arquivo falhou é o `currentSrc`, que traz o endereço que o
`<picture>` escolheu de verdade — no celular ele não é o `src`. O `-m`
**ausente** não chega ao primeiro degrau: a pasta é lida na compilação, e sem o
arquivo o `<source>` nem é escrito. O degrau cobre o arquivo que existe e não
abre — envio truncado, arte corrompida.

O conjunto de capas sem celular mora em ESTADO (muda o que se desenha: o
`<source>` some); o de capas mortas mora num ref (não desenha nada, e em
estado só custaria um render a mais).

Conferido no servidor de desenvolvimento: a 1024 vem a de desktop, a 375 vem a
`-m`. Com o `-m` fora da pasta não existe `<source>` nenhum, e a de desktop vai
sem requisição perdida — antes a capa pedia o arquivo inexistente, levava 404 e
só então trocava.

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
falhar ficou mais provável (basta uma arte que não abre), e por isso a queda ganhou os degraus da tabela acima.

**O sorteio mora em `useState`, não em variável de módulo**: módulo roda uma
vez por carregamento de página, e voltar à abertura dentro da mesma sessão
traria sempre a mesma capa. E a GRAVAÇÃO mora num efeito, não no sorteio — em
modo estrito o React roda o inicializador de estado duas vezes e fica com o
primeiro resultado; gravando ali, o registro guardaria a capa descartada e a
visita seguinte evitaria a imagem errada.

**Os arquivos não perdem nada no caminho.** O Vite copia a imagem de
`src/assets/` para o `dist/assets/` sem reencodar — o projeto não tem plugin de
imagem, `sharp` nem `imagemin` —, só acrescentando um sufixo ao nome
(`ale.jodo.jpg` → `ale.jodo-CIqVlGDr.jpg`). O sufixo é de graça e ainda resolve
um problema que `public/` tinha: trocar a arte mantendo o nome deixava quem já
visitou vendo a antiga, de cache. O que chega ao navegador é exatamente o que se
pôs lá. (O que segue em `public/` continua indo byte a byte para a raiz do
`dist/` — conferido com `md5sum` e `cmp`.)

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
produção já saía certo (a tinta a 10%) enquanto a tela mentia.

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
| Voltar ao topo | a meia-lua cresce e a seta sobe com ela | `height` + `translateY` no `group-hover` |
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

### O país saiu do app
Havia um campo **País de origem** no editor, um filtro por país, uma
ordenação por país, um gráfico "Por país" nas estatísticas e um selo na
ficha. **Todos saíram.**

O motivo: o país pedia um dado que quase nunca mudava a decisão de ninguém e
que **se confundia com a origem da edição**, logo ao lado. Um mangá é japonês
e sai em edição nacional; as duas respostas na mesma tela faziam pensar que
uma estava errada.

O que foi tirado, arquivo por arquivo:

| onde | o quê |
|---|---|
| `Editor.jsx` | o campo e a lista de sugestões |
| `DetailSheet.jsx` | os selos de país |
| `FiltersDrawer.jsx` | o filtro e a opção de ordenar |
| `Stats.jsx` | o gráfico "Por país" |
| `helpers.js` | `paisesOf`, o ramo do filtro, o caso da ordenação e o país na busca |
| `store.jsx` / `App.jsx` | `pais` da lista de filtros |

#### O dado NÃO foi apagado

O `pais` continua gravado em cada obra, e o editor continua carregando e
devolvendo o valor **sem mostrar campo nenhum**. Tirá-lo do `save` faria a
primeira edição de cada obra antiga apagar, em silêncio, um dado que ninguém
pediu para apagar. Invisível não é o mesmo que morto — e se um dia o país
voltar, ele está lá. Conferido: salvando "Cidade de Vidro" pelo editor, o
`localStorage` manteve `pais: "Estados Unidos"`.

**O `diario.js` também ficou intacto de propósito.** Ele ainda sabe escrever
e classificar "Mudou o país de …" — não porque isso vá acontecer de novo, mas
porque o histórico JÁ GRAVADO no repositório tem essas linhas, e tirar a
regra jogaria todas elas em "Outro".

> **Uma armadilha que o build não pega.** Apagar o `const byPais = {}` e
> esquecer o `topPais: top(byPais)` três linhas abaixo compila sem reclamar —
> é JavaScript válido — e explode em `ReferenceError` na hora de abrir as
> Estatísticas. Depois de remover um campo transversal, vale procurar o nome
> dele no arquivo inteiro, não só onde a remoção pareceu acabar.



### A fila de leitura
Uma lista **ordenada** do que se pretende ler. Não é filtro nem marcador: a
coleção já diz o que você tem e o que já leu; a fila diz **o que vem a
seguir**, e essa ordem é escolhida a dedo, arrastando.

Abre pelo ☰ (primeira linha, antes de Estatísticas: é o que se consulta no
dia, não o que se olha de vez em quando). Gaveta à direita no desktop, tela
cheia no celular — a mesma casca dos Filtros, `w-[min(440px,100%)]`: num
telefone de 375px o `min` já entrega a largura toda, sem um segundo layout.
Medido a 375px: gaveta de 375, sem rolagem lateral.

**A linha mostra QUATRO coisas e nada mais:** capa, título, editora e autor.
Sem selos, nota, valor ou progresso. A coleção é onde se consulta; aqui a
pergunta é só "o que eu leio agora", e cada dado a mais é uma chance de parar
para ler a linha em vez de ler o gibi.

**ORDEM É O CONTEÚDO.** A fila não se ordena por nada — nem nome, nem data.
Qualquer ordenação automática apagaria a única informação que ela guarda.

#### A entrada: `{ id, vol }`
`id` é a obra; `vol` é o **índice** do volume dentro dela, ou `null` para obra
avulsa.

Índice, e não o nome do volume: nome se repete ("Vol. 1" em duas séries), se
edita, e às vezes nem existe. O índice é o que `volsOf` já usa em todo o resto
do app — `unitsOf`, `missingVols`, a grade do detalhe —, e inventar uma segunda
forma de apontar para um volume criaria duas verdades.

**O preço, que é real:** apagar um volume do meio de uma série pelo Editor
empurra os índices seguintes, e uma entrada que apontava para o volume 3 passa
a apontar para o que era o 4. Não há como o store perceber — o Editor devolve
o array de volumes inteiro, sem dizer o que saiu. Fica anotado porque é o tipo
de coisa que, quando acontecer, ninguém vai ligar à causa.

#### Onde se põe na fila
`BotaoFila`, em `DetailSheet.jsx`, um só componente para os dois lugares:
botão de largura inteira na obra **avulsa** (abaixo do link do Guia) e ícone de
marcador ao lado do selo em **cada volume**. É o mesmo gesto, e dois desenhos
fariam parecer duas coisas. Alterna: já está na fila, tira.

**Série não entra inteira.** Numa série a fila é por VOLUME — pôr "a série" na
fila não diria o que ler hoje, que é a única pergunta que a fila responde.

**O botão não aparece no que já foi lido NEM no que você não tem.** Ver
"Só entra na fila o que você TEM", abaixo.

**O índice que vai para a fila é o da OBRA, não o da lista da tela.** Com o
filtro em "Tenho", `volumes` no DetailSheet é um recorte de `unitsForStatus`, e
o 2º da tela pode ser o 5º da série. Como `unitsForStatus` filtra o array de
`volsOf` sem copiar os objetos, `todosOsVolumes.indexOf(v)` devolve o índice
verdadeiro. Sem isso a fila apontaria para o volume errado sempre que houvesse
filtro ligado — e o erro só apareceria depois, com o filtro desligado.


#### Só entra na fila o que você TEM
A fila responde "o que leio a seguir", e não se lê o que ainda não chegou — um
volume de desejo ali seria um plano, não uma leitura. Quem guarda plano de
compra é o status "quero" e as listas.

A trava também fecha um buraco do modelo: `lido` e `nota` só existem para o
que está na estante (o Editor apaga os dois ao salvar um item de desejo).
Deixar um "quero" entrar levaria, no fim, a marcar lido uma coisa que o
próprio Editor desmarcaria depois.

`podeEnfileirar(u)` = está na estante **e** ainda não foi lido. Uma função só,
chamada por três lugares — o botão do detalhe, a poda do store e o filtro da
tela da fila. Separadas, cada uma teria a sua ideia de quem pertence à fila, e
a divergência só apareceria num aparelho.

**O botão some, não fica apagado.** É o mesmo tratamento do que já foi lido, e
o projeto esconde em vez de desabilitar. O custo é que a ausência não se
explica sozinha — por isso a tela vazia da fila **diz a regra** em voz alta.
Se um dia a dúvida aparecer, o caminho é um botão desabilitado com o motivo no
`title`, não um aviso solto.

`marcarLido` ainda promove para a estante o que estiver em "quero". Virou
cinto de segurança, não caminho normal: só o que está na estante entra na
fila, então não deveria haver "quero" lá. Mas uma fila guardada ANTES desta
trava — ou vinda da nuvem de um aparelho mais antigo — pode ter.

#### A linha da fila: capa retrato e o que ajuda a escolher
A capa é **retrato** (52×70), não quadrada. Capa de gibi é mais alta que larga,
e na caixa quadrada de antes o desenho ficava pequeno no meio de duas faixas
vazias.

Além de título, editora e autor, a linha mostra **o formato da edição** e
**Importado** — o que ajuda a escolher o próximo. Não há nota nem valor: nota o
item ainda não tem (é justamente o que falta ler) e valor é assunto da coleção.

**O × de tirar da fila é vermelho, com anel próprio.** É a única ação da linha
que desfaz alguma coisa, e o `rust` (#9C4A2E) é a cor que o projeto já usa
para isso — urgente no cartão, excluir volume no Editor. O anel vale **sempre**,
não só no hover: num toque não existe hover, e o aviso tem de estar lá antes do
dedo. O × da galeria de listas seguiu o mesmo tratamento.

#### Marcar lido
Clicar em **Lido** abre o pop-up da nota (mesmo molde do Backup e do Tema) e
**tira da fila**. Sair da fila não é efeito colateral: é o fim do ciclo.

Fechar o pop-up pelo × marca lido do mesmo jeito, sem nota — o clique em
"Lido" já foi a decisão, e o pop-up só oferece a nota. Marcar no fechar, e não
no clique, mantém **uma** gravação em vez de duas seguidas.

O pop-up mora FORA da gaveta (`z-70` contra `z-50`) e guarda o próprio texto,
título e parte, em vez de apontar para a entrada: a linha sai no mesmo
instante, e um pop-up dentro dela sairia junto antes de alguém dar a nota.

**Marcar lido PROMOVE para a estante** (`status: 'biblioteca'`) o que estava em
"quero", e zera a urgência. Não é liberdade: neste app `lido` e `nota` só
existem para o que está na estante — o Editor apaga os dois ao salvar um item
de desejo (ver `save` em `Editor.jsx`). Sem isso, marcar lido aqui duraria até
a próxima edição daquela obra e sumiria sozinho, que é o pior dos dois mundos.

#### Tudo se conversa
Três coisas tiram da fila sem ninguém pedir, e as três são a mesma regra: uma
entrada só vale enquanto aponta para algo que **existe** e **ainda não foi
lido**.

| o que acontece | quem limpa |
|---|---|
| marcar lido pelo Editor | `podarFila` dentro de `upsertObra` |
| tirar da estante pelo Editor ("tenho" → "quero") | `podarFila`, pela mesma regra |
| apagar a obra | `podarFila` dentro de `deleteObra` |
| desmembrar a série (volumes viram obras com ids novos) | `podarFila` dentro de `desmembrarObra` |
| coleção que chegou da nuvem ou de arquivo com entrada já lida | o filtro de leitura, na tela |

`podarFila` roda **de dentro do `setObras`**, sobre a lista já atualizada: fora
dela o `obras` do render ainda é a coleção de antes, e a poda decidiria pelo
estado errado. Quando nada muda, ela devolve a **mesma referência** de lista,
para não disparar uma gravação à toa.

`podarFila` tem de ser declarada **acima** de quem a usa. Ela entra em array de
dependência de `useCallback`, que é avaliado no render: definida depois, cai na
zona morta do `const` e o app quebra ao montar — e o **build passa**, porque é
erro de execução, não de sintaxe. Aconteceu nesta implementação.

#### A tela filtra, o arquivo guarda
A lista mostrada descarta entrada morta e entrada já lida; a guardada só é
reescrita quando alguma ação a reescreve. Por isso **o Reorder recebe a lista
VIVA, não a guardada**: com uma entrada morta, `fila` teria 3 itens e a tela 2,
e o arrasto reordenaria uma lista que ninguém vê, devolvendo a ordem errada.
Passando as vivas, o primeiro arrasto também grava a limpeza.

#### Arrasto
`Reorder.Group` / `Reorder.Item` do framer-motion. O arrasto começa pelo
**punho**, não pela linha (`dragListener={false}` + `dragControls`): a linha
tem dois botões, e arrastar de qualquer ponto faria todo toque hesitante virar
um arraste de dois pixels que come o clique.

O arrasto da **gaveta** sai só do cabeçalho, pelo mesmo motivo invertido: as
duas coisas competindo pelo mesmo gesto fariam um reordenar fechar a gaveta.

`select-none` na linha: arrastar selecionava o texto dela, e o que acompanhava
o dedo era um bloco azul de seleção em vez da linha. Apareceu no primeiro
arrasto de teste.

#### Persistência
A fila mora **dentro de `gibiteca_v1`**, junto das obras — e não numa chave
própria como `gibiteca_fixada`. A diferença é o que se perde ao perder: a
fixada é um enfeite da grade, se refaz num clique; a fila é trabalho, e
trabalho vai junto no backup e na nuvem.

Vai também no **arquivo exportado** (`baixarBackup(obras, editoras, fila)`).
Sem isso o backup não ficaria "sem fila": restaurado, ficaria com fila VAZIA,
porque `applyData` zera a fila de um arquivo que não a traz — e a ordem
escolhida a dedo sumiria sem aviso.

Leitura sempre defensiva: arquivo sem `fila` (backup anterior a este recurso)
vira fila vazia, nunca `undefined`.


### As listas
Pastas feitas à mão: "Para reler", "Emprestados", "Comprar na bienal". Uma obra
pode estar em **várias**, e estar numa lista **não muda nada sobre ela** — não
é status, não é filtro, não é fila. É arrumação.

Abre pelo ☰ → **Listas**, logo depois da Fila: as duas são organização
pessoal, e ficam juntas antes das Estatísticas, que é consulta.

#### A forma: `{ id, nome, obras: [idDaObra] }`
Guarda só o **id**, nunca a obra: a obra pode ser editada depois, e uma cópia
dentro da lista envelheceria em silêncio — a capa trocada no cadastro não
apareceria aqui.

**Obra inteira, não volume.** Diferente da fila, que é por volume porque
responde "o que leio hoje". Uma lista responde "onde isto está guardado", e
essa pergunta é sobre a obra.

A ORDEM do array é a ordem de entrada: quem chega depois vai para o fim. Ao
contrário da fila, essa ordem não é o conteúdo — é só previsibilidade.

#### Uma gaveta, dois níveis
Índice das listas e, ao abrir uma, a **galeria** dela. Não são duas gavetas
empilhadas: a gaveta é a mesma, o conteúdo troca, e o cabeçalho ganha uma seta
de voltar — que só existe no segundo nível, porque no índice seria um botão
morto. Duas gavetas sobrepostas dariam dois véus, dois arrastos e duas formas
de fechar.

Mesma casca da Fila e dos Filtros (`w-[min(440px,100%)]`). Medido a 375px:
gaveta de 375, sem rolagem lateral.

**A galeria é capa + título, e nada mais** — foi o pedido, e é o que basta: na
estante a pessoa reconhece a obra pela capa muito antes do nome. O × de tirar
da lista fica NA capa, no canto: numa galeria sem linhas não há outra âncora, e
um botão embaixo do título empurraria as células para alturas diferentes.


#### A prévia: tira de capas no índice
Abaixo do nome e da contagem, cada lista mostra as **capas das obras em
linha**. Quando não cabem, a tira vira carrossel que se arrasta.

**Seis capas por vez**, e as outras rolando. O TAMANHO sai de uma conta, não
de um número escolhido: cada capa vale um sexto do que sobra depois dos cinco
vãos entre elas (`flex: 0 0 calc((100% - 2.5rem) / 6)`, em `.tira-capas > *`).
Assim as seis enchem a tira exatamente, na gaveta de 440px do desktop e na
tela cheia do celular, sem um segundo valor para manter em sincronia.

O `2.5rem` é 5 × o `gap` da tira. **Mexeu no gap, mexe aqui** — é o único par
de números desse bloco que precisa andar junto, e por isso os dois estão a
seis linhas de distância.

A caixa da capa **não tem tamanho em classe**. Fixar em Tailwind faria dois
lugares decidirem o mesmo, e o da tira ganharia só às vezes.

Antes a tira enchia com quantas coubessem: oito capas de 44px numa gaveta de
440. Cabiam mais, e cada uma dizia menos. Medido depois da troca: 59,8px por
capa no desktop e 49px a 375 — **exatamente 6 nos dois**, com as 12 rolando.

CONSEQUÊNCIA A LEMBRAR: com seis enchendo a tira certinha, sumiu a capa
cortada na borda, que era o aviso de "tem mais à direita". Hoje quem avisa é
a contagem logo acima ("12 obras") e o cursor de mão. Se um dia faltar, o
caminho é um esmaecido na borda direita — não tirar a sexta capa.

**A barra de rolagem fica escondida** (`.tira-capas`, no index.css). A barra
do projeto tem 10px com anel de 2px: embaixo de uma tira de 44px ela comeria
um quarto da altura e roubaria a atenção das capas, que são o conteúdo. Quem
avisa que há mais à direita é a capa cortada na borda — o sinal que carrossel
sempre deu.

**O dedo rola nativo; o mouse arrasta por JS.** Numa tela de computador
`overflow-x` só rola com roda horizontal ou barra, e a barra está escondida.
Daí o arrasto por ponteiro em `TiraDeCapas`. No toque o handler sai do caminho
(`pointerType === 'touch'`), porque o nativo faz melhor — com inércia.

`setPointerCapture` não é detalhe: sem ele, soltar o mouse fora da tira — o
que acontece sempre que se arrasta com força — deixaria o arrasto ligado, e a
tira seguiria o cursor depois do gesto.

**Arrastou não é clique.** A tira abre a lista ao ser clicada, mas só quando o
ponteiro andou menos de 5px. Sem essa trava todo arrasto terminaria abrindo a
lista, e 4px de tremor de mão bastariam. Medido: arrasto de 200px rolou a tira
até o fim e **não** abriu; clique parado abriu.

**A linha do índice deixou de ser um botão só.** A tira tem de ficar FORA do
botão do título: dentro, o arrasto dela e o clique do botão disputariam o
mesmo gesto. E a tira é `aria-hidden`: as capas repetiriam, uma a uma, nomes
que a linha de cima já disse — quem abre a lista para o teclado e o leitor de
tela é o botão do título.

`overscroll-behavior-x: contain`: sem isto, chegar ao fim da tira passa a
rolagem para a gaveta atrás, e arrastar capas fecharia a lista no celular,
onde o gesto horizontal é o de voltar.


#### Ordem: alfabética ou numerada
Duas ordens, escolhidas **no pop-up de editar a lista**, junto do nome. Não na
galeria: é um ajuste que se toma uma vez, e exposto sobre as capas virava um
botão permanente para uma decisão que não se repete.

| | o que faz |
|---|---|
| **ABC · Alfabética** | as obras aparecem em ordem de nome, calculada na hora |
| **123 · Numerada** | a ordem guardada, numerada, e **arrastável** |

São **duas opções lado a lado**, não um interruptor de liga/desliga:
alfabética não é "numerada desligada", é outra ordem. Um interruptor diria que
uma delas é a ausência da outra.

As siglas vão em `font-mono` porque ali os três sinais têm largura igual: em
fonte proporcional o "1" é estreito, o bloco "123" fica menor que o "ABC" e os
dois lados do seletor desalinham.

**A alfabética não é gravada.** Ela se calcula na tela, com o colator do
projeto (`sortList`, então "é" vale "e"). Gravar apagaria a ordem montada à
mão, e voltar para numerada devolveria uma lista remexida. Medido: ordem
`[1,3,4,5,2,6]` sobrevive à ida e volta por alfabética, idêntica.

##### O arrasto na grade NÃO usa `Reorder`
O `Reorder` do framer-motion ordena por **um eixo só**. Numa grade de três
colunas isso quebra no caso mais óbvio: arrastar da coluna 1 para a 2 na mesma
linha não muda o Y, e nada acontece.

Aqui o arrasto é o `drag` comum, e quem decide o destino é a **geometria**: ao
soltar, mede-se a caixa de cada célula e procura-se qual contém o ponto do
ponteiro. Funciona em qualquer número de colunas, no mouse e no dedo. Medido:
troca na mesma linha (1↔2) e entre linhas (2→5), as duas gravadas.

`dragSnapToOrigin`: a célula volta sozinha ao lugar e quem a move é a
reordenação do estado, não a posição onde o arrasto parou. Soltar fora de
qualquer célula não faz nada — desistir de um arrasto não pode bagunçar nada.

**PULAR A PRÓPRIA CÉLULA não é detalhe, é o defeito que isto custou.** Ao
soltar, a célula arrastada ainda está sobre o ponto da soltura (o snap só a
devolve depois), então ela encontrava **a si mesma**, `alvo === de`, e o
arrasto não fazia nada. Os dois primeiros testes falharam calados por causa
disso — só uma sonda em `onDragStart`/`onDragEnd` mostrou que o gesto
disparava e a conta é que desistia.

Nota de medição: **eventos de ponteiro sintéticos não acionam o `drag` do
framer-motion**. O teste tem de ser arrasto de verdade. E o painel do navegador
escala a captura (frame de 800 para uma viewport de 1024), então converta as
coordenadas antes de arrastar — ou vai se arrastar no lugar errado.


#### Duplo clique abre o editor
Vale na **galeria de uma lista** e na **fila de leitura**. Das duas, o alvo é a
obra — capa e texto —, nunca os botões: duplo clique em "Lido" não pode marcar
lido e abrir o editor na mesma batida.

**Clique simples continua sem fazer nada** nesses alvos, e isso é o que torna o
duplo clique seguro. Dar duas funções ao mesmo alvo faria quem quer tirar da
lista cair no editor.

Duplo clique não tem aparência: o `title` de cada alvo diz o atalho, senão
ninguém descobre.

**As gavetas NÃO fecham.** O Editor é `z-60` e as gavetas `z-50`, então ele
vem por cima com o próprio véu; ao salvar ou cancelar, a pessoa volta para a
lista onde estava em vez de cair na estante. Por isso o App liga
`onEditar={setEditor}` direto, e não o `openEditor`, que fecha o Detalhe.

#### Os dois botões de acrescentar
**"Nova lista" é um + flutuante**, no canto de baixo à direita da gaveta. Só o
sinal, sem palavra: no índice não há outra coisa para criar, e a cruz num canto
de baixo é o gesto que todo app usa para "mais um". O nome vive no `aria-label`
e no `title`, que é onde ele serve — para quem ouve e para quem para o cursor.

Sair do fluxo não foi só mudar de lugar: **dentro da área que rola, o botão
descia junto com as listas** e sumia justamente quando havia listas demais
para chegar ao fim. Por isso o conteúdo do índice ganhou `pb-24` — sem a folga
a última lista ficaria para sempre debaixo do botão.

`absolute`, não `fixed`: a âncora é a GAVETA, não a janela. Em `fixed` ele
ficaria na tela com a gaveta fechada e cairia por cima do "Nova obra" da
coleção. Medido: 20px da direita e 20px de baixo da gaveta, nos dois tamanhos.

**Só no índice.** No segundo nível quem acrescenta é **"+ Adicionar obras"**,
no fluxo, com o mesmo desenho de + num tamanho menor. Dois botões de + na mesma
tela — um flutuando, outro no fluxo — significariam coisas diferentes com o
mesmo símbolo, e por isso nunca aparecem juntos.

`IconMais` é um componente só para os dois, porque é um só verbo. O que muda é
o tamanho (`w-6` no flutuante, `w-[15px]` no de fluxo).

#### Escolher obras: grade, não caixinhas
`EscolherObras` serve dois lugares — o pop-up de criar e o "Pôr obras nesta
lista" — com busca por nome e editora (`gNorm`, então acento não conta).

É **grade de capas**, não lista de checkboxes: a obra se reconhece pela capa
antes do título, e numa coleção de centenas é isso que faz achar sem procurar.
O marcado é o próprio cartão que se acende, com o visto DENTRO da moldura —
fora dela, numa grade apertada, ele encostaria no cartão vizinho e a pessoa
leria o visto do outro.

Diferença entre os dois lugares, e é de propósito: no pop-up de **criar** a
escolha é um rascunho que só vale no "Criar lista"; em **pôr obras numa lista
que já existe**, cada toque já grava. Guardar um rascunho ali criaria um estado
que some se a gaveta fechar.

#### O botão no Editor
Campo **Listas** no fim da seção Cadastro: um **ícone só** — a pasta do menu
☰ com um `+` — e, ao lado, quantas listas a obra já tem ("em 2 listas").
Clicar abre um pop-up com as listas para marcar.

Antes o campo era a lista INTEIRA, em pastilhas. Com três listas cabia; com
quinze, o cadastro virava uma parede de nomes antes do primeiro campo de
verdade. O formulário mostra a porta, e a escolha acontece atrás dela.

O número **fica fora do ícone**, não dentro: um ícone sozinho não diz se a obra
já está em alguma lista, e abrir o pop-up só para descobrir isso seria uma
porta a mais para uma informação de uma palavra.

No pop-up as listas são **linhas de largura inteira**, não pastilhas: nome de
lista é texto livre e pode ser longo. Em pastilha ele quebraria a grade; em
linha, quebra dentro da própria linha. Medido a 375px com um nome de 44
caracteres: quebra em duas linhas, sem rolagem lateral.

O pop-up é `z-80` porque o Editor é `z-60` — e vive FORA da `AnimatePresence`
do Editor, senão herdaria a moldura dele.

**A escolha grava no SALVAR**, como todo o resto do formulário; o botão do
pop-up diz "Pronto", não "Salvar", justamente porque ali nada foi gravado
ainda. É o que permite o mesmo controle servir à obra NOVA: ela ainda não tem
id, e só depois de `upsertObra` existe um `rec.id` para pôr nas listas — por
isso `definirListasDaObra(rec.id, d.listas)` vem **depois** do upsert.

Medido: marcar e desmarcar no pop-up + Salvar reescreve as listas certas;
**Cancelar não aplica nada**; e uma obra nova criada já marcada entra na lista
depois de ganhar o id.

**O rascunho é montado em dois passos.** A obra não guarda em que listas está
— quem guarda são as listas —, então `draftFromObra` não enxerga isso. O efeito
que abre o Editor completa o rascunho com `listasDaObra(listas, id)`.

`listas` fica **fora das dependências** desse efeito de propósito: mexer numa
lista com o Editor aberto não pode reconstruir o rascunho e apagar o que foi
digitado.

`definirListasDaObra` aplica o conjunto FINAL de uma vez, em vez de um
`alternarNaLista` por lista. Duas razões: várias passadas gravariam várias
vezes e dispariam vários envios para a nuvem; e remover de onde saiu é tão
importante quanto pôr onde entrou — sem isso, desmarcar no Editor não
desmarcaria nada.

#### Tudo se conversa
| o que acontece | o que as listas fazem |
|---|---|
| apagar a obra | sai de todas as listas (`podarListas`) |
| **desmembrar a série** | os volumes **herdam o lugar dela**, na mesma posição (`trocarNasListas`) |
| apagar a lista | as obras **ficam** na coleção |
| id que não resolve | descartado na leitura (`obrasDaLista`) |

**O desmembrar herda em vez de podar**, e essa foi a decisão mais pesada aqui.
Podar seria perda silenciosa: a série estava em "Para reler" e sumiria de lá
sem ninguém mexer na lista. Os volumes agora são obras de verdade, e são eles
que tomam o lugar. Sim, uma entrada vira N — mas isso se **vê** na galeria, e
ver é melhor que descobrir a falta meses depois. Medido: lista `[2,5,1]` com a
série no fim virou `[2,5,6,7]` depois de desmembrar.

**Apagar a lista não toca nas obras**, e o `confirm` diz isso em voz alta: sem
essa frase, apagar uma lista de 40 itens parece apagar 40 obras.

`podarListas` e `trocarNasListas` têm de ser declaradas **acima** de
`deleteObra` e `desmembrarObra`: entram em array de dependência de
`useCallback`, que roda no render, e definidas depois caem na zona morta do
`const` — o app quebra ao montar e **o build passa**, porque é erro de
execução. Mesma armadilha do `podarFila`.

#### Persistência
Dentro de `gibiteca_v1`, ao lado de `obras` e `fila`, e no arquivo exportado
(`baixarBackup(obras, editoras, fila, listas)`). Mesmo motivo da fila: é
trabalho, e `applyData` zera o que o arquivo não traz — um backup sem `listas`
não ficaria "sem listas", apagaria as que existem ao ser restaurado.

Id de lista **não se recicla**: o Editor guarda, enquanto está aberto, a quais
listas a obra vai entrar, e um id reaproveitado faria esse rascunho apontar
para a lista errada.

#### Uma arte por tema, todas no DOM
`MarcaAlt.jsx` carrega as **quatro** artes; quem mostra a do tema em uso e
esconde as outras é o CSS.

**Escondidas por padrão e reveladas por regra**, não o contrário. A lista
antiga mostrava a do Moss e escondia a do Nockout — isso só fecha com dois
temas. Com quatro, cada tema novo exigiria lembrar de escondê-lo em todos os
outros, e esquecer um faria **duas marcas empilhadas no mesmo lugar**, sem erro
nenhum no console. Medido nos quatro: exatamente uma visível em cada.

O Moss entra pelo `:root:not([data-tema])` porque ele é o padrão e o store NÃO
escreve atributo para o padrão. O seletor com o nome fica junto mesmo assim,
para a regra não quebrar se o padrão mudar.

##### O viewBox é o CONTORNO, não a prancha
A marca preenche a caixa do logo, então vão guardado no viewBox vira vão na
tela — a arte apareceria pequena, cercada de nada.

As artes do Candy e do Midnight chegaram com a prancha inteira do editor
(`0 0 4000 1080`). O contorno real saiu de `getBBox()` no navegador e foi
gravado no arquivo:

| arte | prancha | contorno |
|---|---|---|
| candy | `0 0 4000 1080` | `738.06 255.35 2538.95 661.66` |
| midnight | `0 0 4000 1080` | `769.8 228.22 2467.2 609.83` |

O gerador **avisa** quando o viewBox parece a prancha (começa em `0 0` e é
grande nos dois eixos), mas não corrige: corrigir pediria um interpretador de
`path`, e o número certo sai em um comando no navegador. A receita está no
cabeçalho de `tools/gerar-marca-alt.cjs`.

As proporções diferem bastante entre as artes (moss 4,2 · nockout 10,9 ·
candy 3,8 · midnight 4,1). Não é problema: o SVG preenche a caixa com
`meet`, então cada uma ocupa o que couber, centrada. Já era assim entre Moss e
Nockout.

##### Sobre a cortina: papel, MENOS no Candy
A regra base é `paper` — a mesma tinta clara do miolo da marca principal, e a
casa não usa `#fff` em superfície nenhuma.

O Candy é a exceção, porque a cortina dele é **menta** e portanto clara:
papel ali dá **1,51:1** e a arte some. Nele a marca toma a cor dos ícones ao
lado — `rgb(var(--sobre-acento) / .84)`, o mesmo valor do `.isl-icon` —, que
no Candy resolve para `rgb(33 33 33 / 84%)` e dá **9,59:1**.

| tema | cortina | marca alternativa |
|---|---|---|
| Moss | verde escuro | papel |
| Nockout | laranja | papel |
| **Candy** | **menta clara** | **tinta a 84%** |
| Midnight | roxo escuro | papel |

**SÓ o Candy.** Houve uma versão que aplicou isso em todos os temas, pelo
princípio "a arte segue os ícones" — e ela mudava o Nockout, cuja marca em
katakana virava escura sobre o laranja. Saiu a pedido. O papel no Nockout dá
3,3:1, abaixo do ideal para texto, mas é o visual escolhido e a arte é
enfeite de hover, não informação.

A lição que fica: **a regra vale onde o problema existe.** Generalizar um
conserto porque o princípio soa geral é como mudar o que ninguém pediu.

A marca PRINCIPAL continua fora disso em todos os temas: ela é a assinatura e
não troca de cor com a barra.

Nota de medição: `fill` e `color` têm transição de **0,45s** aqui. Medir logo
depois de trocar o tema devolve um valor do MEIO da transição — um marrom que
não existe em lugar nenhum do projeto. Espere mais de um segundo.

### O pop-up de Tema
Mesmo molde do Backup — mesma moldura, mesma entrada, mesmo título em Lexend
caixa alta, tela cheia no celular e cartão de 460px no desktop. Dois pop-ups
abertos do mesmo menu que chegassem de jeitos diferentes fariam o menu parecer
duas coisas.

**Cada tema é uma FAIXA**, pintada com a cor dele e empilhada sobre as outras.
As quatro são **cor chapada**, sem degradê. O código ainda sabe fazer degradê
a 135° se uma faixa receber mais de uma cor (`fundo()`, no `Tema.jsx`), mas
nenhuma recebe — e não deve receber enquanto houver ilustração de hover, pelo
motivo explicado em *A ilustração de hover*, logo abaixo.

Antes eram duas palavras lado a lado, e a palavra ERA a amostra (duas camadas
de texto, a de cima recortada por `clip-path`, entintando como pincelada no
hover). Era bonito e dava para dois temas — quebrou no terceiro. A faixa
mostra a cor no tamanho em que ela vai ser vista (um fundo), e empilhar deixa
a lista crescer sem ninguém mexer no layout. O `.tema-palavra` saiu do
index.css junto.

Empilhado, e no Backup em coluna pelo mesmo motivo oposto: no Backup são duas
ações de pesos diferentes e a coluna as afasta; aqui são pares, e a pilha é
como se lê uma lista de opções.

Os hex das faixas ficam **cravados em `lib/temas.js`**, não em token CSS: a
faixa do Candy tem de ser menta mesmo com o site no Midnight, senão a lista
inteira vira a mesma cor e a escolha deixa de ser escolha. É o único lugar do
projeto onde cor não sai de variável CSS.

| tema | faixa | tinta do nome | contraste |
|---|---|---|---|
| Moss | `#4B5D3A` | `#F4F0E6` | 7,04:1 |
| Nockout | `#FF5000` | `#212121` | 6,47:1 |
| Candy | `#B5CDC5` | `#212121` | 9,59:1 |
| Midnight | `#280137` | `#F3F1F6` | 16,29:1 |

Os quatro hex foram **lidos do pixel das ilustrações**, não escolhidos à
parte. Isso não é capricho: é o que faz a animação de hover funcionar.

**O escolhido leva anel E visto.** O anel usa a tinta do app, não a do tema:
ele é a voz da interface dizendo "é este", e teria de mudar de cor a cada
faixa para ser visto. O visto repete o que o anel já diz, de propósito — anel
é forma, visto é símbolo, e quem não distingue um anel fino ainda reconhece um
visto. Quem ouve recebe o `aria-checked`, que não depende de nenhum dos dois.

**O pop-up NÃO fecha ao escolher.** A troca repinta a página inteira atrás do
véu, e fechar junto tiraria da vista justamente o que mudou — além de impedir
experimentar os dois sem reabrir o menu duas vezes.

Herda do Backup o vazio no celular: o painel é de tela cheia e o conteúdo é
curto, então sobra fundo embaixo. É traço do molde, não deste pop-up — o
Backup faz igual, e mexer num sem mexer no outro quebraria a semelhança que é
o ponto.

#### A ilustração de hover

Passar o mouse por uma faixa faz um desenho **entrar girando**, com a quina de
baixo à esquerda presa, até ficar perfeitamente sobreposto à faixa.

**O truque não está no CSS, está no desenho.** O fundo da ilustração é a MESMA
cor chapada da faixa embaixo. Enquanto ela gira, a cunha que sobra descobre
exatamente a mesma cor — então não se vê um retângulo girando, vê-se só o
desenho girando. Com fundos diferentes, a borda da imagem apareceria varrendo
a faixa, e o efeito inteiro viraria "uma foto entrando torta".

Daí as duas amarras que parecem arbitrárias e não são:

- **Faixa de cor chapada, nunca degradê.** Um degradê embaixo e uma cor
  chapada na arte não têm como casar: a cunha descobriria uma cor e a arte
  traria outra.
- **Mexer no hex de `temas.js` sem refazer a arte quebra o giro.** Os dois
  valores são o mesmo valor em dois lugares; só um deles é código.

**Medidas:** 1200 × 210 (proporção 40:7, igual à da faixa), WebP **opaco**,
4,6 a 5,0 KB cada. O ângulo de repouso é `--giro: 8deg`, positivo — a ponta
direita começa abaixo e SOBE ao entrar, porque entrar subindo lê como algo que
chega e descendo lê como algo que cai. `transform-origin: 0 100%` é a quina de
baixo à esquerda, o canto mais longe do desenho: quanto mais longe o eixo,
mais o desenho viaja para o mesmo ângulo.

**O tamanho do arquivo importa menos que o das medidas.** A primeira entrega
veio em 5000 × 875: 22 a 32 KB em disco, mas 16,7 MB cada uma depois de
decodificada, mais de 60 MB para as quatro. Em 1200 × 210 são 1,0 MB cada. Um
WebP pequeno não é uma imagem pequena.

**`background-image` mora dentro do `@media (hover: hover)`**, não no estilo
em linha do elemento. O navegador só baixa e decodifica o arquivo que alguma
regra aplicada de fato pede — então no celular, onde o hover não existe, as
quatro ilustrações não são baixadas nem decodificadas. (E `hover: hover`
também evita o estado que fica PRESO depois do toque numa tela sensível, que
deixaria a arte acesa na última faixa tocada.)

##### A URL da arte precisa ser ABSOLUTA, e isso custou um site quebrado

A variável sai do JS já resolvida:

```js
'--arte': `url("${new URL(`${import.meta.env.BASE_URL}${arte}`, document.baseURI).href}")`
```

Parece preciosismo e não é. **`url()` dentro de uma custom property é
resolvido contra a FOLHA DE ESTILO que usa o `var()`** — não contra o
documento, e nem contra o lugar onde a variável foi declarada (que aqui é um
`style` em linha).

Com `base: './'`, o `BASE_URL` é `./`. E as duas pontas divergem:

| | onde o CSS mora | `./tema-moss.webp` vira |
|---|---|---|
| desenvolvimento | `<style>` no documento | `/tema-moss.webp` ✅ |
| publicado | `/Gibiteca-React/assets/index-xxxx.css` | `/Gibiteca-React/assets/tema-moss.webp` ❌ 404 |

**O sintoma era mudo**: a camada continuava aparecendo e girando no hover,
só que vazia. Nenhum erro no console, nenhuma falha no build, e funcionando
perfeitamente na máquina de quem escreveu. Só quebrava publicado.

Diagnosticado medindo no site no ar: `getComputedStyle` da camada devolvia
`url("https://…/Gibiteca-React/assets/tema-moss.webp")`, e um `fetch` nessa
URL dava 404 enquanto o mesmo arquivo na raiz dava 200 com os bytes certos.

`new URL(…, document.baseURI)` tira a relatividade antes de o caminho encostar
no CSS, e aí não importa de onde a folha é servida.

> **Os outros `BASE_URL` do projeto estão a salvo** e por um motivo preciso:
> `Divisoria`, `Welcome` e `Salvaguarda` usam o caminho em `src`/`srcSet` de
> `<img>`, que resolve contra o DOCUMENTO. A armadilha é exclusiva de caminho
> relativo que atravessa uma variável CSS até uma regra de folha.
##### No toque, a arte é do tema ESCOLHIDO

O `@media (hover: hover)` resolvia o estado preso do toque — mas ao preço de
**no celular não acontecer nada**. A ilustração simplesmente não existia lá.

Liberar o `:hover` para touch não serve: num aparelho de toque ele é o estado
que fica preso DEPOIS do toque, e a arte acenderia na última faixa tocada por
acaso, não por escolha. Então o gatilho deixa de ser o ponteiro e passa a ser
o **estado**:

```css
@media (hover: none) {
  .grupo-faixa[aria-checked='true'] .faixa-arte {
    background-image: var(--arte); opacity: 1; transform: rotate(0deg);
  }
}
```

Três coisas boas saem daí:

- **é determinístico** — há sempre exatamente uma ilustração na tela, a do
  tema atual, e ela diz "este é o seu";
- **a animação continua existindo**, no momento em que tem mais a dizer: ao
  TROCAR de tema, a arte de quem sai gira de volta e some enquanto a de quem
  entra gira para o lugar. A transição já estava em `.faixa-arte`; a regra só
  liga o estado final;
- **baixa menos que o desktop.** O `background-image` só se aplica à faixa
  escolhida, então o celular busca UMA ilustração, não quatro.

O seletor usa o `aria-checked` que o `role="radio"` do botão já carrega — não
foi preciso inventar classe nenhuma, e a regra descreve o que a tela já diz a
quem ouve.

**Medido nos dois lados.** No celular emulado: `hover: none` casa,
`pointer: coarse` casa, só a faixa escolhida tem imagem e opacidade 1, as
outras três em zero e giradas 8°. No desktop, com o ponteiro longe das faixas,
as QUATRO ficam em zero — a regra de toque não vaza.

> Cuidado ao medir a transição: no painel do Claude a página não pinta, o rAF
> congela e o `getComputedStyle` devolve o valor final já no primeiro quadro.
> Parece um salto instantâneo e não é — conferir `transitionDuration`
> (0,42s) em vez de amostrar a opacidade no meio.
**A área a manter calma** é o terço da esquerda, onde cai o rótulo: no arquivo
de 1200 × 210, x de 30 a 440 e y de 60 a 150. Fora desse retângulo a arte pode
encher. As quatro atuais respeitam isso — o desenho vive na ponta direita.

Arquivos: `public/tema-{moss,nockout,candy,midnight}.webp`. O nome entra em
`temas.js` como `arte`, **sem barra na frente** (o endereço sai de
`BASE_URL + nome`, e `/arte.webp` viraria `//arte.webp`, outro domínio). O
campo é opcional: faixa sem `arte` não desenha camada nenhuma, e arquivo que
deu 404 simplesmente não pinta — fica a cor cheia de sempre.

### O menu de dados e o pop-up de Backup
**Um nome por assunto, nos dois lugares.** O item do menu e o título do painel
que ele abre usam a MESMA palavra: Nuvem · Capas · Backup. Antes
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
cores por tema: ela trocava o preto dos caminhos sem classe por ink (`#212121`)
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

Antes disto a arte era ink fixo (`#212121`) no topo. Ficava legível, mas
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

**O viewBox tem que abraçar a arte.** Todos os SVG saíram do editor numa caixa
de `0 0 4000 1080` com o desenho centrado no meio dela, ocupando **51%** da
largura no `logo.svg`, 49% no alt-moss e **31%** no alt-nockout. Como o
`preserveAspectRatio` encaixa a caixa inteira — vazio incluso —, `h-12` rendia
48px de caixa e só ~24px de letra: a marca aparecia pela metade, e centrar no
cabeçalho centrava o vazio, não o desenho. As caixas foram apertadas na tinta,
medidas com `getBBox()`:

| arquivo | viewBox | proporção |
|---|---|---|
| `logo.svg` | `152 264 3695 551` | 6,71:1 |
| `logo-rodape.svg` | `139.28 311.81 3721.42 456.39` | 8,15:1 |
| `marca-alt-moss.svg` | `887 276 2225 528` | 4,21:1 |
| `marca-alt-nockout.svg` | `207 374 3586 332` | 10,80:1 |
| `marca-alt-candy.svg` | `304.04 308.37 3391.92 463.29` | 7,32:1 |
| `marca-alt-midnight.svg` | `912.26 235.09 2175.49 609.83` | 3,57:1 |

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

#### A marca do rodapé é outra arte, e por um motivo

`MarcaRodape.jsx` é a versão **chapada** do logotipo: uma camada, uma cor. Ela
só aparece no rodapé.

A marca do cabeçalho vive das duas tintas — sombra deslocada atrás, letras
vazadas na frente —, e isso existe porque a barra do topo **inverte** ao rolar:
cada camada troca de cor por conta própria e o desenho aguenta os dois fundos.
No rodapé não há inversão nenhuma. A faixa é escura o tempo todo, e uma sombra
escura atrás de letras claras sobre fundo escuro não é profundidade: é borrão.

A cor sai do CSS, presa a `rgb(var(--tinta))` em `.marca-rodape`. Como
`.rodape` define `--tinta: var(--paper)`, a marca sai cor de papel ali **sem o
componente saber o que é um rodapé** — posta numa superfície clara, ela sai
escura, sem regra nova. Medido na faixa: `fill` resolve para `rgb(244 240 230)`
sobre `#212121`.

Gerada por `tools/gerar-marca-rodape.cjs` a partir de
`src/assets/logo-rodape.svg`, com o mesmo contrato das outras: texto em curvas,
viewBox colado na tinta, `d` que não se edita à mão.

**O favicon segue a mesma regra, e tem uma a mais.** `public/favicon.svg` é o
ícone da casa — a estrela de oito pontas com o G dentro —, gerado por
`tools/gerar-favicon.cjs` a partir de `src/assets/icone.svg`. A arte vem em
`0 0 1080 1080` com folga em volta; num ícone de 16px essa folga é perda direta
de legibilidade. O gerador aperta a caixa num **quadrado** — quadrado porque o
ícone é exibido num espaço quadrado, e um viewBox retangular deixaria o
navegador escolher o enquadramento — com o lado da maior dimensão da arte e
centrado nela: `50.02 50.02 979.95 979.95`.

O contorno vai **cravado no script**, medido com `getBBox()` no navegador.
Trocou a arte, mede de novo: um `getBBox()` velho não dá erro nenhum, só
desloca o ícone em silêncio.

**Ele aguenta o 16px, e é esse o ponto.** Medido em 16, 24, 32, 64 e 128: a
silhueta de estrela se reconhece em todos; o G lê-se de 24 para cima e a 16
fecha o vão do meio sem levar o contorno junto. É o que a primeira versão — o
logotipo "GIBI / TECA" em duas linhas — não conseguia: a 16px ela virava mancha
escura sem forma. Um ícone de aba é uma silhueta vista de longe, não um
logotipo lido de perto; a arte atual assume isso, e por ser um desenho fechado
cabe num caminho só (2 kB contra 29 kB daquela).

A cor vem de um `<style>` DENTRO do SVG, com `prefers-color-scheme`: `#23271C`
no claro, `#F4F0E6` no escuro. É o esquema do **navegador**, não o tema do site
— o favicon vive na aba, não na página, e não tem como saber se quem abriu está
em Moss ou Nockout. Firefox e Chrome respeitam a consulta; **o Safari não**, e
nele fica sempre a versão clara (tinta escura), que some numa barra escura. Não
há `.ico` de reserva no projeto.

**Conferido no navegador**, com o esquema escuro emulado: inline, o `fill` do
caminho resolve para `rgb(244 240 230)`. Vale dizer para a próxima conferência
— num `<img>` a emulação de esquema do navegador **não alcança** o documento
da imagem, e o ícone continua saindo na tinta clara ali mesmo com a página em
modo escuro. Isso é artefato da emulação, não do arquivo: quem muda o esquema
no sistema vê a troca.

**Para trocar a arte:** aperte o viewBox na tinta (ver acima), substitua
`src/assets/logo.svg` e rode
`node tools/gerar-marca.cjs` — os `d` não se editam à mão. O gerador separa os caminhos por classe:
sem classe vira `.marca-sombra`, `.cls-1` vira `.marca-letra`, e `.cls-2`
(`fill: none`, sobras do editor) é descartado.

O `layoutId="marca"` da abertura saiu da imagem e foi para um `motion.span` em
volta do SVG — a viagem da marca continua igual.

### Quatro temas de cor
O app tem **quatro temas**: **Moss** (verde, padrão), **Nockout** (laranja),
**Candy** (pastel) e **Midnight** (roxo-tinta). Mudam o **acento**, o **papel**
e a família de **tintas de capa ausente**; tinta, gold, rust e blue são os
mesmos em todos.

| | acento | papel | acento-texto | sobre-acento |
|---|---|---|---|---|
| Moss | `#4B5D3A` | `#F4F0E6` creme | o próprio (6,31:1) | papel (6,31:1) |
| Nockout | `#FF5000` | `#F0F0F0` prateado | `#C23A00` (4,73:1) | ink (4,91:1) |
| Candy | `#DF8888` | `#F7F2F0` rosado | `#A8434A` (5,30:1) | ink (6,15:1) |
| Midnight | `#280137` | `#F3F1F6` lavanda | o próprio (16,29:1) | papel (16,29:1) |

Os números foram **medidos**, não estimados: `node tools/contraste.cjs` roda a
conta do WCAG sobre cada par e `node tools/tintas.cjs` sobre as oito tintas de
cada tema. Os dois saem com código 1 se algo cair abaixo de 4,5:1 — rode-os ao
acrescentar um tema. Nenhuma cor entrou sem passar.
entrou sem passar em 4,5:1.

**Acrescentar um tema é escrever um bloco `[data-tema=...]`** com o mesmo
conjunto de variáveis, e mais nada: nenhum componente sabe que ele existe.
Duas listas precisam saber o NOME: `TEMAS_VALIDOS` no store (que filtra lixo
guardado) e o array repetido no script inline do `index.html` (que evita o
piscar antes do bundle; roda antes de qualquer módulo, então não há de onde
importar).

#### Candy: três cores, e as três têm de aparecer
Vieram três de uma vez — `#DF8888` rosa, `#EBB273` damasco, `#B5CDC5` menta.

**A primeira versão errou o alvo.** Usava só o rosa em tudo que é acento e
guardava as outras duas no hover e num fio: na prática, um tema rosa com dois
detalhes. Cada cor precisa de um lugar que se VÊ.

| cor | onde aparece |
|---|---|
| rosa | preenchimento (botões, selos, FAB) e `--acento-texto` |
| damasco | o degrau do hover (`--moss-2`) |
| menta | o tom claro, o fio, e a **lavagem** (`--tinta-moss`): etiquetas de autor, contador de seleção, cartões de estatística |
| as três | a família de **capa ausente**, em pastel |

A ordem na rampa saiu da **luminância**, não do gosto: rosa (0,35) é a mais
escura e enche, damasco (0,51) clareia no hover, menta (0,58) é o claro. É a
mesma semântica do Moss e do Nockout — as três já vinham na ordem certa.

O rosa cheio dá **2,30:1** como texto sobre o papel, ilegível em corpo
pequeno. Por isso `--acento-texto` é o mesmo rosa aprofundado (`#A8434A`,
5,30:1) — a mesma separação que o Nockout já exigia.

##### A família de capa ausente do Candy é PASTEL
E essa é a mudança que de fato espalhou as cores pela tela, porque a parede
de capas é a maior superfície do app.

A primeira tentativa escureceu as três cores até o branco passar por cima — e
as três **convergiram para marrom**. A estante ficava marrom num tema de rosa,
damasco e menta.

O erro era de premissa: a família não precisava ser escura, as INICIAIS é que
precisavam mudar de cor. O rosa dado já tem luminância 0,35 e com tinta por
cima dá 6,15:1. Daí nasceu **`--sobre-tinta`** — a tinta que vai em cima da
tinta de capa ausente, branco por padrão, ink no Candy.

Era `text-white` cravado em **nove lugares** (Card, Collection, DetailSheet,
Editor, Fila, Listas), e esse hardcode prendia toda família futura a ser
escura. Hoje é `text-sobre-tinta`. Os `text-white` que sobraram são selos de
cor fixa (`bg-rust`, `bg-box`) e não são tinta — não mexer.

As oito se dividem em três famílias (três rosas, três damascos, duas mentas)
para o sorteio por editora espalhar as cores em vez de insistir numa.


##### A barra do Candy é MENTA, não o acento
A cortina do topo é a única superfície GRANDE que o tema pinta. No Candy ela
sai na terceira cor: o rosa já enche todos os botões, selos e o FAB, e
repetido numa faixa da largura da tela ele deixava de ser destaque e virava
fundo.

A cortina lê `--barra`, com `var(--moss)` de reserva — só o Candy desvia, e os
outros três temas continuam seguindo o próprio acento (medido: Moss, Nockout e
Midnight com cortina idêntica ao `--moss` de cada um).

Pílulas e ícones não precisaram de nada: já usam `--sobre-acento`, que no Candy
é tinta, e **tinta sobre menta dá 9,59:1**.

**A MARCA NÃO MUDA.** Houve uma versão em que ela invertia sobre a menta
(miolo em tinta, sombra em rosa), porque `paper` sobre menta dá só **1,51:1**;
saiu a pedido de quem desenha o app. A regra do projeto vale inteira: a marca é
a assinatura e não troca de cor com a barra, em tema nenhum.

Na prática funciona porque quem desenha as letras sobre a menta é a **sombra**,
que é tinta e dá 9,59:1 — o miolo claro lê como recorte, não como texto. Se um
dia incomodar, o caminho é **escurecer a menta da barra**, não repintar a
marca.

Nota de medição: a leitura logo após o `scrollTo` sai **errada** — o
`data-acento` ainda não trocou. Captura uma tela (que força repaint) antes de
medir, ou mede de novo no comando seguinte.

#### Midnight NÃO é modo escuro
`#280137` é tão escuro (luminância 0,008) que serve de preenchimento **e** de
texto sem precisar de uma segunda versão, como no Moss.

Mas o eixo de tema deste app é o **acento**: papel e tinta continuam claros.
Midnight é uma noite de tinta sobre papel claro, não uma tela apagada. Inverter
os dois mexeria em sombra dura, selos, tintas de capa (todas escuras, com
iniciais brancas — sobre papel escuro sumiriam) e na marca. É outro assunto, e
bem maior.

O papel puxa levemente para a lavanda: sobre creme, o roxo esverdeia.


#### Os papéis não derivam um do outro

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
pequeno. Com os tons separados a barra rolada sobe para **4,91:1**.

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
de CSS**: `.tinta-N { --t: var(--tinta-N) }`, e cada tema declara os oito
`--tinta-0..7` no próprio bloco.
Essa separação não é preciosismo: um hex vindo do JS ficaria **congelado até o
React redesenhar o cartão**, então trocar de tema deixaria capas da cor antiga
espalhadas pela estante. Em CSS a cascata repinta na hora.

O hash é o mesmo de antes, então cada editora continua caindo na mesma tinta e
nenhuma obra troca de cor dentro do tema Moss.

**A classe só LÊ a variável — e isso custou um defeito para aprender.** A
fiação era por tema (`[data-tema=x] .tinta-N { --t: var(--tinta-N) }`, oito
linhas por tema). O Candy entrou declarando as oito cores e esquecendo esse
bloco: as capas ausentes saíram **verde-oliva num tema de rosa**, sem erro
nenhum no console. Hoje a fiação é uma só, sem seletor de tema, e um tema
novo não tem como esquecê-la.

A família do **Midnight** é escura como as outras; a do **Candy** é pastel, e
lá as iniciais vão em tinta — ver "A família de capa ausente do Candy".
`node tools/tintas.cjs` mede cada uma contra a tinta que de fato vai por cima.

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
- Tinta: uma só, `#212121`, em quatro degraus de opacidade — `ink` 100%,
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
- **Fila de leitura:** `fila: [{ id, vol }]`, ao lado de `obras` no mesmo
  arquivo. `vol` é o índice do volume, ou `null` para avulsa. A ORDEM do
  array é o conteúdo — ver "A fila de leitura".
- **Listas:** `listas: [{ id, nome, obras: [idDaObra], numerada }]`, no mesmo
  arquivo. `numerada` é opcional (ausente = alfabética); quando ligada, a
  ORDEM do array `obras` é o que se vê, e é o que o arrasto reescreve.
  Obra inteira, nunca volume. A obra NÃO sabe em que listas está — quem sabe
  são as listas; use `listasDaObra(listas, id)`. Ver "As listas".

## Store e persistência (lib/store.jsx)
- Chaves no localStorage: `gibiteca_v1` (`{version, obras, editoras, fila, listas}`),
  `gibiteca_pagesize`, `gibiteca_cloud` (config da nuvem, inclui o token).
- Um `ref` `dirty` evita persistir/enviar antes da 1ª alteração real.
- Mutações: `upsertObra`, `duplicarObra`, `desmembrarObra`, `deleteObra`,
  `setCovers`, `loadBackup`. Toda alteração persiste local e, se a nuvem
  estiver conectada, **agenda push** (debounce 1,5s).
- Fila de leitura: `alternarFila`, `removerDaFila`, `reordenarFila`,
  `marcarLido` — e `podarFila`, que as três mutações de obra chamam para
  tirar da fila o que foi lido ou deixou de existir.
- Listas: `criarLista`, `renomearLista`, `apagarLista`, `alternarNaLista`,
  `definirListasDaObra` (usada pelo Editor), `alternarNumeracao`,
  `reordenarLista` — e `podarListas` / `trocarNasListas`, chamadas por
  `deleteObra` e `desmembrarObra`.
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
- ink mudou de `#20241A` para `#23271C` para bater com o `index.html`; depois,
  de `#23271C` para `#212121`, unificando com o preto que a capa já usava.
  O `ink-2` (hover) acompanhou: era `#2c3124`, um cinza ESVERDEADO derivado do
  verde-tinta antigo, e virou `#2c2c2c` — deixá-lo faria o hover puxar para o
  verde a partir de um cinza puro.
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

---

## Conta, entrada e ajuda (Etapa 0)

A porta de entrada (`Entrada.jsx`) fica ENTRE a capa e a coleção. O botão da
capa diz "Entrar"; o cabeçalho aparece no modo `soMarca` (só o logo, sem busca,
menu ou contagem), porque é o logo que viaja da capa até a barra pelo
`layoutId="marca"` — cortar o cabeçalho faria a marca sumir no meio da viagem.

**O portão** (`App.jsx`) exige SESSÃO e CONTA de acordo:
`!!sessao && !!conta.email && sessao.email === conta.email`. Sessão sozinha
deixaria entrar sem perfil; conta sozinha deixaria entrar quem nunca digitou o
e-mail. E a comparação existe porque restaurar backup troca a conta e NÃO a
sessão — o arquivo de outra pessoa deixaria a sessão antiga valendo sobre dados
que não são dela.

**`conta` vai no blob, `sessao` não.** `conta` (e-mail, nascimento, termos) mora
em `gibiteca_v1` junto das obras, logo vai no backup e na nuvem. `sessao` mora
em `gibiteca_sessao`, chave própria: estar logado é fato DESTE aparelho, e levar
isso num arquivo restaurado deixaria alguém logado num computador onde nunca
digitou nada.

**O servidor de mentira** (`lib/conta.js`) tem a superfície que o servidor de
verdade vai ter: `pedirCodigo` e `conferirCodigo` são `async` sem esperar nada,
para que a Etapa 1 troque só o corpo. O código aparece na tela num aviso dourado
que some sozinho quando `r.codigo` parar de vir — andaime que se desmonta, em
vez de andaime que alguém precisa lembrar de tirar.

**O limite de envio sobrevive à morte do código.** `limparCodigo()` preserva
`email`, `enviadoEm` e `envios`, apagando só `codigo`/`expira`/`tentativas`.
Sem isso, queimar as 5 tentativas de propósito zerava a espera de 60s e o teto
de 5 por hora — o limite existe contra quem insiste, e não pode depender de um
dado que o insistente apaga. `conferirCodigo` ganhou `!p.codigo` na guarda pelo
mesmo motivo: sem ela, o palpite era comparado com `undefined`, dava 'errado' e
gastava tentativa de um código que já não existia.

### `AnimatePresence mode="wait"` trava, e trava calado

Duas tentativas, duas falhas diferentes, nenhuma com erro no console:

1. **Três filhos irmãos condicionais** (`{passo==='x' && <motion.div key="x">}`).
   `mode="wait"` quer UM filho com chave; com três, dois viram `false` e ele
   recebe uma lista. A troca por clique funcionava; a troca feita DURANTE a
   montagem (um efeito recompondo estado salvo) nunca completava.
2. **Um filho com `key={passo}`** — o padrão documentado. Agora era a troca por
   CLIQUE que parava: `passo` ia para 'cadastro' e a tela ficava em 'entrar'.

Nos dois casos o estado estava certo e o DOM errado. Só apareceu com uma sonda
registrando `passo` a cada render (`window.__renders`), porque não há erro, não
há aviso, e o `aria-expanded`/estado interno diz que está tudo bem.

**A saída foi tirar o `AnimatePresence` dos passos**: `<div><motion.div
key={passo} {...FADE_PASSO}>`. A chave muda, o React remonta, o `initial`/
`animate` dá a entrada. Perde-se a animação de saída (0,22s); ganha-se uma
troca que não tem como emperrar. `mode="wait"` segura a entrada do novo até o
velho sair — e quando essa saída não termina, não há nada na tela que diga.

**E recompor estado salvo é ESTADO INICIAL, não efeito.** O código pendente
depois de um F5 entra por `useState(() => ...)`, não por `useEffect` +
`setPasso`. Nascer no passo certo não tem transição para travar, e ainda evita
o piscar da tela anterior. Só recompõe código de conta que EXISTE: F5 no meio
do cadastro perde o formulário (memória) mas não o código (disco), e confirmar
ali abriria sessão para uma conta que nunca nasceu.

### Armadilha de EOL: nunca cravar `\r\n` numa substituição

`Cloud.jsx` é LF. Um `t.replace(/(\r?\n){3,}/, '\r\n\r\n')` injetou 2 CRLFs num
arquivo de 265 linhas LF — e o próximo script, que detecta o EOL com
`/\r\n/.test(b)`, passou a ver **3 linhas** em vez de 265. Todo `findIndex` por
conteúdo quebrou de uma vez.

A regra: a string de substituição usa o EOL **detectado**, nunca um literal.

E a mesma armadilha tem uma segunda forma, que me pegou de novo: **anexar ao
fim de um arquivo CRLF com uma ferramenta que escreve LF**. Um `cat >> arquivo
<< 'FIM'` num `index.css` CRLF deixou 52 linhas LF no fim de um arquivo de 927
CRLF. Não quebra nada na hora, e é o próximo script de linha que se perde.
Depois de anexar, conferir — `(b.match(/\n/g)||[]).length - (b.match(/\r\n/g)||[]).length`
tem de dar zero.
E os arquivos deste projeto são mistos POR ARQUIVO — `Tema`, `Fila` e `Entrada`
são CRLF; `Header`, `Listas`, `Backup`, `Editor`, `Cloud`, `store`, `helpers`
são LF. Detectar por arquivo e preservar.

### Outras duas, menores

- **Dois `ml-auto` na mesma fileira flex**: o primeiro come o espaço e o segundo
  fica sem. "Apagar conta" ficou no meio da fileira da nuvem em vez de na
  direita. Virou linha própria no rodapé, que é o que "último botão" pedia.
- **`<button>` dentro de `<label>`**: o nome acessível do checkbox é montado do
  texto do label, e o botão aninhado vira um buraco — "Li e aceito os , e
  declaro que…". O aceite dos termos anunciava tudo menos o que se aceita. O
  `<label>` virou `<div>` e o nome foi para um `aria-label` explícito. E a frase
  ao lado NÃO leva `aria-hidden`: ela contém o botão dos termos, e esconder da
  árvore um controle que o teclado alcança é pior que ouvir a frase duas vezes.

## Termos, privacidade e ajuda

`lib/termos.js` tem os DOIS documentos e UMA versão (`DOC_VERSAO`), porque eles
são aceitos no mesmo clique. Em dados, não em JSX: a mesma seção aparece no
pop-up do cadastro, na central de ajuda e um dia numa página pública. O aceite
guarda `{ aceito, versao, em }` — só "aceitou: true" não serve de nada no dia em
que o texto mudar.

`lib/ajuda.js` tem o FAQ (agrupado, com `temporaria: true` nas perguntas que
morrem quando houver servidor) e a contestação. O texto da contestação é montado
por função, fora do componente, porque vai para DOIS destinos — corpo do e-mail
e área de transferência — e montado duas vezes um deles ficaria sem um campo.

**A contestação abre um `mailto:` E copia.** `mailto:` falha calado em muito
navegador e em quase todo webmail numa aba; um botão que não faz nada visível é
pior que não ter botão, porque a pessoa acha que enviou.

**Menu**: "Ajuda" entrou como ÚLTIMO item — é a porta de quem não achou o que
queria nas outras. O grupo "Dados e nuvem" chegou a virar "Seus dados" e subir
para o topo antes de ser desfeito de vez; ver a seção do ☰ acima.

**`AvisoSemServidor.jsx` tem prazo de validade** e está num arquivo próprio por
isso: misturado ao `AvisoSemEspaco`, viraria permanente por inércia. Só aparece
para quem não conectou a nuvem, e o caminho (`☰ › Seus dados › Perfil`) está
escrito no texto porque é o que sobra depois que alguém fecha o aviso.

**Ele vive na PORTA DE ENTRADA, nunca dentro da coleção.** Nasceu no topo da
estante e foi movido: ali era uma faixa de alerta permanente sobre algo que não
acabou de acontecer, posta por cima justamente do que a pessoa abriu o app para
ver — e alerta que está sempre na tela vira paisagem e deixa de alertar. Na
entrada não há coleção para atrapalhar, e é o momento em que a pergunta "onde
isso vai ficar guardado?" de fato se faz. Fica fora do passo do CÓDIGO, onde já
existe o aviso dourado explicando por que o código está na tela: dois recados
sobre o mesmo assunto, empilhados, anulam um ao outro.

Mudar de lugar mudou o destino do botão: na entrada não existe painel de Perfil
para abrir, porque ele vive do outro lado do login. Daí `TutorialGitHub.jsx`,
com o passo a passo em `<PassosGitHub />` — usado pelo "Como fazer?" do Perfil
— e um `PopupTutorialGitHub` para a entrada, que acrescenta onde ficam os
campos, já que o "cole abaixo" do passo 4 fala de uma tela que ali não está.

E a faixa ganhou um contêiner de `max-w-[820px]` na entrada: ela traz
`max-w-[1320px]` de quando servia à estante larga, e de ponta a ponta sobre uma
coluna de 420px o botão e o × ficavam longe do texto que respondem.

---

## O painel de filtros: parar de repetir

**O que ele era:** dez controles empilhados, cada um com um rótulo em caixa
alta por cima. A palavra "Todos"/"Todas" aparecia **seis vezes** — era a
primeira opção de todo campo —, havia **oito rótulos**, três seletores
segmentados com a mesma cara, e a ordenação estava partida em dois campos
("Ordenar por" e "Ordem") que juntos diziam uma coisa só.

**O princípio que organiza tudo o que mudou:**

> Não filtrar não é uma opção — é a ausência de uma.

"Todos" não é um valor ao lado de "Tenho" e "Quero"; é o que sobra quando
nenhum dos dois está ligado. Tratá-lo como botão obrigava a desenhar um
terceiro alvo, a escrever a palavra, e a explicar em cada campo que o estado
inicial tem nome. Os segmentados viraram **chips que ligam e desligam**
(`aria-pressed`, não `aria-checked`: é interruptor, não opção de grupo), e as
seis palavras sumiram de uma vez.

**O rótulo virou o texto do campo vazio.** "EDITORA ▸ Todas" virou uma caixa
que diz `Editora` enquanto está vazia e `Panini +2` quando está cheia — rótulo
e valor disputam o mesmo lugar porque nunca são necessários ao mesmo tempo.
Dos oito rótulos restaram dois, e os dois nomeiam GRUPOS ("Afunilar por",
"Ordenar"), não controles.

**A opção vazia saiu da lista, não só trocou de nome.** Renomeada, `['', 'Todas']`
virava uma linha chamada "Edição" dentro da lista de edições, marcada por
padrão — uma opção com o nome do próprio campo. Em multi-seleção ela também não
tinha função: quem limpa, desmarca. Sem o item `''`, o `Selecao` cai no
`placeholder` sozinho (ver `rotuloVazio` lá dentro).

**Os três tipos viraram glifos**: um volume, vários lado a lado, uma caixa. As
formas que a estante já tem, desenhadas. O rótulo não some — vai no `title` e
no `aria-label`, porque glifo sem nome acessível é botão mudo para quem ouve e
enigma para quem passa o mouse na primeira vez.

**A direção virou uma seta que gira.** E ela diz MAIS que as palavras diziam:
"crescente" ao lado de "Nota" é ambíguo — nota maior primeiro, ou menor? —
enquanto uma seta para cima encostada em "Nota" não tem essa dúvida. É a mesma
seta girando 180°, não dois ícones trocando: o giro mostra a inversão
acontecendo, que é o que o botão faz.

**O botão conta.** "Ver resultados" era uma palavra genérica no lugar onde
cabia a única informação que importa antes de fechar o painel — sobrou alguma
coisa? Agora é "Ver 42 obras", "Ver 1 obra" ou "Nada encontrado".

**Importados e Urgentes perderam o quadradinho.** A caixa de marcação dentro de
uma pastilha repetia o que a pastilha acesa já dizia, e dois sinais para um
estado é um a mais. Ganharam os mesmos símbolos que os cartões usam (globo e
triângulo), que é o que permite ligar o filtro à obra filtrada sem legenda.

### Conteúdo adulto: o campo existe, o filtro ainda não

`obra.adulto` é um booleano, editado por um `Switch` de duas faces
(**Livre** / **+18**) no editor, ao lado da editora. **Essa vizinhança não é
acaso:** as duas são decisões da EDIÇÃO, não da história — a mesma obra sai
livre numa editora e +18 noutra. Ocupa a metade que o campo de país deixou
vaga.

**`Switch` e não caixa de marcação.** Marcar nada e marcar "Livre" são
estados diferentes para quem cadastra: um é "não pensei nisso", o outro é
"pensei e é livre". Com duas faces explícitas, o padrão é uma resposta e não
um esquecimento.

**"+18" e não "Adulto":** é o símbolo que a classificação brasileira usa na
capa, e quem cadastra está olhando para a capa.

Na ficha vira o primeiro selo da linha, **em tinta cheia com texto claro** —
o preto do 18 da classificação. É o único selo daquela linha que muda o que
se pode FAZER com a obra, e não só o que ela é. Não usa rust de propósito:
ali o rust é da urgência, e duas coisas diferentes na mesma cor deixam as
duas mais fracas.

#### O que falta, e já está prometido por escrito

Os Termos (`lib/termos.js`), a Ajuda (`lib/ajuda.js`) e a tela de cadastro
já descrevem um filtro que **não existe em código**:

> "Parte do acervo é destinada a maiores de 18 anos e fica oculta por
> padrão. Para vê-la é preciso ter informado a data de nascimento, ter 18
> anos ou mais e ligar a opção. Quem tem menos não consegue ligar."

O que existe hoje: `maiorDeIdade(nascimento)` e `idadeEm()` em `lib/conta.js`,
e a data de nascimento guardada na conta. O que falta para cumprir o texto:

1. um ajuste no perfil (`perfil.mostrarAdulto`), **desligado por padrão** e
   que só pode ser ligado por quem tem 18+ — a Ajuda promete exatamente isso;
2. um ramo no `passes` escondendo `o.adulto` quando o ajuste está desligado;
3. decidir o que a ocultação faz com os números — estatísticas, contadores e
   o "Ver N obras" do filtro passam a contar menos do que a coleção tem, e
   isso precisa ser dito em algum lugar ou vira bug aparente.

**Enquanto o filtro não existir, marcar +18 não esconde nada** — só carimba
a obra. É melhor assim do que um filtro pela metade, mas é uma promessa em
aberto nos documentos que o app já publica.
### O filtro de nota

Ao lado de Edição, fechando a grade de duas colunas do Afunilar. Filtra por
`avgNota`, que numa série é a média dos volumes — a mesma conta que a ficha e o
cartão já mostram, então o filtro não inventa um número próprio.

**São ESTRELAS, não uma lista suspensa.** A primeira versão era um `Selecao`
com "★ 4,5" escrito. Mas a nota já tem uma forma nesta casa: o cartão, a ficha
e o editor mostram estrelas, e só no filtro ela viraria uma palavra. Escolher a
nota com o mesmo gesto com que se dá a nota é o que torna o controle
reconhecível antes de ser lido.

É o **mesmo `EstrelasInput`** do editor e da ficha, de propósito — clicar na
estrela marcada vira meia estrela, que é como as notas quebradas existem no
app. Um controle novo teria de reaprender essa regra e um dia divergir dela.

- **zero não é escolhível**, e é isso que deixa o campo vazio significar "sem
  filtro" sem ambiguidade. Para sair de uma nota escolhida há o ×, que só
  acende quando há o que limpar — mas **ocupa lugar fixo mesmo apagado**, senão
  empurraria as estrelas de lado a cada escolha;
- **a nota é EXATA**: quatro estrelas mostra o que tem quatro, não "quatro ou
  mais". Com meia estrela na escala, "ou mais" sempre obriga a decidir se 4
  inclui 4,5; exato não precisa decidir nada. Para virar "ou mais", trocar
  `!==` por `<` no `passes`.

O que a mudança para estrelas custou: a lista suspensa só oferecia as notas que
EXISTEM na coleção, como fazem editora e autor. As estrelas oferecem as dez
sempre, então dá para escolher uma nota que ninguém tem — e aí o rodapé diz
"Nada encontrado", que é resposta honesta e imediata. Foi a troca: o gesto
certo em lugar da cascata.

#### Sem moldura, e com o rótulo dos vizinhos

A primeira versão vinha numa pílula com borda e `Nota` em caixa alta pequena,
imitando os campos ao lado. Imitava a coisa errada: **aquela borda é a promessa
de que o campo ABRE** — clicar em Autor, Editora ou Edição derruba uma lista. As
estrelas já estão à vista e se clica nelas direto. Borda sem abertura é o painel
prometendo um gesto que não existe.

Então a caixa perdeu borda e fundo, e `Nota` passou a ser `text-corpo
font-semibold` — o mesmo peso, tamanho e caixa dos rótulos de Autor, Editora e
Edição, com a mesma troca de cor (`text-ink-soft` vazio → `text-ink`
preenchido). O `pl-[15px]` repõe à mão o recuo que a pílula dava por dentro — 1px
de borda + 14px de `px-3.5`, medidos da aresta externa — para `Nota` nascer na
mesma vertical de `Editora`, o campo logo acima dele na coluna da direita.
**O SUBLINHADO é o que sobrou da borda**: 1px de `border-contorno`, o mesmo fio
e a mesma espessura da pílula ao lado, e vira `border-moss` quando há nota
escolhida, como a borda do vizinho faz ao ser preenchida. Diz onde o campo
pousa sem prometer que ele abre.

Para o fio cair na mesma linha da borda de baixo do vizinho, a caixa **não tem
altura cravada**: `self-stretch` faz ela crescer até o fundo da linha da grade,
e quem decide essa altura é a pílula ao lado. Com o `h-[42px]` que estava aqui
o fio caía 2px abaixo — a pílula mede 39,7px, não 42.

**Conferido no navegador**: Inter 14px/600, sem `text-transform`, nos quatro
rótulos; a caixa da nota sem fundo, e o sublinhado de 1px `rgba(33,33,33,.24)`
terminando em `bottom: 238,375` — o mesmo pixel da borda inferior do campo
Edição.

O `aria-label` das estrelas **muda de frase aqui**. O `EstrelasInput` diz
"dar nota 4" por padrão, que é o que ele faz no editor e na ficha; no filtro ele
não dá nota nenhuma, escolhe quais notas aparecem. Daí a prop `rotulo` —
padrão intacto para quem já usava, e "mostrar só as obras com nota 4" aqui. Quem
vê a tela entende pela posição; quem ouve, só pelo rótulo.

#### Por que ele ficou no Afunilar, e não nas Condições

Pela régua deste painel, a nota pertenceria às **Condições**: ela fala de
VOCÊ, não da obra — autor, editora e edição existiriam igual se a obra não
fosse sua; a nota só existe porque é.

Mas as Condições são todas sim-ou-não (pares ligados e interruptores), e a nota
é uma escala. **Ficou onde a FORMA do controle manda**, encostada na fronteira
— última do Afunilar, colada nas Condições.

**Medido** numa coleção de 7 obras com notas 5, 4,5, 4, 3 e duas sem nota: sem
filtro 7; ★5 → 1; ★4 → 1; ★3,5 (clicando a quarta estrela duas vezes) → "Nada
encontrado"; ★4,5 → 2, sendo a segunda a série, que entra pela média dos
volumes. O × devolve as 7 e volta a ficar apagado.


### Uma armadilha de teste que parece bug

Clicar em dois chips no mesmo tique dá resultado errado quando o primeiro
muda quais tipos sobram: a cascata desabilita os tipos sem obra no recorte, e
clique em botão desabilitado não faz nada. Num teste automatizado isso lê como
"o filtro não aplicou". É a cascata funcionando — o mesmo motivo pelo qual os
tipos vazios ficam VISÍVEIS e apagados em vez de sumirem: sumindo, o número de
alvos mudaria a cada clique noutro filtro, e a mão aprende posição antes de
aprender rótulo.

## O avatar do perfil

Virou um DISCO de 28px, do tamanho de um avatar de verdade — porque é num
avatar que ele se transforma assim que há foto. Um ícone de 19px que vira uma
foto de 19px seria uma foto que não se vê.

O desenho é um **disco cheio com a figura recortada dele**, não uma figura
desenhada sobre um fundo. É o padrão de avatar vazio que todo mundo já viu, e
tem uma vantagem concreta: os ombros encostam na borda de baixo e saem pelo
corte, do jeito que um retrato real sai. Uma silhueta desenhada dentro do
círculo precisaria caber inteira, e caberia sempre pequena demais.

`fillRule="evenodd"` faz o trabalho: disco, cabeça e ombros são um `d` só, e é
a regra de preenchimento que decide que as formas internas FURAM a de fora em
vez de somar a ela. Com a regra padrão, sai um disco sólido.

A linha do Perfil ganhou `bg-toque` (o véu mais fraco do projeto, 5,5%) e
**perdeu o fio de baixo**: fundo e régua fazem a mesma coisa — separar — e os
dois juntos põem duas bordas a quatro pixels uma da outra.

A roda de cores saiu da frente de "Tema", e `lib/temas.js` passou a servir só
ao pop-up — mas fica onde está: o hex das quatro cores num arquivo próprio
continua certo, e o `Tema.jsx` já lê de lá.

---

## A linha do menu diz o nome

O primeiro item era "Perfil" e virou **"Seus dados"** — e, assim que o perfil
tem um nome, vira **o nome**. O rótulo genérico serve até existir a palavra
mais específica.

**Só o primeiro nome.** "Rafael Moreco" em caixa alta de 20px não cabe ao lado
do avatar numa folha de 320px, e truncar o sobrenome de alguém é pior que não
mostrá-lo. O nome completo está no painel, a um clique. (`truncate` mesmo
assim: primeiro nome também pode ser comprido, e a alternativa a cortar é a
linha empurrar a folha.)

**O título do PAINEL não vira o nome**, embora o item do menu vire. No menu o
nome é a etiqueta de uma porta entre nove, e serve justamente para distinguir;
lá dentro já não há o que distinguir, e um painel chamado "Rafael" deixaria de
dizer o que se faz nele — mexer no e-mail, na nuvem e no botão de apagar a
conta. Os dois se chamam "Seus dados" quando não há nome, pela regra de um
nome por assunto.

## A troca de tema é animada — e a animação só existe durante a troca

Trocar o `data-tema` repinta a página num quadro só: fundo, tinta, bordas e
ícones saltam de uma paleta para a outra. Funciona, e é seco.

O jeito óbvio — `transition: background-color, color…` numa regra geral —
cobraria caro o ano inteiro para enfeitar um clique por mês: todo hover, todo
foco e toda pastilha que acende passariam a arrastar meio segundo. O custo
recairia sobre o uso normal; o benefício, sobre o caso raro.

Então a transição é **ligada só no instante da troca**: o store põe
`.trocando-tema` no `<html>`, troca o atributo, e tira a classe ~0,7s depois.
Fora desse instante o CSS é exatamente o que era — medido: `transitionDuration`
do body é `0s` antes, `0.55s` durante, `0s` depois.

- **`*` e `!important` são aceitáveis aqui** porque a regra dura menos de um
  segundo e porque é isso que ela precisa fazer: vencer, por um instante, as
  transições próprias de cada componente, que têm durações variadas e fariam a
  página trocar de cor aos pedaços.
- **Só cor entra na lista.** `transform` e `opacity` ficam de fora: são o que o
  framer-motion anima, e arrastá-los por 0,55s faria qualquer gaveta aberta
  durante a troca andar em câmera lenta. `background-image` também fica de
  fora — degradê não interpola para outro degradê.
- **Não anima na primeira pintura.** O efeito também roda na montagem, para
  pendurar o tema guardado, e ali não houve troca: a página nasceria esmaecendo
  as próprias cores, como se estivesse carregando. Um `useRef` segura isso.
- **O `clearTimeout` do cleanup não é formalidade.** Trocando de tema duas vezes
  seguidas, a limpeza da primeira tiraria a classe no meio da segunda — e a
  segunda sairia seca. Testado: Candy → Midnight a 300ms mantém a classe e a
  transição.
- **`prefers-reduced-motion` recebe a troca seca.** Mudança de cor sem aviso
  incomoda menos que meio segundo de tudo escorrendo para quem tem
  sensibilidade a movimento.

### Medir transição neste painel engana

`getComputedStyle` leu a cor inicial mesmo depois de a transição ter acabado —
o painel congela o `requestAnimationFrame` quando não está pintando, e a
transição não avança. **Tirar um screenshot força a repintura**: logo depois, a
mesma leitura deu `rgb(242,240,236)`, entre o moss e o nockout. Já estava
registrado mais acima nesta documentação, e mesmo assim passou por bug.

## O alinhamento dos filtros

Três defeitos, todos medidos no navegador e não no olho:

**Três alturas numa coluna só.** Chips davam 40px, os glifos de tipo 44 e a
seta da ordem 42, porque cada um deixava a altura sair do conteúdo. Agora todo
controle do painel leva `h-10` cravado — uma altura, medida: `alturasUnicas: [40]`.

**Rótulos 2px à direita das caixas.** O `pl-0.5` herdado tentava alinhar o
rótulo com o TEXTO dentro da pastilha (que tem `pl-3.5`), e não alinhava com
nenhum dos dois. Saiu: rótulo de grupo alinha pela caixa do controle.

**Cinco blocos, três sem rótulo, flutuando.** (Virou outra coisa de novo — ver "O par ligado" e "A ordem dos grupos" no fim.) Viraram **três**, por natureza do
que perguntam:

1. **A sua relação com a obra** — tenho/quero, lido/não lido, urgentes,
   importados. Todos interruptores do mesmo tipo, duas fileiras a `gap-2` uma
   da outra. Os fios separam as perguntas DENTRO da fileira; entre fileiras não
   precisam.
2. **O que a obra é** — tipo (glifos) + edição, editora, país, autor. Existiriam
   igual se a obra não fosse sua, e por isso entraram todos sob um rótulo só. O
   tipo estava num bloco próprio entre os dois, sem título, como se fosse de
   outra natureza.
3. **Ordenar**.

O espaço entre blocos subiu de `gap-5` para `gap-6`: com blocos de verdade, a
distância entre eles precisa ser maior que a de dentro deles.

---

## O par ligado, e a barra que aceita os dois

"Tenho" e "Quero" não são dois interruptores independentes — são as duas
respostas possíveis à MESMA pergunta, e uma obra nunca é as duas coisas.
Soltos lado a lado, nada dizia isso: pareciam dois botões quaisquer que por
acaso estavam perto.

Viraram **um controle**, com as três respostas dentro:

```
┌───────────┬───┬───────────┐
│   Tenho   │ / │   Quero   │
└───────────┴───┴───────────┘
```

**A barra do meio é o estado neutro** — "tanto faz", que é o que o antigo botão
"Todos" dizia com uma palavra. A barra diz o mesmo com o sinal que já significa
isso em português escrito: "tenho/quero" se lê como um ou outro, e é exatamente
o recorte que ela aplica. É a regra de "fugir das palavras" aplicada ao caso em
que ela rendeu mais, porque a palavra que saiu era a mais repetida do painel.

É `radiogroup` com três `radio`, e não três interruptores: são faces de uma
escolha só, sempre com uma marcada. O grupo leva `aria-label` mesmo sem rótulo
visível ("Tenho ou quero", "Lidos ou não lidos"), e a barra se chama "Todos" em
voz alta — sem isso, quem ouve recebe três botões soltos sem saber de que
pergunta são resposta.

**Só os pares ganharam essa forma.** "Urgentes" e "Importados" continuam chips
soltos: são booleanos independentes, uma obra pode ser os dois. A diferença de
forma é honesta — ali se escolhe entre, aqui se liga.

#### E os dois são das cores das marcas que procuram

Estes dois chips **não usam o acento do tema**, e são os únicos do painel que
não usam. Urgente é o selo vermelho (`rust`) do canto do cartão; importado é a
etiqueta azul (`blue`, a mesma do `pill-imp`) da mesma obra. Vestindo a cor da
marca que procuram, a ligação entre o botão e o que vai acender na grade não
precisa de legenda. Os outros controles seguem no acento porque não procuram
marca nenhuma: procuram um recorte.

**Dois estados, sempre.** Apagado é a cor lavada (`tinta-rust`, `tinta-blue`)
com a tinta dela por cima; aceso é a cor cheia com tinta clara, igual ao selo
do cartão. Pintar o chip de um jeito só economizaria uma regra e custaria a
única coisa que o chip precisa dizer: se o filtro está ligado. Contraste
medido: `rust` sobre `tinta-rust` 5,3:1 e branco sobre `rust` 6,5:1; `blue`
sobre `tinta-blue` 5,9:1 e branco sobre `blue` 7:1.

As cores entram por um mapa `CORES` com `moss` como padrão, e não por classes
soltas no JSX: o `Chip` continua um componente só, e um terceiro chip colorido
amanhã é uma linha no mapa.

## A ordem dos grupos: afunilar → condições → ordenar

**Afunilar primeiro** porque é o corte que mais reduz a estante, e porque quem
abre o painel quase sempre quer chegar a uma obra — e chega por autor ou
editora, não por "tenho". **Condições** refinam o que o afunilamento deixou.
**Ordenar por último** porque não recorta nada: só decide a ordem do que sobrou.

"Condições" é o nome certo para o segundo grupo: é o que depende de VOCÊ, não
da obra. A mesma obra muda de condição conforme a estante de quem olha.

## O véu dos pop-ups: vidro canelado

Era `bg-veu backdrop-blur-xl` — tinta a 50% e um borrão uniforme. Funciona, e é
o mesmo borrão de todo aplicativo.

Vidro canelado não borra por igual: é uma sucessão de meias-canas verticais,
cada uma com uma barriga grossa, que embaralha quase tudo, e uma quina fina,
por onde ainda se enxerga. CSS não refrata, mas dá para imitar o que importa:
**duas camadas de `backdrop-filter` com forças diferentes, recortadas por
máscaras complementares de listras verticais**.

```
::before   blur(26px)   →  a barriga da cana
::after    blur(7px)    →  a quina entre elas
```

- **As máscaras têm borda macia**, não corte seco. Com paradas duras as faixas
  viram código de barras; a passagem gradual é o que faz a listra parecer a
  curvatura de uma cana.
- **14px por cana.** Abaixo de ~8px vira chuvisco; acima de ~24px o conteúdo
  atrás volta a ser reconhecível na quina.
- **A sombra do fio** vai no `background` do `::after`, que pinta DEPOIS do
  `backdrop-filter` da própria camada — é a única forma de ela não ser borrada.
- **A tinta mora na própria classe** (`--veu`, em `:root`, junto de `--linha` e
  `--separador`), não num `bg-veu` do Tailwind na lista de classes. Eram dois
  lugares definindo a mesma superfície, e mexer na opacidade pedia uma mudança
  no `tailwind.config.js` — que neste projeto ainda obriga a reiniciar o
  servidor para valer. Hoje é `--veu-alfa` (.58) MULTIPLICADA pela força de
  entrada — ver a seção sobre `opacity` e backdrop root no fim. Subiu de 50%
  para 58%: com o canelado, a quina de
  cada cana deixa passar mais imagem que o borrão uniforme deixava.

### `z-index: -1` nos pseudo-elementos não é detalhe — é o que faz funcionar

Na maioria dos pop-ups deste app a folha é **filha** do véu, não irmã (o
`onClick` que fecha ao clicar fora depende disso). E `::after` é, por
definição, o ÚLTIMO filho: ele pintava DEPOIS do conteúdo, então o borrão e as
listras caíam por cima do próprio pop-up — título, faixas de tema e texto
saíam canelados junto com o fundo.

**Só aparecia em alguns.** No painel de Filtros a gaveta é IRMÃ do véu, e ali
nunca houve problema: o mesmo CSS com dois resultados conforme a árvore de quem
o usa. Testar num só não bastava.

Com `z-index: -1` os dois pseudos entram na camada que pinta ACIMA do fundo do
véu e ABAIXO do conteúdo em fluxo. O véu já forma contexto de empilhamento
(`position: fixed` com `z-index`), então o -1 não escapa para trás da página.

E saiu o `isolation: isolate` que estava ali: não era necessário — o contexto
já existia — e `isolation` é uma das propriedades que podem formar um
**backdrop root**, o que faria o `backdrop-filter` parar de enxergar a página
atrás do véu e passar a filtrar o nada.

**Como provar que a tinta compõe:** trocar `--veu` por um vermelho forte pelo
console e tirar um screenshot. Se o fundo fica vermelho e o pop-up continua
limpo, as camadas estão na ordem certa. Medir `backgroundColor` só prova que a
regra existe, não que ela pinta onde se pensa.
- **Dois caminhos de recuo**: `@supports not (mask-image)` volta ao véu liso, e
  abaixo de 640px também — numa tela estreita as canas ficam da largura de um
  dedo, e são duas camadas de backdrop-filter em tela cheia no aparelho mais
  fraco.

**Custo:** é o filtro mais caro do CSS, e isto dobra. Vale porque só existe
enquanto um pop-up está aberto, e enquanto ele está aberto nada mais anima.

### Medir isto no painel do Claude engana (de novo)

`innerWidth` deu **0** e a media query de 640px bateu, então a leitura mostrou o
recuo de celular num painel de 1280px. É o mesmo congelamento de rAF já
registrado: **tirar um screenshot antes de medir**. Depois disso, `blur(26px)` e
máscara presente, como esperado.

## Achado: blob sem `obras` derruba a conta junto

`loadInitial` só aceita o blob guardado se `Array.isArray(d.obras)`; qualquer
outra coisa cai no retorno de fallback, que devolve `conta: CONTA_VAZIA()`.

Ou seja: se `gibiteca_v1` corromper — e o app PREVÊ isso, tem a faixa
`dadoIlegivel` para o caso —, a pessoa não vê a faixa. Ela é jogada para a tela
de login, porque o portão exige `conta.email`, e conclui que perdeu tudo e que
precisa se cadastrar de novo.

Descoberto por acidente, com uma fixture de teste sem `obras`. Não corrigido:
separar a leitura da conta da leitura da coleção é uma decisão de produto, não
uma limpeza.

---

## `opacity` animada mata `backdrop-filter` dos filhos

O véu entrava em três etapas visíveis: **sem borrão → canelado → desfoque**.
Parecia engasgo de desempenho. Não era.

O véu era um `motion.div` com `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`.
E **`opacity < 1` forma um backdrop root**: enquanto a opacidade está no meio do
caminho, o `backdrop-filter` dos descendentes não enxerga mais nada atrás — ele
filtra o vazio. Aos 220ms, quando a opacidade bate exatamente em 1, o backdrop
root desaparece e o borrão entra de uma vez.

Ou seja: a animação de entrada do véu estava, por construção, **desligando o
efeito que ela deveria revelar**. As "etapas" eram o nada, seguido do salto.

A mesma armadilha vale para `filter`, `mask`, `mix-blend-mode` e `isolation`
num ancestral — todos formam backdrop root. Num app que usa `backdrop-filter`,
qualquer uma delas num pai é um bug esperando a hora.

### A saída: uma força, não uma opacidade

O véu não anima mais `opacity`. Ele anima **`--veu-forca`**, de 0 a 1, e a CSS
pendura três coisas nela:

```css
.veu-canelado           { background: rgb(33 33 33 / calc(var(--veu-alfa) * var(--veu-forca))) }
.veu-canelado::before,
.veu-canelado::after    { opacity: var(--veu-forca) }
```

```jsx
initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }}
```

- **Tinta e canelado entram juntos** porque saem do mesmo número. Não há como
  um chegar antes do outro — é uma variável, não dois ajustes paralelos.
- **O elemento nunca fica com `opacity < 1`**, então o backdrop root não
  aparece e o borrão é real desde o primeiro quadro.
- **A opacidade foi para os pseudo-elementos**, onde não faz mal: ali ela
  afeta só a composição da própria camada, não o que está atrás dela.
- **É mais barato.** O borrão é calculado uma vez e só o composite varia;
  animar o RAIO (`blur(calc(26px * …))`) recalcularia o desfoque a cada
  quadro, que é o filtro mais caro do CSS.
- O framer anima variável CSS nativamente (v11), então não foi preciso
  `@property` — ele escreve a variável em linha a cada quadro.

`--veu-alfa` (`.58`, em `:root`) é a opacidade com a força cheia. Fica como
número sem unidade, e não como cor pronta, justamente porque quem a usa
multiplica pela força.

### Por que isto não apareceu nos testes

Medir não pegou: `getComputedStyle` em qualquer momento depois do fim da
animação mostra tudo certo, porque no fim ESTÁ certo. O defeito só existe
durante os 220ms, e o painel do Claude congela o rAF quando não está pintando
— então nem a animação avança para ser amostrada.

**O que pega:** travar a variável num valor intermediário pelo console
(`style.setProperty('--veu-forca','0.35')`) e tirar um screenshot. Se o borrão
aparece parcial, está vivo no meio do caminho; se some, há um backdrop root no
caminho. Em 0,35 o desfoque é leve e as canas mal se veem; em 0,75 os dois já
estão quase cheios — contínuo, e juntos.

---

## A primeira vez de quem já usava o app

A conta nasceu depois da coleção. Quem já tinha obras guardadas abria o app,
caía na tela de entrar, digitava o próprio e-mail e recebia um erro vermelho:
*"Não encontramos conta com esse e-mail neste navegador."*

Tudo funcionava — a coleção estava intacta e o cadastro a preservava —, mas a
tela dizia o contrário do que estava acontecendo. Três correções:

**A tela abre no CADASTRO quando não há conta neste navegador.** A tela de
entrar é um beco sem saída nesse caso: não existe servidor onde procurar, então
o e-mail nunca vai ser encontrado e a única resposta possível é um erro. Abrir
direto no cadastro mostra primeiro o caminho que funciona. O link "Já tem
conta? Entrar" continua ali. Um código pendente ganha de tudo: havendo um em
andamento, é nele que a tela abre, com ou sem conta.

**A mensagem separou dois casos que eram um só.** Sem conta nenhuma não é erro
de quem digitou — é o estado normal de quem já usava o app, ou de um navegador
novo. Conta de OUTRO e-mail é outra história, e aí o aviso vermelho está certo:
*"Este navegador tem conta com outro e-mail."*

**O cadastro dizia que a coleção estava a salvo — e não diz mais.** O aviso
("as N obras que já estavam neste navegador continuam aqui") foi retirado na
limpeza de textos. Era uma frase correta respondendo a uma pergunta que a tela
levantava: explicar que o cadastro não apaga a estante faz pensar que podia
apagar. O comportamento continua o mesmo, e está verificado logo abaixo; o que
saiu foi só a legenda.

### Por que a coleção sobrevive

`criarConta` escreve `conta`, `perfil` e a sessão. Não encosta em `obras`,
`listas` nem `fila`. Verificado de ponta a ponta: 142 obras antes do cadastro,
142 depois, com a conta e o perfil criados.

Vale repetir porque o contrário seria catastrófico e silencioso — e porque o
caminho ao lado faz exatamente isso: `apagarConta` passa pelo `applyData` com a
coleção vazia. Os dois mexem nas mesmas três chaves; só um deles também zera a
estante.

---

### A ficha da obra perdeu o eco

A tela tinha um painel de quatro números no topo (Status · Tipo/Na estante ·
Nota · Investido) e, abaixo, os controles que editavam esses mesmos valores.
**Cinco fatos apareciam duas vezes**, e o tipo três:

| fato | painel | lista rotulada | Situação |
|---|---|---|---|
| Status | ✅ | — | ✅ switch |
| Tipo | ✅ | ✅ | — |
| Nota | ✅ | — | ✅ estrelas |
| Investido | ✅ | — | ✅ campo |
| Volumes | ✅ | ✅ | ✅ seção própria |

**O preço truncado era sintoma disso.** "R$ 67,45" aparecia como "R$ 67,…"
porque estava sendo espremido numa célula de meia largura com `truncate` — uma
célula que só existia para ecoar o campo que ficava 300px abaixo. Dando a ele
uma linha, o problema sumiu sozinho; não foi preciso mexer em largura nenhuma.

**O painel saiu inteiro.** Cada fato passou a aparecer uma vez, no lugar onde
se mexe nele. Quem só lê virou selo.

#### O que mudou de lugar

- **capa e título ficaram lado a lado.** Sem a grade, a capa ficaria sozinha ao
  lado de um vazio. Capa e nome são a mesma informação dita de dois jeitos, e
  lê-las juntas é mais rápido que lê-las em sequência;
- **edição, origem e país viraram selos** (`.pill`, a mesma linguagem do
  cartão da galeria). Eram linhas de uma lista rotulada — um rótulo para uma
  palavra. São etiquetas: valores curtos de conjunto fechado, que se
  reconhecem pela forma antes de serem lidos;
- **a autoria subiu para debaixo do título**, que é onde se procura por ela;
- **o link do Guia fechou a linha dos selos**, empurrado para a direita. Tinha
  bloco próprio e, sem a lista que ele acompanhava, ficou boiando entre dois
  espaços em branco. Ele é "mais sobre esta obra, em outro lugar" — da mesma
  natureza dos selos.

#### "Nacional · Brasil" era a mesma coisa duas vezes

O país só aparece quando **acrescenta**: numa edição importada, ou quando não é
o Brasil — um mangá nacional vindo do Japão mostra `NACIONAL` e `JAPÃO`, uma
graphic novel brasileira mostra só `NACIONAL`.

#### "Edição nacional", não "Nacional"

Sozinhas, as palavras eram ambíguas: "Importado" ao lado do nome de um
quadrinho lê como se a OBRA fosse estrangeira, quando o que é importado é
esta EDIÇÃO — um Batman publicado pela Panini é obra estrangeira e edição
nacional. Com o substantivo na frente, o selo diz de que está falando.

"Importada" no feminino, concordando com edição.
#### O status e o tipo não viraram selo nenhum

Chegaram a virar, e saíram na rodada seguinte — pelo motivo que criou esta
tela.

**O status** porque o seletor Quero/Tenho está logo abaixo: um selo acima dele
era a mesma pergunta respondida duas vezes na mesma tela. O seletor ganha, e
não por sorteio — ele não só informa, deixa mudar. Em série e box, onde não há
seletor, quem responde é a seção de Volumes, com o número exato ("2 de 3") em
vez de um sim ou não que seria sempre impreciso.

**O tipo** porque "Avulso" é o caso comum, e dizer o óbvio é ruído. Uma obra
sem lista de volumes é avulsa; uma com lista é série ou box — e a própria
seção de Volumes mostra isso melhor do que a palavra faria.

Sobrou uma linha de selos curta e honesta: edição quando existe, origem, e o
país quando ele acrescenta. Numa graphic novel brasileira é um selo só.

#### A autoria com transbordo

Dois nomes à vista, o resto atrás de um `+N` que vira `−`. Uma obra de cinco
autores enchia três linhas logo abaixo do título e empurrava o resto para fora
da tela — e ninguém abre uma ficha para conferir o quinto nome.

**Dois, e não três ou quatro:** é quase sempre o roteirista e o desenhista, a
dupla que nomeia um quadrinho. O corte cai exatamente onde a informação deixa
de ser identificação e passa a ser elenco.

Os nomes extras entram **dentro do mesmo `<span>`** da lista, não como irmão
dele: separados, o `gap` do flex abria um buraco antes da vírgula e a frase lia
"Fulano, Beltrano , Sicrano".

#### Uma armadilha de `text-transform`

O selo do tipo saía em caixa mista no meio de selos em caixa alta: `.pill` já
traz `uppercase`, e um `capitalize` junto escreve a MESMA propriedade — quem
ganha é a última regra do CSS, não a ordem das classes no elemento. A correção
é não pôr a segunda.

#### Medido

Com a obra mais difícil da coleção de teste (5 autores, importada, lida, com
nota), **a ficha inteira cabe numa tela de celular sem rolar**: 514px de
conteúdo em 514px de altura visível. Antes, só o cabeçalho e a lista rotulada
já passavam disso.

`avgNota`, `sumValor`, `fmtBRL` e o componente `Numero` saíram junto com o
painel — não sobrou nada deles no arquivo.

## A ficha da obra virou o lugar de editar a relação

Situação e Anotação **saíram do editor** e passaram a morar na ficha
(`DetailSheet.jsx`), editáveis ali mesmo.

A divisão que isso cria vale mais que a mudança de lugar:

> O editor descreve a OBRA. A ficha descreve a sua RELAÇÃO com ela.

Título, autoria, editora, país e tipo existiriam igual se a obra não fosse
sua. Status, urgência, leitura, nota, valor pago e anotação só existem porque
ela é. E são justamente os que mudam toda semana, enquanto o resto nunca muda.
Abrir um formulário de doze campos para marcar "li" era pedir o gesto grande
para a mudança pequena — e logo para a que acontece mais.

**Salva sozinho, sem botão.** Não há o que confirmar: cada controle é uma
decisão completa em si, e um "Salvar" aqui só serviria para alguém esquecer de
apertar. **A anotação é a exceção** — guarda no `blur`, não a cada tecla.
Escrevendo direto no store, cada letra viraria uma gravação em disco e um
agendamento de envio para a nuvem.

**As normalizações são as MESMAS do editor, de propósito** (`gravar()`, em
`Situacao`): obra que não é sua não tem valor pago nem nota; obra que é sua não
é "urgente", porque urgência é a pressa de comprar. Sem isso, a ficha deixaria
para trás combinações que o editor nunca produz, e os dois caminhos passariam a
gerar obras diferentes a partir da mesma escolha.

**Para série e box, nada disso aparece.** Ali status, leitura, nota e valor são
de cada volume, e a lista de volumes logo abaixo é onde eles moram. Uma "nota
da série" seria uma média disfarçada de escolha.

**A ficha precisa reler a obra do store a cada render:**

```js
const obra = (obraAberta && obras.find(o => o.id === obraAberta.id)) || obraAberta
```

Sem isso ela mostra o retrato tirado na hora de abrir: a edição grava certo e a
tela não reage. É o tipo de bug que parece "não salvou".

### Os controles de formulário saíram para `Campos.jsx`

`Switch`, `CheckTile`, `lbl` e `box` moravam dentro do `Editor.jsx` enquanto o
editor era o único lugar onde se escrevia sobre uma obra. Deixou de ser. Dois
arquivos usando controles duplicados é o tipo de coisa que diverge sem ninguém
perceber: um ganha um estado de foco, o outro não, e a mesma pergunta passa a
ter duas caras dependendo da porta por onde se entrou.

### Lido e a fila dividem a linha, e um substitui o outro

`Lido` e `Salvar na fila` ficam lado a lado. **Ao marcar Lido, o botão da fila
dá lugar às estrelas.** Os três nunca são úteis ao mesmo tempo: fila é o que se
vai ler, nota é o que já se leu. Mostrar os dois obrigaria a desenhar a
pergunta "qual destes se aplica?" que a própria marcação já responde.

Dar nota ao que não se leu é pergunta sem resposta possível — por isso as
estrelas não existem antes do visto, e desmarcar Lido zera a nota.

**São TRÊS na mesma linha**, com o valor pago: quanto custou, já leu, e o que
falta fazer com isso. São as três perguntas que se fazem de um gibi que já está
na estante, e empilhadas viravam três blocos para um assunto só.

**O campo de valor tem 100px fixos.** Em largura inteira ele era o elemento
mais pesado da ficha para guardar "R$ 29,90" — oito caracteres ocupando 409.
Campo de tamanho fixo também diz, só pela forma, que ali cabe pouco.

**`items-end`, não `items-center`:** o campo de valor tem rótulo em cima e os
outros dois não, então alinhar pelo centro deixaria o "Lido" flutuando meio
dedo acima da linha de base dos controles.

**A vaga é `flex-1`, e por isso o "Lido" não anda ao trocar de ocupante.** Ele
vem ANTES do elemento elástico, e quem absorve a diferença é sempre quem vem
depois. (Antes do campo de valor entrar na linha, isso exigia uma largura fixa
de 210px na vaga; com três elementos, o elástico no último resolve de graça.)

Medido nos dois estados, desktop: campo 100@831, "Lido" 85@941, vaga 214@1036,
altura 58 — **idênticos** antes e depois de marcar Lido.

**`min-w-[200px]` + `flex-wrap` em vez de ponto de quebra por tela.** Abaixo de
uns 405px de linha não há como pôr os três lado a lado sem espremer "Salvar na
fila" até sumir. Escolher o ponto por tamanho de tela erraria, porque a ficha é
larga no desktop e estreita no celular com a MESMA janela — ela é um painel de
460px num caso e tela cheia no outro. A vaga declara a largura mínima de que
precisa e desce sozinha quando não cabe: no celular, valor e "Lido" ficam na
primeira linha e a vaga ocupa a segunda inteira (325px).

> **Medir isto logo depois de trocar o tamanho da janela engana.** Sem recarregar,
> a ficha fica com a geometria do tamanho anterior e a vaga mede 368px numa tela
> de 375 — que parece transbordamento e não é. Recarregando, dá 325 e
> `scrollWidth === innerWidth`.

#### A caixa de nota

As estrelas ganharam moldura e o nome "Nota" (`CaixaNota`). Soltas, não liam
como um campo: liam como um enfeite que apareceu — o "Lido" tem contorno, o
botão da fila tem contorno, e no meio deles a nota era a única coisa flutuando.
A moldura põe os dois ocupantes da vaga na mesma forma, que é o que faz um
parecer ter dado lugar ao outro.

**O nome vai DENTRO da caixa**, e não como rótulo em cima ao jeito de "Valor
pago": um rótulo acima cresceria a linha para cima e empurraria o "Lido" —
justamente o que a largura fixa existe para evitar.

Estrelas de 20px em vez de 24, para caber o rótulo e o ×; o alvo de toque
continua de 42px, que é a altura da caixa. Conteúdo com os vãos: 178px dentro
de 192 úteis, com as cinco estrelas e o ×. É apertado de propósito e está
medido — mexer no rótulo ou no tamanho das estrelas exige medir de novo, e a
conta tem de fechar contra o `min-w` da vaga, não contra a largura do desktop.

#### Máscara de dinheiro só existe em campo controlado

O campo de valor pago nasceu aqui com `defaultValue` + `onBlur`, para não
gravar no disco a cada tecla. Com isso **a máscara nunca rodou**: `defaultValue`
é lido uma vez, na montagem, e depois o React não toca mais no campo. Digitava-se
`2990` e ficava `2990` na tela, sem virar `R$ 29,90` nunca. O Editor sempre
funcionou porque lá o campo é controlado (`value` + `onChange`).

A solução é um **rascunho local**: o campo é controlado por um `useState`
próprio, cada tecla reformata na tela, e só o `blur` grava no store. As duas
coisas que pareciam incompatíveis — formatar a cada tecla e gravar uma vez só —
eram incompatíveis apenas enquanto o único estado era o do store.

O `useEffect` que sincroniza com o valor de fora existe porque trocar o status
para "Quero" zera `valorPago` (ver `gravar`); sem ele, o campo voltaria a
exibir o rascunho antigo quando a obra voltasse para "Tenho". **Só sincroniza
com o campo sem foco** — sincronizar durante a digitação faria o cursor saltar.

Verificado com digitação real: `2990` → `R$ 0,02`, `R$ 0,29`, `R$ 2,99`,
`R$ 29,90`, e `45,50` no store depois do clique fora, com o painel "Investido"
do topo acompanhando.

> `inp.blur()` por script NÃO dispara o `onBlur` do React neste painel. Num
> teste automatizado isso lê como "não gravou". Com clique de verdade, grava.

**O "limpar" virou um ×.** `EstrelasInput` ganhou a prop `limpar` (padrão
`true`, então Editor e Fila não mudaram); a ficha passa `false` e desenha o
próprio botão, que ocupa 18px em vez de 44. Sem ele não haveria como voltar a
zero: clicar na estrela marcada vai para a metade dela, e da metade volta para
a inteira — zero é inalcançável pelas estrelas.

### O cabeçalho da ficha: estado à esquerda, ação à direita

**Esquerda:** fixar e urgente. São ESTADOS da obra — ela é o destaque da
grade, ela é urgente.
**Direita:** duplicar, Editar, fechar. São AÇÕES sobre a ficha.

A divisão se lê sem legenda, e nenhum botão que liga e desliga fica encostado
num que dispara e acaba.

**Os dois da esquerda têm contorno permanente.** Botão que acende precisa de
moldura já apagado: sem ela, o estado ligado não parece ligado, parece um botão
que surgiu do nada onde não havia nada.

> **Armadilha:** `.neo-icon` traz `border-0`. Pedir só a COR da borda
> (`!border-rust`) pinta uma linha de zero pixel e nenhum contorno aparece. O
> `!border` tem de ser explícito.

**Urgente é só ícone, e vermelho nos dois estados.** Era uma caixa de marcação
de largura inteira no corpo para uma coisa que é sim ou não. Urgência é a única
coisa da tela que usa rust, então a cor identifica o botão antes de dizer se
ele está aceso. Ligado = fundo `tinta-rust` (`#f0e2da`) e um VISTO de 14px
encostado no canto superior direito, com `ring-2 ring-surface`. O triângulo não
muda: quem carrega o estado é o par fundo+visto, e o visto é o que diz "está
marcado" para quem não lê a diferença entre um branco e um rosa muito claro.
Forma além de cor, como no resto do app. O canto é o de cima à direita porque é
onde o triângulo afina; embaixo o visto cairia sobre a base, que é a parte
larga da figura.

**Urgente só aparece em obra avulsa que você ainda NÃO tem** — urgência é a
pressa de conseguir, e o que já está na estante não tem pressa nenhuma. Em
série, a pressa é de cada volume.

**Fixado pinta a faixa inteira em `moss`** (o acento do tema da vez, então
acompanha o tema sozinho); solto fica com o contorno `contorno` e fundo
transparente.

### O link do Guia dos Quadrinhos encolheu

Era um botão de largura inteira competindo com o conteúdo da ficha. Virou texto
de apoio alinhado à direita (`text-apoio text-ink-faint`), com uma setinha de
saída. Continua sendo o mesmo atalho de sempre — **nunca raspagem**, ver a
seção própria.

---

## Limpeza de textos

Saíram da interface, sem substituto:

- *"Sem senha: mandamos um código para o seu e-mail."*
- *"Depois mandamos um código para confirmar o e-mail."*
- *"As N obras que já estavam neste navegador continuam aqui — a conta é nova,
  a coleção não. Criar a conta não mexe nela."*
- *"A escolha vale na hora e fica guardada neste navegador."*

Trocados:

| antes | agora |
|---|---|
| Serve para o filtro de conteúdo adulto. Não aparece para ninguém. | Essa informação não será compartilhada. |
| Nada por aqui. Sua coleção está vazia neste preview. Clique em Backup (no topo) e carregue seu gibiteca-dados.json pra ver tudo aqui. | Sua coleção está vazia! Adicione uma nova obra por aqui, para organizarmos tudo. |
| voce@exemplo.com | nome@exemplo.com |

O fio comum: **explicar o mecanismo levanta a dúvida que ele deveria acalmar.**
Dizer que criar a conta não apaga a coleção faz pensar que podia apagar; dizer
que a data de nascimento "não aparece para ninguém" faz pensar em quem poderia
vê-la. A versão curta afirma, a longa se defende.

O vazio da coleção ficou com **dois títulos diferentes** (`Collection.jsx`), e
isso é regra, não detalhe: estante vazia é um convite — não há o que fazer além
de começar. Filtro sem resultado é um beco — a coleção existe, o recorte é que
não achou nada, e o que se faz é mexer no recorte. Um título só para os dois
mandaria a mesma pessoa fazer coisas opostas.

---

## Configurações, e o véu do conteúdo adulto

### O menu perdeu duas portas e ganhou uma

Capas e Backup saíram do ☰ e entraram em **Configurações**. Não são da mesma
família das outras: Fila, Listas e Estatísticas são jeitos de **olhar** a
coleção; Capas e Backup são **manutenção do aplicativo**. Um menu que mistura
"ver minhas listas" com "exportar o arquivo" obriga a ler todos os rótulos
toda vez.

Dentro de Configurações elas reencontram os companheiros naturais: o ajuste de
conteúdo, os documentos, a versão e a limpeza. Tudo sobre o APP, nada sobre o
acervo. O menu foi de oito portas a sete.

**O molde é o mesmo** do Tema e do Backup — mesma moldura, mesma entrada,
mesmo título em caixa alta. E a lista interna tem **uma forma só** para coisas
de naturezas diferentes (um botão que abre outra tela, um interruptor, um dado
que só se lê): é o que deixa a lista ser varrida de cima a baixo sem o olho ter
de reaprender onde olhar a cada linha.

- **Capas e Backup fecham este pop-up e abrem o deles.** Empilhar painel sobre
  painel faria duas camadas de véu e dois × no mesmo canto;
- **os documentos abrem POR CIMA**, sem fechar: são leitura de apoio, e quem
  os abre daqui quer voltar para cá;
- **a versão sai do `package.json`** em tempo de build (`__VERSAO__`, definido
  no `vite.config.js`), e não cravada no componente: número de versão escrito à
  mão é número de versão que um dia mente.

### A trava de idade

Os Termos e a Ajuda já prometiam: só quem informou a data de nascimento e
tem 18 anos ou mais consegue ligar o ajuste. Agora o código cumpre.

**A trava NÃO mora na tela do interruptor.** O store expõe dois valores:

| valor | o que é |
|---|---|
| `verAdulto` | `perfil.mostrarAdulto && maiorDeIdade(conta.nascimento)` — o que TODO desenho de capa pergunta |
| `podeAdulto` | só a idade — o que a tela usa para travar o botão |

Se cada tela olhasse `perfil.mostrarAdulto` direto, a trava valeria só no
botão: **bastaria restaurar um backup de conta adulta numa conta de menor**
para o ajuste chegar ligado e o véu sair. Com a conta entrando na conta, o
dado sozinho nunca basta.

Medido exatamente nesse caso: dado gravado `mostrarAdulto: true`, conta de 14
anos — o interruptor aparece **desmarcado e impedido**, clicar não faz nada, e
**a capa continua velada**. Sem data de nascimento, o mesmo, com outra frase.
Com conta adulta, tudo destravado e nenhuma capa velada.

**A frase do impedimento ficou**, ao contrário das legendas que saíram do
painel: ela não repete o rótulo, diz por que o interruptor não obedece.
Interruptor morto sem explicação é a tela escondendo o motivo justamente de
quem mais precisa dele.

> `criarConta` monta o perfil do zero e **perdia o `mostrarAdulto`**. O campo
> nasceria `undefined` — falsy, então o véu até ficaria no lugar certo, mas o
> perfil sairia sem a forma que o resto do app espera. Agora vai explícito.

### O Tema abre sozinho ao fim do cadastro

É a primeira coisa que se pode escolher nesta casa, e a única que muda a cara
do app inteiro — mostrá-la de saída transforma o primeiro segundo de quem
chegou, que seria uma estante vazia, numa escolha.

**Só no cadastro, não no login:** quem volta já escolheu o tema dele, e
reabrir a cada entrada seria pedir a mesma decisão para sempre.

O sinal é um `recemCadastrado` que o `criarConta` levanta e o App consome uma
vez, apagando a marca ANTES de abrir — para o efeito não reentrar se o React
remontar. **Vive só em memória**, de propósito: recarregar a página não é
cadastrar de novo, e um flag guardado reabriria o Tema para sempre.

Medido no fluxo real (cadastro → código → entrada): o Tema abre. Recarregando
em seguida, com a sessão viva, **não abre**.
### As linhas de apoio saíram

Cada item de Configurações tinha uma frase explicando o óbvio por baixo do
rótulo — "Salvar ou restaurar a coleção num arquivo" debaixo de **Backup**,
"Enviar várias capas de uma vez" debaixo de **Capas**, "Com o ajuste
desligado, as capas marcadas como +18 saem embaçadas" debaixo do
interruptor. Saíram todas, junto com duas irmãs no editor ("A imagem fica
salva junto no seu backup" e "Abra cada volume para preencher…").

**O rótulo já diz, e a tela já mostra.** Legenda que repete o nome do botão
não ensina nada: ela transforma uma lista que se varre numa lista que se lê,
e dobra a altura de cada linha para isso. É o mesmo fio da limpeza de textos
da entrada — explicar o mecanismo levanta a dúvida que ele deveria acalmar.

A exceção que FICOU é "Não mexe na sua coleção", debaixo de **Limpar cache**.
Ela não explica o botão: ela desarma um medo que o botão cria. É a única
linha do painel que diz algo que o rótulo não dizia.
### Limpar cache: o que sai e o que fica

"Cache" é palavra que assusta justamente quem tem mais a perder, então a tela
diz antes do clique, e a confirmação repete:

| sai | fica |
|---|---|
| o histórico guardado da ficha de atividades (`esquecerFicha`) | **a coleção** |
| os avisos já dispensados | a conta e a sessão |
| o que o navegador guardar em `caches` (service worker) | a configuração da nuvem |

**As chaves que saem estão nomeadas uma a uma**, e o código não varre tudo o
que começa com `gibiteca_`. Varrer por prefixo levaria a coleção junto no dia
em que alguém acrescentasse uma chave nova sem pensar nisto.

**Medido:** antes e depois do clique, 7 obras, perfil, sessão e as chaves
`gibiteca_v1`, `gibiteca_sessao`, `gibiteca_tema`, `gibiteca_fixada` e
`gibiteca_capa` intactas; só o aviso dispensado saiu.

### O véu das capas +18

`obra.adulto` já existia (ver a seção do editor). Agora ele pinta: enquanto
`perfil.mostrarAdulto` estiver desligado, a capa sai borrada em **todo lugar
que desenha capa** — grade, lista, fila, listas e ficha. Uma função só decide
(`capaVelada`, em `helpers.js`), porque a regra não pode divergir entre as
telas.

**O ajuste vive no PERFIL**, não numa chave do aparelho como o tema: é
preferência da PESSOA, não da tela. Guardado ali, viaja no backup e na nuvem
junto com a conta. Nasce desligado, sempre.

#### O borrão fica DENTRO da arte

`filter: blur()` amostra pixels de FORA da imagem: o borrão vaza para além da
arte e, numa capa retrato dentro de uma caixa quadrada, toma também as faixas
vazias dos lados — **a caixa inteira fica embaçada, não a capa**.

`clip-path: inset(0 round 8px)` corta o resultado JÁ FILTRADO no próprio
retângulo da imagem: na ordem da pintura, o recorte vem depois do filtro. O
raio acompanha o `rounded-pequeno` da capa.

**A primeira versão usava `transform: scale(1.08)`** para empurrar a franja
para fora de um pai com `overflow: hidden` — e era justamente isso que
espalhava o borrão pelo quadrado. Saíram os dois: o `scale` e o
`overflow-hidden` que ele exigia (e que de quebra cortava a sombra da capa).

Medido numa capa retrato de 139×194 dentro de uma caixa de 194×194: o borrão
ocupa 139×194, o mesmo espaço das capas nítidas ao lado.

**São 5px, e sem dessaturação.** O véu é LEVE de propósito: a composição se
adivinha inteira, a cor fica, e o que sai é o detalhe — o ajuste não diz "não
dá para ver", diz "não fica exposto na grade". A primeira versão era 16px com
`saturate(.75)`, que apagava a figura por completo e ainda deixava a imagem
doente; com um véu leve, tirar a cor só atrapalha, porque é justamente a cor
que ajuda a achar a obra na grade.

#### Só a ficha revela, e só enquanto se segura

No cartão e na lista o véu **não sai nunca**: ali não há como segurar nada, e
revelar no hover acenderia capa adulta a cada passada de mouse numa grade
inteira.

Na ficha é diferente porque ali já houve uma escolha — você abriu ESTA obra. O
gesto de segurar é o que separa "quero ver" de "esbarrei": um toque acidental
não revela, e soltar devolve o véu sozinho, sem precisar desfazer nada. É o
princípio do "segure para falar": a ação dura o tempo da intenção.

- **o selo** é um disco com borda em rust na frente da capa. Ele é a única
  coisa da ficha que usa rust além da urgência, e pode: as duas são avisos e
  nunca aparecem no mesmo canto. Sai junto com o véu — cobrir a arte que a
  pessoa pediu para ver seria desfazer o próprio gesto;
- **teclado**: `onKeyDown`/`onKeyUp` com Enter e Espaço espelham o segurar. Sem
  isso a revelação seria exclusiva de quem usa ponteiro — e a capa é `<button>`
  justamente para estar no caminho do foco;
- **`onPointerLeave` e `onPointerCancel`** junto do `onPointerUp`: o dedo que
  escorrega para fora e a chamada que interrompe o toque precisam devolver o
  véu também, senão ele fica preso aberto;
- **trocar de obra zera a revelação**: a decisão foi sobre AQUELA capa.

**Obra sem capa não é velada** — o bloco de iniciais não tem arte para
esconder.

#### A armadilha que o build não pega (de novo)

Pôr `perfil.mostrarAdulto` num componente que não chama `useStore()` compila
sem reclamar — é JavaScript válido — e explode em `ReferenceError` ao abrir a
tela. Aconteceu em `EscolherObras` e `TiraDeCapas`, dentro de Listas. É o mesmo
erro do `byPais` nas Estatísticas, e a lição se repete: **depois de espalhar um
valor novo por vários arquivos, varrer o nome dele e conferir se o escopo
existe em cada uso** — o `vite build` não vai contar.

