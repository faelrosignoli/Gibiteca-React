import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_TOQUE, MOLA_GAVETA, MOLA_CALMA, useEhDesktop } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import Marca from './Marca.jsx'
import MarcaAlt from './MarcaAlt.jsx'
import { baixarBackup } from '../lib/backup.js'

/* O logo é o botão de "começar de novo": limpa os filtros (inclusive a busca)
 * e sobe para o topo. É o que se espera da marca em qualquer site — e aqui
 * resolve um beco sem saída real: com filtro apertado a estante fica vazia, e
 * o caminho de volta ficava escondido dentro da gaveta de Filtros.
 */
function useVoltarAoInicio() {
  const { resetFilters, setView } = useStore()
  return () => {
    resetFilters()
    // recomeçar é voltar à estante: se estava no modo lista, volta pra galeria
    setView('galeria')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const ROTULO_LOGO = 'Início — limpar filtros e voltar ao topo'


/* Passou do topo?
 *
 * 24px, não 1px: com a cortina levando 0.9s, disparar no primeiro pixel faria
 * um tremidinho de dedo abrir e fechar o acento inteiro. O limite dá folga para
 * o ajuste de rolagem que o navegador faz sozinho. */
const LIMITE_ROLAGEM = 24
function useRolado() {
  const [rolado, setRolado] = useState(() => typeof window !== 'undefined' && window.scrollY > LIMITE_ROLAGEM)
  useEffect(() => {
    const ver = () => setRolado(window.scrollY > LIMITE_ROLAGEM)
    ver()                                   // a página pode abrir já rolada
    window.addEventListener('scroll', ver, { passive: true })
    return () => window.removeEventListener('scroll', ver)
  }, [])
  return rolado
}

/* Barra única do topo.
 *
 *   em QUALQUER largura:
 *     Busca · LOGO · ☰                   (barra fixa)
 *     COLEÇÃO ········ Filtros · Galeria/Lista   (segunda linha, rola embora)
 *
 * Na página de boas-vindas esta barra NÃO existe — lá só há o logo, grande e
 * solto. Ele chega aqui pelo `layoutId="marca"`: a mesma marca muda de
 * tamanho e de lugar em vez de uma sumir e outra aparecer.
 *
 * O logo mora DENTRO da barra. Antes ele era um bloco solto acima, que rolava
 * embora; agora a marca acompanha a rolagem como em qualquer site, e o que
 * desceu para a segunda linha foi o que é ferramenta, não marca.
 *
 * A segunda linha fica FORA da barra fixa, nos dois tamanhos: ela rola embora
 * com a página. Só a marca, a busca e o ☰ acompanham a rolagem — o que é
 * ferramenta da estante fica com a estante.
 *
 * Houve uma versão em que, no desktop, Filtros e Galeria/Lista moravam dentro
 * da barra. Ficou igual ao celular: a barra tem três peças na mesma grade de
 * três colunas em toda largura, e a marca fica centrada de verdade sempre.
 *
 * É uma BARRA de ponta a ponta. No topo da página ela é papel translúcido com
 * desfoque; quando se enche, um painel do acento sobe por dentro dela e a
 * tinta inverte. Ela se enche quando a página rola e, só no celular, também
 * com o menu aberto — é isso que `comAcento` resolve. A mecânica está em
 * `.barra-topo`, no index.css; aqui só se liga o `data-acento`.
 */
/* `soMarca`: a barra sem ferramenta nenhuma — só o logo no centro.
 *
 * Serve à tela de entrar, que aparece ANTES de haver coleção. Busca, filtro,
 * menu e contagem são todos portas para dados que ainda não existem para
 * quem não entrou; deixá-los ali seria oferecer a estante de outra pessoa.
 *
 * É um modo desta barra e não uma barra própria por causa do `layoutId` da
 * marca: dois elementos com o mesmo id ao mesmo tempo quebram a animação, e
 * uma segunda barra com um segundo logo seria exatamente isso na troca de
 * tela. Assim o logo tem um dono só, do começo ao fim.
 *
 * As CÉLULAS laterais da grade continuam no lugar, vazias. A grade é
 * `1fr auto 1fr`, e é ela que centra o logo — tirando as laterais, o centro
 * deixaria de ser o centro e o logo escorregaria para a esquerda.
 */
export default function Header({ onCloud, onBulk, onAjuda, onBackup, onTema, onFila, onListas, onFilters, onStats, onSearch, filterCount, aberturaNoAr = false, soMarca = false }) {
  const { obras, editoras, loadBackup, sync, view, setView, filters, perfil } = useStore()
  const aoInicio = useVoltarAoInicio()
  const rolado = useRolado()
  const ehDesktop = useEhDesktop()
  const fileRef = useRef(null)
  const barraRef = useRef(null)
  const [menu, setMenu] = useState(false)
  const [alturaBarra, setAlturaBarra] = useState(0)

  /* A barra se enche de acento quando a página rola — e, SÓ NO CELULAR,
     também com o menu aberto.

     O motivo do menu nunca foi "menu aberto", foi o painel não ter onde
     terminar: no celular ele é de tela cheia e encosta na barra, e sobre uma
     barra quase branca os dois viravam uma mancha só. No desktop o menu é uma
     folha flutuante com borda e sombra próprias, que já se delimita sozinha —
     ali tingir a barra era efeito colateral, não solução, e fazia a página
     inteira mudar de cor por causa de um menu de três itens.

     Tudo que muda de cor junto com a cortina olha para isto, não para
     `rolado` — senão o fundo vira acento e os botões ficam na tinta escura. */
  const comAcento = rolado || (menu && !ehDesktop)

  /* O painel de tela cheia começa EMBAIXO da barra, então precisa saber a
     altura dela — que muda entre celular (duas linhas) e desktop (uma). */
  useLayoutEffect(() => {
    if (!menu || !barraRef.current) return
    const medir = () => setAlturaBarra(Math.round(barraRef.current.getBoundingClientRect().height))
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [menu])

  /* A mesma altura publicada como variável CSS, para quem precisa dela no
     ESTILO — hoje a página de boas-vindas, que ocupa "o que sobrou da tela".
     Medir é melhor que cravar 57px: a altura muda com o conteúdo da barra. O
     ResizeObserver cobre tanto o redimensionar da janela quanto mudanças que
     o `resize` sozinho não veria. */
  useLayoutEffect(() => {
    const el = barraRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const medir = () => document.documentElement.style.setProperty(
      '--altura-barra', Math.round(el.getBoundingClientRect().height) + 'px')
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!menu) return
    const noEsc = (e) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('keydown', noEsc)
    return () => document.removeEventListener('keydown', noEsc)
  }, [menu])

  /* Menu aberto em tela cheia trava a rolagem do fundo: sem isso o dedo
     arrasta a estante atrás do painel. */
  useEffect(() => {
    if (!menu || ehDesktop) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [menu, ehDesktop])

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { loadBackup(JSON.parse(r.result)) } catch (_) { alert('Arquivo inválido.') } }
    r.readAsText(f); e.target.value = ''
  }

  const fechar = () => setMenu(false)

  const botaoFiltros = (comRotulo) => (
    <button className="pill-btn !px-3 md:!px-4" onClick={onFilters} title="Filtros">
      <IconFiltros />
      <span className={comRotulo ? "" : "hidden md:inline"}>Filtros</span>
      {filterCount
        ? <span className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-rotulo font-bold transition-colors duration-[450ms]
            ${comAcento ? 'bg-paper text-acento-texto' : 'bg-moss text-sobre-acento'}`}>{filterCount}</span>
        : null}
    </button>
  )

  /* O alternador existe UMA vez só no DOM. Ele carrega um `layoutId`, e dois
     elementos com o mesmo id ao mesmo tempo quebram a animação da pastilha —
     por isso a posição é escolhida em JS, não duplicada e escondida por CSS. */
  const alternadorVista = (
    <div className={`relative inline-flex rounded-full border p-1 transition-colors duration-[450ms] ${comAcento ? 'border-paper/35' : 'border-separador'}`}>
      {[['galeria', 'Galeria'], ['lista', 'Lista']].map(([v, l]) => (
        <button key={v} onClick={() => setView(v)} aria-label={l} aria-pressed={view === v}
          className={`relative inline-flex items-center justify-center gap-1.5 rounded-full min-w-[44px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-3 sm:px-4 py-1.5 text-corpo font-semibold transition-colors duration-[450ms]
            ${view === v
              ? (comAcento ? 'text-acento-texto' : 'text-paper')
              : (comAcento ? 'text-paper/70 hover:text-paper' : 'text-ink-soft hover:text-ink')}`}>
          {view === v && (
            <motion.span
              layoutId="viewToggleActive"
              /* sobre o acento a pastilha escura sumiria: ela inverte junto */
              className={`absolute inset-0 rounded-full transition-colors duration-[450ms] ${comAcento ? 'bg-paper' : 'bg-ink'}`}
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative inline-flex items-center gap-1.5">
            {v === 'galeria' ? <IconGrade /> : <IconLista />}
            <span className="hidden sm:inline">{l}</span>
          </span>
        </button>
      ))}
    </div>
  )

  const conteudoMenu = (
    <ConteudoMenu
      sync={sync} foto={perfil.foto} nome={perfil.nome}
      onPerfil={() => { fechar(); onCloud?.() }}
      onTema={() => { fechar(); onTema?.() }}
      onFila={() => { fechar(); onFila?.() }}
      onListas={() => { fechar(); onListas?.() }}
      onStats={() => { fechar(); onStats?.() }}
      onBulk={() => { fechar(); onBulk?.() }}
      onBackup={() => { fechar(); onBackup?.() }}
      onAjuda={() => { fechar(); onAjuda?.() }}
    />
  )

  return (
    <>
    <header className="barra-topo" data-acento={comAcento ? '1' : '0'} ref={barraRef}>
      <div className="mx-auto w-full max-w-[1320px] px-3 sm:px-5">
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />

        {/* ---- primeira linha: a grade de três colunas põe o logo no centro
             exato, independente da largura dos dois lados ---- */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-2 sm:py-2.5">

          {/* esquerda */}
          <div className="flex items-center gap-1.5 justify-self-start">
            {/* Sem contorno, e por isso o MESMO `isl-icon` do ☰ do outro lado —
                não uma `pill-btn` com a borda apagada. Os dois são botões de
                ícone redondos nas pontas da barra; usar a mesma classe mantém
                tamanho, cor e o comportamento sobre o acento em um lugar só.
                O ponto de "há busca ativa" vai para fora do fluxo: sem
                contorno não há espaço interno para ele. */}
            {!soMarca && (
            <button className="isl-icon !w-10 !h-10 sm:!w-9 sm:!h-9 relative" onClick={onSearch} title="Buscar" aria-label="Buscar">
              <IconBusca />
              {filters.q ? <span className={`absolute right-1 bottom-1 w-[7px] h-[7px] rounded-full transition-colors duration-[450ms] ${comAcento ? 'bg-paper' : 'bg-moss'}`} /> : null}
            </button>
            )}
          </div>

          {/* centro: a marca */}
          <div className="flex justify-center min-w-0">
            <button
              type="button"
              onClick={aoInicio}
              aria-label={ROTULO_LOGO}
              title={ROTULO_LOGO}
              /* inline-flex + items-center no BOTÃO: sem isso o <span> interno é
                 elemento de linha, apoia na linha de base, e o espaço reservado
                 para o descendente empurra o logo 3px acima dos ícones. */
              className="grupo-marca inline-flex items-center shrink-0 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px active:scale-[.97]"
            >
              {/* MOLA_CALMA (0,4s, sem ultrapassagem): a marca percorre meia tela
                  ao vir da capa, e ultrapassar o alvo numa viagem dessas lê como
                  tranco. */}
              {!aberturaNoAr && (
                <motion.span layoutId="marca" transition={MOLA_CALMA} className="relative inline-flex pointer-events-none">
                  {/* Medida pela LARGURA, não pela altura: a largura é o que aperta
                      aqui — é ela que disputa espaço com as duas pontas da barra —, e
                      é nela que a marca foi especificada. Com o viewBox encostado na
                      arte, a altura sai da proporção (6,71:1) e dá 26 e 28px. */}
                  <Marca className="w-[175px] md:w-[190px] h-auto" />
                  <MarcaAlt />
                </motion.span>
              )}
            </button>
          </div>

          {/* direita */}
          <div className="flex items-center gap-1.5 justify-self-end shrink-0">
            {!soMarca && (
            <div className="relative">
              <button
                type="button"
                className="isl-icon !w-10 !h-10 sm:!w-9 sm:!h-9 relative"
                onClick={() => setMenu(m => !m)}
                aria-label={menu ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menu}
                aria-haspopup="menu"
                title="Cor do site, estatísticas, nuvem e backup"
              >
                <Hamburguer aberto={menu} />
              </button>

              {/* ---- desktop: folha suspensa ---- */}
              <AnimatePresence>
                {menu && ehDesktop && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={MOLA_TOQUE}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 top-[calc(100%+10px)] z-40 w-[320px] rounded-medio border border-separador bg-surface px-5 py-1 shadow-amb-lg"
                  >
                    {conteudoMenu}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}
          </div>
        </div>

      </div>
    </header>
      {!soMarca && (<>

      {/* ---- segunda linha: o que é ferramenta ----
           Fica FORA da barra, em TODAS as larguras: rola embora com a página.
           Só a marca e os dois acessos acompanham a rolagem — o que é
           ferramenta da estante fica com a estante.

           Antes isto valia só no celular, e no desktop os dois moravam dentro
           da barra fixa. Virou igual nos dois: a barra ficou com três peças
           (busca · marca · menu) na mesma grade de três colunas, e a marca
           passa a ficar centrada de verdade em qualquer largura.

           Como ela está no fluxo normal e o painel do menu é fixo começando
           embaixo da barra, o painel a cobre sozinho — não precisa sumir à
           mão, e assim a página não dá um pulo ao abrir o menu.

           Uma instância só, nunca duplicada por CSS: o alternador carrega
           `layoutId`, e dois elementos com o mesmo id ao mesmo tempo quebram a
           animação da pastilha. */}
      <div className="mx-auto w-full max-w-[1320px] px-3 sm:px-5 flex items-center justify-between gap-3 py-2">
        {/* No DESKTOP, marca-d'água à esquerda e as duas ferramentas juntas à
            direita. No CELULAR a marca sai e o Filtros toma o lugar dela na
            esquerda — numa tela estreita o vazio que a marca preenchia não
            existe, e empurrar o Filtros para a ponta oposta do alternador dá
            alvo maior para o polegar nos dois cantos.

            A escolha é em JS, não duas cópias escondidas por CSS: duplicar
            poria dois botões "Filtros" na árvore de acessibilidade, e quem
            navega por leitor de tela ouviria o mesmo comando duas vezes.

            A marca-d'água a 10% de tinta não é texto que se lê — é textura.
            Por isso `aria-hidden`: anunciar "Coleção" para quem ouve seria
            prometer um título que visualmente não existe. `select-none`
            porque marca-d'água que se seleciona vira tropeço. */}
        {ehDesktop
          ? <span className="font-cartaz font-black uppercase leading-none
                             text-titulo text-ink-sussurro select-none shrink-0"
                  aria-hidden="true">Coleção</span>
          : botaoFiltros(true)}

        {/* O alternador fica SEMPRE neste mesmo embrulho, em qualquer largura:
            ele carrega `layoutId`, e tirá-lo de um pai para pôr noutro ao
            cruzar o corte remontaria a pastilha no meio da animação. */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {ehDesktop && botaoFiltros(true)}
          {alternadorVista}
        </div>
      </div>

      {/* ---- celular: painel de tela cheia, começando embaixo da barra ----
           Fica FORA do <header> de propósito: como filho dele, ele pegava a
           regra `.barra-topo > *{ position: relative }` — a que mantém o
           conteúdo acima da cortina do acento — e com isso (a) perdia o
           `fixed`, caindo no fluxo, e (b) entrava na altura da própria barra,
           que é justamente o que serve de referência para o `top` dele. */}
      <AnimatePresence>
        {menu && !ehDesktop && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={MOLA_GAVETA}
            style={{ top: alturaBarra }}
            className="fixed left-0 right-0 bottom-0 z-40 bg-surface overflow-y-auto px-5 pb-8"
          >
            {conteudoMenu}
          </motion.div>
        )}
      </AnimatePresence>
      </>)}
    </>
  )
}

/* ---------------------------------------------------------------
   O CONTEÚDO DO MENU — oito portas, uma lista, sem gaveta.

   ANTES HAVIA UM GRUPO: "Seus dados" abria uma sanfona com Perfil,
   Atividades, Capas e Backup dentro. A ideia era agrupar por assunto, e o
   preço era alto demais: quatro das portas custavam DOIS cliques e
   ficavam invisíveis até o primeiro. Um menu deste tamanho cabe inteiro na
   tela — esconder metade dele para economizar um espaço que sobra é trocar
   alcance por arrumação.

   A ORDEM NÃO É ALFABÉTICA NEM POR TAMANHO: é por frequência de uso, com as
   duas pontas marcadas.

     Perfil          quem você é, e a porta da nuvem — em destaque
     Tema            ·
     Fila de leitura ·  o dia a dia da coleção
     Listas          ·
     Estatísticas    ·
     Movimentação    ·
     Capas           ·  manutenção: se usa de vez em quando
     Backup          ·
     Ajuda           a saída de quem não achou — em apoio

   TRÊS PORTES, e não nove linhas iguais. Uma lista achatada obriga a ler os
   oito rótulos para achar o primeiro; com a primeira linha maior e a última
   menor, o olho pega as pontas antes de ler qualquer palavra. Perfil é o que
   a maioria abre, Ajuda é o que quase ninguém abre — e o tamanho diz isso
   sem precisar de uma régua, de um título de seção ou de uma gaveta.

   ÍCONE SÓ NAS PONTAS. Nos sete do meio ele viraria enfeite ao lado de uma
   palavra em caixa alta que já se lê de longe; nas pontas ele reforça o que
   o tamanho já começou. O texto dessas duas fica recuado em relação aos
   outros por causa disso, e é de propósito: são a cabeça e o pé da lista,
   não mais dois itens dela.
   --------------------------------------------------------------- */

/* O comum a todas as linhas. `hover:text-acento-texto` é a única concessão
   ao desktop: o celular não tem cursor e não precisa responder a ele; a folha
   suspensa precisa, ou o ponteiro passa por cima de nove palavras sem dizer
   qual delas vai ser clicada. Muda a COR e não o fundo — fundo arredondado
   era o que fazia esta lista parecer outra coisa no desktop. */
const BASE_LINHA = 'w-full flex items-center gap-3 font-cartaz font-semibold uppercase text-left'
  + ' border-b border-linha transition-colors hover:text-acento-texto'

/* Os três portes. A diferença entre `destaque` e `normal` é de um degrau da
   escala tipográfica (20px contra 16px) — "levemente maior", o suficiente
   para o olho pegar primeiro sem a linha virar um cabeçalho. */
const PORTE = {
  destaque: 'py-4 text-secao text-ink',
  normal:   'py-4 text-obra text-ink',
  apoio:    'py-3 text-corpo text-ink-soft',
}


function ConteudoMenu({ sync, foto, nome, onPerfil, onTema, onFila, onListas, onStats, onBulk, onBackup, onAjuda }) {
  return (
    /* O fio do ÚLTIMO item sai. Cada linha carrega uma régua embaixo para
       separá-la da seguinte — e a última não tem seguinte. No celular a sobra
       cai em espaço vazio e passa; no pop-up ela encosta na borda e vira uma
       régua solta, a dois pixels de outra linha. */
    <div className="flex flex-col [&>*:last-child]:border-b-0">

      {/* ---- PERFIL ----
           Primeiro e maior. É a porta de quem você é, e também a da nuvem —
           e enquanto não há servidor, é por ela que a coleção deixa de
           depender de um navegador só. O ponto de sincronização mora aqui
           porque é alerta, não decoração: ele some do ☰ para aparecer uma vez
           só, no lugar onde se resolve o que ele avisa. */}
      {/* O FUNDO CINZA-CLARO, e por que ele dispensa o fio.
          `bg-toque` é o véu mais fraco do projeto (5,5%) — o bastante para a
          linha se destacar das outras e de longe nem ser lida como cor. Com
          ele, a régua de baixo sai: fundo e fio fazem a mesma coisa, separar,
          e os dois juntos põem duas bordas a quatro pixels uma da outra.
          `-mx-3 px-3` dá ao plano uma folga lateral para além do texto, senão
          ele fica apertado nas letras; `rounded-medio` o mantém dentro dos
          cantos do pop-up, que um plano de ponta a ponta atravessaria. */}
      <button
        role="menuitem" onClick={onPerfil}
        className={`${BASE_LINHA} ${PORTE.destaque} !border-b-0 bg-toque rounded-medio -mx-3 px-3`}
      >
        <AvatarPerfil foto={foto} />
        {/* O ponto vem DEPOIS da palavra, dentro do mesmo span: assim ele
            acompanha a linha do texto, e `items-center` o alinha pela altura
            da palavra e não pela do botão inteiro. */}
        {/* O NOME NO LUGAR DO RÓTULO.
            Enquanto não há nome, a linha diz o que há atrás dela: "Seus
            dados". Assim que há, ela passa a dizer de quem são — e o rótulo
            genérico só serve até existir a palavra mais específica.

            SÓ O PRIMEIRO NOME. "Rafael Moreco" em caixa alta de 20px não cabe
            ao lado do avatar numa folha de 320px, e truncar o sobrenome de
            alguém é pior que não mostrá-lo. O nome completo está no painel,
            a um clique.

            `truncate` mesmo assim: primeiro nome também pode ser comprido, e
            a alternativa a cortar é a linha empurrar a folha. */}
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="truncate">{nome?.trim() || 'Seus dados'}</span>
          {sync && sync !== 'off' && <PontoNuvem sync={sync} />}
        </span>
      </button>

      {/* ---- TEMA ---- */}
      <button role="menuitem" onClick={onTema} className={`${BASE_LINHA} ${PORTE.normal}`}>
        Tema
      </button>

      {/* ---- o dia a dia ---- */}
      <button role="menuitem" onClick={onFila} className={`${BASE_LINHA} ${PORTE.normal}`}>
        Fila de leitura
      </button>
      <button role="menuitem" onClick={onListas} className={`${BASE_LINHA} ${PORTE.normal}`}>
        Listas
      </button>
      <button role="menuitem" onClick={onStats} className={`${BASE_LINHA} ${PORTE.normal}`}>
        Estatísticas
      </button>

      {/* ---- manutenção ----
           Saíram de dentro da gaveta "Seus dados" e viraram linhas como as
           outras. São menos usadas que a fila e as listas, e por isso vêm
           depois — mas "menos usada" não é motivo para ficar escondida. */}
      <button role="menuitem" onClick={onBulk} className={`${BASE_LINHA} ${PORTE.normal}`}>
        Capas
      </button>
      <button role="menuitem" onClick={onBackup} className={`${BASE_LINHA} ${PORTE.normal}`}>
        Backup
      </button>

      {/* ---- AJUDA ----
           Última e menor. É a porta de quem não achou o que queria nas
           outras: posta no topo, apareceria antes do app que ela explica. */}
      <button role="menuitem" onClick={onAjuda} className={`${BASE_LINHA} ${PORTE.apoio}`}>
        <IconAjuda />
        Ajuda
      </button>
    </div>
  )
}

/* o rótulo da nuvem diz o estado, não só a categoria */
/* O rótulo do menu é "Perfil"; quem diz o ESTADO DA NUVEM é o ponto ao lado.
 *
 * O ponto continua sendo da nuvem mesmo depois de o item virar "Perfil": a
 * nuvem mora dentro do painel de Perfil, e é por essa porta que se chega
 * nela. O `title` diz "Nuvem" em voz alta justamente por isso — a bolinha é
 * sobre sincronização, não sobre o nome de quem usa o app.
 *
 * Mas cor sozinha não é informação: quem não distingue verde de laranja, ou
 * usa leitor de tela, ficaria sem saber. Por isso o estado continua existindo
 * em texto — no `title` e num rótulo só para leitor. O que saiu foi o estado
 * ESCRITO no meio do menu, não o estado.
 */
function estadoNuvem(sync) {
  return {
    ok: 'em dia',
    sync: 'sincronizando',
    pending: 'envio pendente',
    err: 'erro ao sincronizar',
    // conflito nao pode passar calado: e o aviso de que a nuvem tem algo mais
    // novo, e que o envio foi barrado de proposito para nao apagar
    conflito: 'há algo mais novo lá',
  }[sync] || 'não conectada'
}

/* Três linhas que viram um X. Só transform e opacity — as duas propriedades
   que o compositor acelera. Animar `top` custaria layout a cada quadro. */
function Hamburguer({ aberto }) {
  const linha = 'absolute left-0 top-0 h-[1.5px] w-full rounded-full bg-current origin-center'
  return (
    <span className="relative block w-[18px] h-[11.5px]" aria-hidden="true">
      <motion.span className={linha} animate={aberto ? { y: 5, rotate: 45 } : { y: 0, rotate: 0 }} transition={MOLA_TOQUE} />
      <motion.span className={linha} initial={{ y: 5 }} animate={{ y: 5, opacity: aberto ? 0 : 1, scaleX: aberto ? 0.3 : 1 }} transition={MOLA_TOQUE} />
      <motion.span className={linha} animate={aberto ? { y: 5, rotate: -45 } : { y: 10, rotate: 0 }} transition={MOLA_TOQUE} />
    </span>
  )
}

/* Ponto de estado da nuvem, para ficar EM LINHA ao lado de uma palavra.
 *
 * O antecessor (`SyncDot`) era um selo colado no canto de um ícone: posição
 * absoluta e anel de 2px da cor do papel, para se destacar do desenho embaixo.
 * Nenhuma das duas coisas serve aqui — sobre papel liso o anel só engorda o
 * ponto, e a posição absoluta o tiraria da linha do texto. */
const PontoNuvem = ({ sync }) => {
  const c = { ok: 'bg-moss', sync: 'bg-gold animate-pulse', pending: 'bg-gold animate-pulse', err: 'bg-rust', conflito: 'bg-rust animate-pulse' }[sync] || 'bg-ink-mute'
  if (sync === 'off' || !sync) return null
  const estado = estadoNuvem(sync)
  return (
    <span className="inline-flex items-center shrink-0" title={'Nuvem — ' + estado}>
      <span className={`w-[9px] h-[9px] rounded-full ${c}`} aria-hidden="true" />
      <span className="sr-only">{' — ' + estado}</span>
    </span>
  )
}

/* A lupa não aumenta nada — ela MOSTRA a trama do papel. No hover a lente dá
   um arco curto de varredura e, por baixo do contorno, aparece o meio-tom:
   aqueles pontinhos de impressão de gibi antigo. O padrão usa currentColor,
   então acompanha a inversão da barra sem regra extra. */
const IconBusca = () => (
  <svg className="w-[18px] h-[18px] ico-lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <defs>
      <pattern id="reticula-lupa" width="2.6" height="2.6" patternUnits="userSpaceOnUse">
        <circle cx="1.3" cy="1.3" r="0.62" fill="currentColor" stroke="none" />
      </pattern>
    </defs>
    <circle className="ico-lupa__reticula" cx="11" cy="11" r="8" fill="url(#reticula-lupa)" stroke="none" />
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)
/* Funil, não mais três traços.
   A gota existe só para o gesto: no hover ela desce pela garganta e esvanece —
   filtrar é deixar passar o que interessa. É a mesma ideia da versão anterior
   (movimento que DIZ o que o botão faz), portada para o desenho novo. */
const IconFiltros = () => (
  <svg className="w-[18px] h-[18px] ico-funil" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M2 4h20l-8 9v7l-4 2v-9z" />
    <circle className="ico-funil__gota" cx="12" cy="8" r="1.15" fill="currentColor" stroke="none" />
  </svg>
)
/* Galeria e Lista são DOIS botões lado a lado, sempre visíveis — não um ícone
   que se transforma. Então não há morfose a fazer: o que cabe é cada ícone
   prever o próprio resultado quando o cursor passa. Aqui os quadros brotam em
   sequência, como a grade montando. */
const IconGrade = () => (
  <svg className="w-[15px] h-[15px] ico-grade" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect className="ico-grade__q1" x="3" y="3" width="7" height="7" />
    <rect className="ico-grade__q2" x="14" y="3" width="7" height="7" />
    <rect className="ico-grade__q3" x="3" y="14" width="7" height="7" />
    <rect className="ico-grade__q4" x="14" y="14" width="7" height="7" />
  </svg>
)
/* E aqui as linhas entram pela esquerda, uma depois da outra, como lista
   sendo escrita. Os marcadores ficam parados: eles são a âncora. */
const IconLista = () => (
  <svg className="w-[15px] h-[15px] ico-lista" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
    <path className="ico-lista__l1" d="M8 6h13" />
    <path className="ico-lista__l2" d="M8 12h13" />
    <path className="ico-lista__l3" d="M8 18h13" />
  </svg>
)

/* O AVATAR DO PERFIL.
 *
 * Deixou de ser um ícone de contorno ao lado da palavra e virou um DISCO, do
 * tamanho de um avatar de verdade — porque é num avatar que ele se transforma
 * assim que a pessoa escolhe uma foto. Um ícone de 19px que vira uma foto de
 * 19px seria uma foto que não se vê; 28px é o menor tamanho em que um rosto
 * ainda é um rosto.
 *
 * FUNDO ESCURO, FIGURA CLARA: no vazio, o disco preenchido em tinta ocupa o
 * mesmo peso visual que a foto vai ocupar depois. Um contorno vazado encolhe
 * quando a foto entra, e a linha inteira dá um pulo.
 *
 * A silhueta é PREENCHIDA, não traçada. A 28px sobre um disco escuro, um
 * traço de 1,8px some; a forma cheia continua legível. É a mesma razão pela
 * qual ícones de contorno não funcionam dentro de pastilhas pequenas.
 *
 * `object-cover` na foto: ela já chega quadrada de `lib/foto.js` (corte
 * central antes de reduzir), mas uma foto antiga, de antes daquele corte,
 * ainda pode vir 3:4 — e espremer um retrato num círculo achata o rosto.
 */
const AvatarPerfil = ({ foto }) => (
  <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 inline-flex items-center justify-center">
    {foto
      ? <img src={foto} alt="" className="w-full h-full object-cover" />
      : (
        /* O desenho é um DISCO CHEIO com a figura RECORTADA dele, e não uma
           figura desenhada em cima de um fundo. É o padrão de avatar vazio
           que todo mundo já viu, e ele tem uma vantagem concreta: os ombros
           podem encostar na borda de baixo e sair pelo corte, do jeito que
           um retrato real sai. Uma silhueta desenhada dentro do círculo
           precisaria caber inteira, e caberia sempre pequena demais.

           `fillRule="evenodd"`: o caminho é uma só figura — disco, cabeça e
           ombros no mesmo `d` —, e é a regra de preenchimento que decide que
           as duas formas internas furam a de fora em vez de somar a ela.
           Com a regra padrão, o resultado seria um disco cheio e sólido. */
        <svg className="w-full h-full text-ink-mute" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 5.1a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Zm0 9.3c3.5 0 6.4 2.1 6.9 4.9a9.6 9.6 0 0 1-13.8 0c.5-2.8 3.4-4.9 6.9-4.9Z"
          />
        </svg>
      )}
  </span>
)

/* Interrogação dentro de um círculo: o símbolo de ajuda mais reconhecido que
   existe, e o único ícone desta lista que seria lido sem rótulo nenhum.
   Menor que o do Perfil, para acompanhar a linha de apoio. */
const IconAjuda = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.4 9.2a2.7 2.7 0 1 1 3.4 3.3c-.6.2-.9.7-.9 1.3v.4" />
    <path d="M12 17.2h.01" />
  </svg>
)
