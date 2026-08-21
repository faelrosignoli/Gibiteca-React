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
- Node **>= 22**. Gerenciador: npm.
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
    helpers.js             # funções puras: coverOf, unitsOf, tipoOf, edOf, statusMatch, avgNota, canon, slugify, fmtBRL, moneyToNumber/Format, tintFor, initials...
    cloud.js               # GitHub Contents API: ghCheckRepo, ghGet, ghPut, b64enc/dec, guessRepo
    motion.js              # tokens de movimento: molas, projeção de momento, elástico das bordas, hooks de viewport e movimento reduzido
  components/
    Header.jsx             # barra ÚNICA do topo: Busca · Filtros · Estatísticas · LOGO (centro) · Galeria/Lista · menu ☰
    (Toolbar.jsx foi absorvido pelo Header — não recriar uma segunda faixa)
    SearchOverlay.jsx      # busca em pop-up (backdrop desfocado)
    Collection.jsx         # grade (Card) + Lista (Ficha) + estado vazio; usa Pagination
    Card.jsx               # card 3D (tilt), sombra dura, selos; SEM brilho de cursor
    Ticker.jsx, Pagination.jsx, Footer.jsx   (Marquee e Resumo foram removidos)
    FiltersDrawer.jsx      # gaveta de filtros (grid content-start para não esticar as linhas)
    DetailSheet.jsx        # painel de detalhe; botão Editar; grade de capas por volume
    Editor.jsx             # cadastro/edição/exclusão (avulso, box, série) + VolPanel + CheckTile + GenrePicker
    GenrePicker.jsx        # sub-modal de seleção de gêneros
    Stats.jsx              # painel de estatísticas (KPIs, médias, histograma, barras) com escopo
    Cloud.jsx              # modal de conexão/sincronização com o GitHub
    BulkCovers.jsx         # envio de capas em massa (casa por nome, sobe p/ covers/)
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
- Texto: `text-ink` → `text-ink-soft` → `text-ink-faint` → `text-ink-mute`.
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
Uma barra única, com o logo no centro:

```
Busca · Filtros · Estatísticas · LOGO · Galeria/Lista · ☰
```

No desktop é uma grade `[1fr auto 1fr]` — só assim o logo fica no centro exato
independente da largura dos dois lados. **No celular o logo sai da pílula**: ele fica
grande (h-16), centralizado acima dela e com respiro de 32px do topo. Ele mora
**fora do bloco fixo** (componente `LogoMobile`, montado pelo `App.jsx`), então
rola junto com o conteúdo — só a pílula de botões acompanha a rolagem.

A pílula é **opaca e sem desfoque**, e não há faixa de fundo atravessando a tela:
o que flutua sobre o conteúdo é a pílula, e só ela.

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
- **barra de progresso** → **não aparece**. Ela conta a série inteira; ao lado
  de um volume, falaria de outra coisa. Só existe em "Todos".

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

### O logo é o botão de recomeçar
Clicar no logo — nos dois, o do topo do celular e o da pílula no desktop —
chama `resetFilters()` e sobe a página. Limpa **tudo**, inclusive a busca, e
volta para a página 1.

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

### Topo fixo
`App.jsx` envolve o `Header` num `sticky top-0`: numa coleção grande a barra de
filtros não pode sumir ao rolar. O bloco não tem fundo nem borda — só a pílula
dentro dele é visível.

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
- Verde: `moss #4B5D3A`, `moss-2 #5E7146`, `moss-3 #879266`, `moss-line #c4cbaf`.
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
  quadrado (`w-full h-full`) com gradiente `tintFor()` + iniciais.
  Fora da grade (Detalhe, volumes) a capa segue no formato natural livre.
- **Selos (.pill):** Tenho = `pill-tenho` (moss cheio), Quero = `pill-quero`
  (suave), Importado = `pill-imp` (azul). Urgente = quadrado `rust` com triângulo
  branco (SVG), no canto superior direito da capa.
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
- Mutações: `upsertObra`, `deleteObra`, `setCovers`, `loadBackup`. Toda alteração
  persiste local e, se a nuvem estiver conectada, **agenda push** (debounce 1,5s).
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
