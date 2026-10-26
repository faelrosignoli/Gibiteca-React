import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA, ELASTICO_BAIXO,
  deveDispensar, useEhDesktop, usaMovimentoReduzido,
} from '../lib/motion.js'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { linkDoGuia } from '../lib/catalogo.js'
import { Switch, CheckTile, lbl, box } from './Campos.jsx'
import { EstrelasInput } from './Estrelas.jsx'
import { coverOf, tipoOf, edOf, edicaoDe, isImp, authorsOf, capaVelada, unitsForStatus, unitsOf, ownedCount, initials, classeTinta, volumesSemCapa, naFila, podeEnfileirar, moneyFormat, moneyToNumber } from '../lib/helpers.js'

/* ------------------------------------------------------------------
   SITUAÇÃO E ANOTAÇÃO, EDITÁVEIS AQUI MESMO

   Estavam dentro do editor, numa seção chamada "Situação". Saíram de lá
   porque não são da mesma natureza do resto do editor: título, autoria,
   editora e origem descrevem a OBRA — existiriam igual se ela não fosse sua.
   Status, urgência, leitura, nota e anotação descrevem a sua RELAÇÃO com
   ela, e mudam toda semana enquanto o resto nunca muda.

   Abrir um formulário de doze campos para marcar "li" era pedir o gesto
   grande para a mudança pequena, e justamente para a que acontece mais.

   SALVA SOZINHO, sem botão. Não há o que confirmar: cada controle é uma
   decisão completa em si, e um "Salvar" aqui só serviria para a pessoa
   esquecer de apertar.

   A ANOTAÇÃO É A EXCEÇÃO: ela guarda no `blur`, não a cada tecla. Escrevendo
   direto no store, cada letra viraria uma gravação no disco e um agendamento
   de envio para a nuvem.
   ------------------------------------------------------------------ */
function Situacao({ obra }) {
  const { upsertObra, fila, alternarFila } = useStore()
  const avulsa = tipoOf(obra) === 'avulso'
  const tem = obra.status === 'biblioteca'

  /* As MESMAS normalizações do editor, de propósito. Obra que não é sua não
     tem valor pago nem nota; obra que é sua não é "urgente" (urgência é a
     pressa de comprar). Gravando sem isso, a ficha deixaria para trás
     combinações que o editor nunca produz — e aí os dois caminhos passariam a
     gerar obras diferentes a partir da mesma escolha. */
  const gravar = (partes) => {
    const d = { ...obra, ...partes }
    const possui = d.status === 'biblioteca'
    upsertObra({
      ...d,
      urgencia: !possui && !!d.urgencia,
      valorPago: possui ? (d.valorPago || 0) : 0,
      lido: possui && !!d.lido,
      nota: possui ? (d.nota || 0) : 0,
    })
  }

  /* Rascunho local da anotação. Sincroniza pela `key` do componente lá fora:
     trocando de obra, o componente é outro e nasce com o texto certo. */
  const [nota, setNota] = useState(obra.resenha || '')
  const guardarNota = () => {
    if ((obra.resenha || '') !== nota) gravar({ resenha: nota.trim() })
  }

  return (
    <div className="px-5 pb-5 flex flex-col gap-4">
      {/* Para SÉRIE e BOX nada disto aparece: ali status, leitura, nota e
          valor são de cada volume, não do conjunto — e a lista de volumes,
          logo abaixo, é onde eles moram. Uma "nota da série" seria uma média
          disfarçada de escolha. */}
      {avulsa && (
        <section className="flex flex-col gap-2.5">
          <h3 className="font-rotulo text-rotulo uppercase font-bold text-acento-texto flex items-center gap-2.5">
            Situação<span className="flex-1 h-px bg-separador" />
          </h3>

          <Switch
            options={[['wishlist', 'Quero'], ['biblioteca', 'Tenho']]}
            value={obra.status}
            onChange={v => gravar({ status: v })}
          />

          {/* Só para quem TEM. Quem só quer não pagou nada, não leu e não
              enfileira — e a urgência, que era a pergunta deste lado, subiu
              para o ícone do cabeçalho. */}
          {/* OS TRÊS NA MESMA LINHA: quanto custou, já leu, e o que falta
              fazer com isso. São as três perguntas que se fazem de um gibi que
              já está na estante, e empilhadas viravam três blocos para um
              assunto só.

              O CAMPO DE VALOR ENCOLHEU PARA 100px. Em largura inteira ele era
              o elemento mais pesado da ficha para guardar "R$ 29,90" — oito
              caracteres ocupando 409. Campo de tamanho fixo também diz, só
              pela forma, que ali cabe pouco.

              `items-end` alinha pela BASE, não pelo meio: o campo de valor tem
              rótulo em cima e os outros dois não, então alinhar pelo centro
              deixaria o "Lido" flutuando meio dedo acima da linha de base dos
              controles.

              A VAGA É `flex-1`, e com isso o "Lido" não anda ao trocar de
              ocupante — ele vem ANTES do elemento elástico, e quem absorve a
              diferença é quem vem depois. Era o que a largura fixa de 210px
              resolvia antes de o campo de valor entrar na linha; com três
              elementos, o elástico no último faz o mesmo de graça.

              `min-w` + `flex-wrap`: abaixo de uns 400px de linha não há como
              pôr os três lado a lado sem espremer "Salvar na fila" até sumir.
              Em vez de escolher um ponto de quebra por tamanho de tela — que
              erraria, porque a ficha é larga no desktop e estreita no celular
              com a MESMA janela —, a vaga declara a largura mínima de que
              precisa e desce sozinha quando não cabe. */}
          {tem && (() => {
            const vaga = obra.lido
              ? <CaixaNota valor={obra.nota || 0} onChange={n => gravar({ nota: n })} />
              : (podeEnfileirar(obra)
                  ? <BotaoFila
                      naLista={naFila(fila, obra.id, null)}
                      cabe
                      onClick={() => alternarFila(obra.id, null)}
                    />
                  : null)
            return (
              <div className="flex flex-wrap items-end gap-2.5">
                <div className={`${box} w-[100px] shrink-0`}>
                  <label className={lbl} htmlFor={`valor-${obra.id}`}>Valor pago</label>
                  <CampoValor
                    id={`valor-${obra.id}`}
                    valor={obra.valorPago || 0}
                    onCommit={v => gravar({ valorPago: v })}
                  />
                </div>

                <CheckTile checked={!!obra.lido} onChange={e => gravar({ lido: e.target.checked, ...(e.target.checked ? {} : { nota: 0 }) })}>
                  Lido
                </CheckTile>

                {/* Quem some sozinho é a fila: `podeEnfileirar` já exige estar
                    na estante e NÃO estar lido, que é exatamente a condição do
                    ternário. Sem vaga nenhuma, o `flex-1` não é desenhado e os
                    dois primeiros ficam no tamanho que têm. */}
                {vaga && <div className="flex-1 min-w-[200px]">{vaga}</div>}
              </div>
            )
          })()}
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <h3 className="font-rotulo text-rotulo uppercase font-bold text-acento-texto flex items-center gap-2.5">
          Anotação<span className="flex-1 h-px bg-separador" />
        </h3>
        <textarea
          className="field-input min-h-[80px] resize-y" rows={3}
          value={nota}
          onChange={e => setNota(e.target.value)}
          onBlur={guardarNota}
          placeholder="Escreva aqui…"
        />
      </section>
    </div>
  )
}

/* A CAPA DA FICHA — a única que revela.
 *
 * No cartão e na lista a capa de obra +18 fica velada e pronto: ali não há
 * como segurar nada, e revelar no hover acenderia capa adulta a cada passada
 * de mouse numa grade inteira.
 *
 * Aqui é diferente porque aqui já houve uma escolha: você abriu ESTA obra. O
 * gesto de segurar é o que separa "quero ver" de "esbarrei" — um toque
 * acidental não revela, e soltar devolve o véu sozinho, sem precisar desfazer
 * nada. É o mesmo princípio do "segure para falar": a ação dura o tempo da
 * intenção.
 *
 * ---- O SELO ----
 *
 * Disco com borda em rust, na frente da capa. Ele é a única coisa desta tela
 * que usa rust além da urgência, e pode: as duas são avisos, e nunca aparecem
 * no mesmo canto. Sai junto com o véu — enquanto a capa está revelada, o selo
 * já disse o que tinha a dizer, e cobrir a arte que a pessoa pediu para ver
 * seria desfazer o próprio gesto. O `+18` da linha de selos continua lá.
 *
 * ---- TECLADO ----
 *
 * `onKeyDown`/`onKeyUp` com Enter e Espaço espelham o segurar. Sem isso a
 * revelação seria exclusiva de quem usa ponteiro — e a capa é `<button>`
 * justamente para estar no caminho do foco.
 *
 * `onPointerLeave` e `onPointerCancel` junto do `onPointerUp`: o dedo que
 * escorrega para fora e a chamada que interrompe o toque precisam devolver o
 * véu também, senão ele fica preso aberto.
 */
function CapaDaFicha({ obra, src }) {
  const { verAdulto } = useStore()
  const [revelada, setRevelada] = useState(false)
  const velar = capaVelada(obra, verAdulto)

  /* Trocando de obra, o véu volta: a decisão de revelar foi sobre AQUELA capa.
     Sem isto, abrir uma obra adulta logo depois de revelar outra já a mostraria
     aberta. */
  useEffect(() => { setRevelada(false) }, [obra.id])

  const caixa = 'w-24 sm:w-28 shrink-0 self-start aspect-square relative flex items-center justify-center overflow-hidden rounded-pequeno'

  const miolo = src
    ? <img src={src} alt=""
        className={`absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno
          shadow-[0_18px_30px_-18px_rgba(33,33,33,.55)]
          ${velar ? (revelada ? 'capa-revelada' : 'capa-velada') : ''}`} />
    : <div className={`w-full h-full flex items-center justify-center text-sobre-tinta ${classeTinta(edOf(obra) || obra.nome)}`}>
        <span className="font-display font-semibold text-titulo leading-none">{initials(obra.nome)}</span>
      </div>

  if (!velar) return <div className={caixa}>{miolo}</div>

  const solta = () => setRevelada(false)

  return (
    <button
      type="button"
      className={`${caixa} cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface`}
      aria-label={revelada ? 'Soltando, a capa volta a ficar embaçada' : 'Segure para ver a capa — conteúdo para maiores de 18'}
      title="Segure para ver a capa"
      onPointerDown={() => setRevelada(true)}
      onPointerUp={solta}
      onPointerLeave={solta}
      onPointerCancel={solta}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevelada(true) } }}
      onKeyUp={e => { if (e.key === 'Enter' || e.key === ' ') solta() }}
      onBlur={solta}
    >
      {miolo}
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200
          ${revelada ? 'opacity-0' : 'opacity-100'}`}
      >
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full
                         border-2 border-rust bg-surface/85 text-rust
                         font-rotulo text-rotulo font-bold tracking-tight">
          +18
        </span>
      </span>
    </button>
  )
}

/* A AUTORIA, com os dois primeiros à vista e o resto atrás de um "+N".
 *
 * Uma obra de cinco autores enchia três linhas logo abaixo do título e
 * empurrava tudo o mais para fora da tela — e ninguém abre uma ficha para
 * conferir o quinto nome da ficha técnica. Os dois primeiros respondem "de
 * quem é isto?"; o resto é consulta, e consulta pede um clique.
 *
 * DOIS, e não três ou quatro: é quase sempre o roteirista e o desenhista, que
 * é a dupla que nomeia um quadrinho. O corte cai exatamente onde a informação
 * deixa de ser identificação e passa a ser elenco.
 *
 * O "+N" vira "−" ao abrir, e o resto dos nomes entra DENTRO do mesmo span da
 * lista — não como irmão dele. Separados, o vão do `flex` abria um buraco
 * antes da vírgula e a frase lia "Fulano, Beltrano , Sicrano".
 */
function Autores({ obra }) {
  const todos = authorsOf(obra)
  const [aberto, setAberto] = useState(false)
  if (!todos.length) return null

  const visiveis = todos.slice(0, 2)
  const resto = todos.slice(2)

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-corpo text-ink-soft">
      <span className="min-w-0">
        {visiveis.join(', ')}
        {aberto && resto.length > 0 && `, ${resto.join(', ')}`}
      </span>
      {resto.length > 0 && (
        <button
          type="button"
          onClick={() => setAberto(a => !a)}
          aria-expanded={aberto}
          title={aberto ? 'Mostrar menos' : `Ver todos os ${todos.length} autores`}
          className="shrink-0 rounded-full border border-contorno px-2 py-px text-rotulo font-rotulo
                     text-ink-faint hover:text-ink hover:bg-toque transition-colors"
        >
          {aberto ? '−' : `+${resto.length}`}
        </button>
      )}
    </div>
  )
}

/* "Salvar na fila", um só botão para os dois lugares: a obra avulsa e cada
 * volume. É o MESMO gesto — "quero ler isto a seguir" — e dois desenhos
 * diferentes fariam parecer duas coisas.
 *
 * O rótulo diz a AÇÃO quando está fora ("Salvar na fila") e o ESTADO quando
 * está dentro ("Na fila"). É a mesma palavra do texto que a fila vazia usa
 * para ensinar onde clicar — e esse par tem de andar junto: a tela que
 * manda procurar um botão precisa citá-lo pelo nome que ele tem.
 *
 * Alterna: já está na fila, tira. Sem menu, sem confirmação. Pôr e tirar da
 * fila não destrói nada; o que custa caro é perder a ORDEM, e a ordem está
 * na fila, não aqui.
 *
 * NÃO aparece no que já foi lido. A fila é o que vem a seguir, e o que já se
 * leu não vem a seguir — é a mesma regra que tira da fila sozinho quando o
 * Editor marca lido (`podarFila`, no store). Oferecer o botão ali criaria
 * uma entrada que a próxima edição apagaria sem explicação.
 *
 * `compacto` é a versão de volume: ícone só, do tamanho do selo ao lado.
 */
/* O CAMPO DE VALOR PAGO, com a máscara de dinheiro funcionando.
 *
 * A MÁSCARA SÓ EXISTE EM CAMPO CONTROLADO. A primeira versão aqui usava
 * `defaultValue` + `onBlur` para evitar gravar no disco a cada tecla — e com
 * isso a máscara nunca rodava: `defaultValue` é lido uma vez, na montagem, e
 * depois o React não toca mais no campo. Digitava-se `2990` e ficava `2990` na
 * tela, sem virar `R$ 29,90` nunca. O Editor sempre funcionou porque lá o
 * campo é controlado (`value` + `onChange`).
 *
 * Então o campo é controlado por um RASCUNHO LOCAL: cada tecla reformata na
 * tela, e só o `blur` grava no store. As duas coisas que pareciam incompatíveis
 * — formatar a cada tecla e gravar uma vez só — eram incompatíveis apenas
 * enquanto o único estado era o do store.
 *
 * O `useEffect` existe para o valor que muda POR FORA: trocar o status para
 * "Quero" zera `valorPago` no store (ver `gravar`), e sem a sincronia o campo
 * continuaria exibindo o rascunho antigo quando a obra voltasse para "Tenho".
 * Só sincroniza com o campo SEM FOCO — sincronizar durante a digitação faria o
 * cursor saltar.
 */
function CampoValor({ id, valor, onCommit }) {
  const ref = useRef(null)
  const [rascunho, setRascunho] = useState(valor)

  useEffect(() => {
    if (document.activeElement !== ref.current) setRascunho(valor)
  }, [valor])

  return (
    <input
      id={id} ref={ref} className="field-input" inputMode="numeric"
      value={moneyFormat(rascunho)}
      onChange={e => setRascunho(moneyToNumber(e.target.value))}
      onBlur={() => { if (rascunho !== valor) onCommit(rascunho) }}
      placeholder="R$ 0,00"
    />
  )
}

/* A CAIXA DE NOTA — as estrelas com moldura e nome.
 *
 * Soltas, as cinco estrelas ao lado do "Lido" não liam como um campo: liam
 * como um enfeite que apareceu. O "Lido" tem contorno, o botão da fila tinha
 * contorno, e no meio deles a nota era a única coisa flutuando. A moldura põe
 * os dois ocupantes da vaga na mesma forma, que é o que faz um parecer ter
 * dado lugar ao outro.
 *
 * O NOME VAI DENTRO, e não como rótulo em cima ao jeito de "Valor pago": um
 * rótulo acima cresceria a linha para cima e empurraria o "Lido" — justamente
 * o que esta caixa existe para evitar.
 *
 * ESTRELAS DE 20px, não 24: é o que sobra depois do rótulo e do × dentro de
 * 210px. Continuam com alvo de toque de 42px pela altura da caixa.
 */
function CaixaNota({ valor, onChange }) {
  return (
    <div className="w-full h-[42px] rounded-full border border-contorno bg-surface px-2.5
                    flex items-center justify-center gap-1.5">
      <span className="font-rotulo text-rotulo uppercase text-ink-soft shrink-0">Nota</span>
      <EstrelasInput value={valor} onChange={onChange} tamanho="w-5 h-5" limpar={false} />
      {/* O "limpar" escrito não cabe aqui, e sem ele não haveria como voltar a
          zero: clicar na estrela marcada vai para a metade dela, e da metade
          volta para a inteira. Vira um ×, que ocupa 18px em vez de 44. */}
      {valor > 0 && (
        <button
          type="button" onClick={() => onChange(0)}
          title="Tirar a nota" aria-label="Tirar a nota"
          className="shrink-0 text-ink-mute hover:text-rust transition-colors leading-none"
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  )
}

function BotaoFila({ naLista, cabe, compacto, rotulo, onClick }) {
  if (!cabe) return null
  const titulo = naLista ? 'Tirar da fila de leitura' : 'Salvar na fila de leitura'
  const marcador = (
    <svg className={compacto ? 'w-[13px] h-[13px]' : 'w-[15px] h-[15px]'} viewBox="0 0 24 24"
         fill={naLista ? 'currentColor' : 'none'} stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1z" />
    </svg>
  )
  if (compacto) {
    return (
      <button type="button" onClick={onClick}
        aria-pressed={naLista}
        title={titulo + ' — ' + rotulo}
        aria-label={titulo + ' — ' + rotulo}
        className={'shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border transition-colors ' +
          (naLista ? 'bg-moss text-sobre-acento border-moss' : 'border-contorno text-ink-faint hover:text-ink hover:border-ink-mute')}>
        {marcador}
      </button>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={naLista}
      title={titulo} className={'neo-btn w-full justify-center ' + (naLista ? '!bg-moss !text-sobre-acento !border-moss' : '')}>
      {marcador}
      {naLista ? 'Na fila' : 'Salvar na fila'}
    </button>
  )
}

export default function DetailSheet({ obra: obraAberta, onClose, onEdit, onDuplicar, onDesmembrar }) {
  const { fixada, fixarObra, filters, fila, alternarFila, obras, upsertObra } = useStore()

  /* A FICHA LÊ A OBRA VIVA, não a cópia que a abriu.
   *
   * O App guarda em `detail` o objeto da obra no instante do clique. Enquanto
   * a ficha só exibia, isso bastava. Agora ela EDITA — e editar gravava no
   * store enquanto a tela continuava desenhando o retrato antigo: marcar
   * "Tenho" salvava certo e não trocava "Urgente" por "Valor pago", porque a
   * cópia na mão ainda dizia "Quero".
   *
   * Procurar pelo id a cada render resolve, e custa uma varredura numa lista
   * que a estante inteira já percorre a cada filtro.
   *
   * O `|| obraAberta` cobre o instante entre apagar a obra e a gaveta fechar:
   * sem ele, a busca devolveria `undefined` e a ficha quebraria no caminho
   * para fora. */
  const obra = (obraAberta && obras.find(o => o.id === obraAberta.id)) || obraAberta
  const estaFixada = obra != null && fixada === obra.id
  const multi = obra != null && (tipoOf(obra) === 'serie' || tipoOf(obra) === 'box')
  const todosOsVolumes = obra != null ? unitsOf(obra) : []
  const unidades = todosOsVolumes.length

  // Com o filtro em "Tenho", uma série 1-de-2 passava e mostrava os dois
  // volumes — inclusive o que falta. Agora a lista respeita o filtro.
  const volumes = obra != null ? unitsForStatus(obra, filters.status) : []
  const filtrando = filters.status !== 'todos' && volumes.length !== todosOsVolumes.length
  const notaDoFiltro = filters.status === 'biblioteca' ? 'só os que você tem' : 'só os que faltam'
  const ehDesktop = useEhDesktop()
  const reduzido = usaMovimentoReduzido()
  // o arrasto começa só pelo cabeçalho: o corpo precisa continuar rolando
  const arrasto = useDragControls()

  // sai pelo mesmo lado por onde entrou
  const eixo = ehDesktop ? 'x' : 'y'
  // percurso inteiro: entra e sai pela mesma borda. Um deslocamento curto
  // faria a gaveta voltar para perto do lugar antes de sumir, se o usuário
  // a tivesse arrastado para longe — um repuxão no meio da dispensa.
  const de = ehDesktop ? { x: '100%' } : { y: '100%' }

  const aoSoltar = (_e, info) => {
    const deslocamento = ehDesktop ? info.offset.x : info.offset.y
    const velocidade = ehDesktop ? info.velocity.x : info.velocity.y
    const tamanho = ehDesktop ? 460 : 420
    if (deveDispensar({ deslocamento, velocidade, tamanho })) onClose?.()
    // se não dispensar, o dragSnapToOrigin devolve a gaveta ao lugar
  }


  /* Desmembrar PERGUNTA, e pergunta com números.
   *
   * É a ação mais destrutiva da gaveta depois de excluir: a série some e no
   * lugar dela aparecem N obras, sem desfazer. O confirm diz exatamente
   * quantas obras vão nascer e quantas delas vão ficar sem capa — porque
   * capa é o que não dá para recuperar digitando de novo.
   *
   * E diz o TOTAL, não o que está na tela. Com o filtro em "Tenho" a lista
   * abaixo mostra 3 de 8 volumes; desmembrar mexe nos 8. Quem só olhasse a
   * tela contaria errado, então o aviso conta por ele. */
  const desmembrar = () => {
    const semCapa = volumesSemCapa(obra)
    const linhas = [
      `Desmembrar "${obra.nome}"?`,
      '',
      `Os ${unidades} volumes viram ${unidades} obras avulsas, cada uma com o que já era dela: status, valor, nota e capa. A ${tipoOf(obra) === 'box' ? 'caixa' : 'série'} deixa de existir.`,
    ]
    if (filtrando) linhas.push('', `Atenção: o filtro mostra só ${volumes.length} volume${volumes.length === 1 ? '' : 's'} aqui, mas o desmembramento vale para os ${unidades}.`)
    if (semCapa) linhas.push('', `${semCapa} ${semCapa === 1 ? 'volume não tem capa própria e vai ficar' : 'volumes não têm capa própria e vão ficar'} sem capa.`)
    linhas.push('', 'Isso não tem desfazer.')
    if (!confirm(linhas.join('\n'))) return
    onDesmembrar?.(obra)
  }

  return (
    <AnimatePresence>
      {obra && (
        <>
          <motion.div className="fixed inset-0 z-40 veu-canelado" initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE} onClick={onClose} />
          <motion.div
 className="fixed z-50 bg-surface border-separador flex flex-col right-0 top-0 h-full w-[min(460px,100%)] border-l sm:rounded-none max-sm:top-auto max-sm:bottom-0 max-sm:w-full max-sm:h-auto max-sm:max-h-[92vh] max-sm:rounded-t-grande max-sm:border-l-0 max-sm:border-t"
            initial={de} animate={{ x: 0, y: 0 }} exit={de}
            transition={reduzido ? { duration: 0.16 } : MOLA_GAVETA}
            drag={reduzido ? false : eixo}
            dragControls={arrasto}
            dragListener={false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={ehDesktop ? ELASTICO_DIREITA : ELASTICO_BAIXO}
            dragTransition={VOLTA_DO_ARRASTO}
            dragSnapToOrigin
            onDragEnd={aoSoltar}
          >
            {/* puxador — só aparece quando a gaveta vem de baixo */}
            <div
 className="sm:hidden pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={e => arrasto.start(e)}
            >
              <span className="w-9 h-1 rounded-full bg-separador" />
            </div>
            <div
 className="flex items-center gap-2 px-5 py-4 border-b border-separador sm:cursor-grab sm:active:cursor-grabbing touch-none"
              onPointerDown={e => arrasto.start(e)}
            >
              {/* ---- O PAR DA ESQUERDA: FIXAR E URGENTE ----

                  Os dois são ESTADOS da obra — ela é o destaque da grade, ela
                  é urgente. Os da direita (duplicar, editar, fechar) são AÇÕES
                  sobre a ficha. Estado numa ponta, ação na outra: a divisão se
                  lê sem precisar de legenda, e nenhum botão que liga e desliga
                  fica encostado num que dispara e acaba.

                  OS DOIS COM CONTORNO. Botão que acende precisa de moldura já
                  apagado — senão o estado ligado não parece ligado, parece um
                  botão que surgiu do nada no lugar onde não havia nada.

                  O `!border` é obrigatório nos dois: o `.neo-icon` traz
                  `border-0`, e pedir só a COR da borda pinta uma linha de zero
                  pixel — o contorno simplesmente não aparece. */}

              {/* Fixar destaca a obra na grade. Só uma por vez: fixar outra
                  troca a anterior, e clicar de novo desafixa. */}
              <button
                className={`neo-icon !w-9 !h-9 shrink-0 !border
                  ${estaFixada ? '!border-moss !bg-moss !text-sobre-acento' : '!border-contorno'}`}
                onClick={() => fixarObra(obra.id)}
                aria-pressed={estaFixada}
                title={estaFixada ? 'Desafixar da grade' : 'Fixar como destaque da grade'}
                aria-label={estaFixada ? 'Desafixar da grade' : 'Fixar como destaque da grade'}
              >
                <IconFixar preenchido={estaFixada} />
              </button>

              {/* ---- URGENTE ----
                  Só ícone, sem palavra: era uma caixa de marcação de largura
                  inteira no corpo para uma coisa que é sim ou não.

                  VERMELHO NOS DOIS ESTADOS, e não só quando ligado. Urgência
                  é a única coisa nesta tela que usa rust, então a cor já
                  identifica o botão antes de dizer se ele está aceso.

                  LIGADO = fundo rosado e um VISTO no canto. O triângulo não
                  muda: quem carrega o estado é o par fundo+visto, e o visto é
                  o que diz "está marcado" para quem não lê a diferença entre
                  um branco e um rosa muito claro. Forma além de cor, como no
                  resto do app.

                  Só aparece em obra avulsa que você ainda NÃO tem: urgência é
                  a pressa de conseguir, e o que já está na estante não tem
                  pressa nenhuma. Em série, a pressa é de cada volume. */}
              {tipoOf(obra) === 'avulso' && obra.status !== 'biblioteca' && (
                <button
                  className={`neo-icon !w-9 !h-9 shrink-0 relative !border !border-rust !text-rust
                    ${obra.urgencia ? '!bg-tinta-rust' : ''}`}
                  onClick={() => upsertObra({ ...obra, urgencia: !obra.urgencia })}
                  aria-pressed={!!obra.urgencia}
                  title={obra.urgencia ? 'Tirar a marca de urgente' : 'Marcar como urgente'}
                  aria-label={obra.urgencia ? 'Tirar a marca de urgente' : 'Marcar como urgente'}
                >
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor"
                       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4.2 21 19.4H3L12 4.2Z" />
                    <path d="M12 10v3.6M12 16.4h.01" />
                  </svg>

                  {/* O visto encosta na borda do disco, no alto à direita: é o
                      lado onde o triângulo afina, e o único canto com espaço
                      livre. Embaixo ele cairia sobre a base, que é a parte
                      larga da figura.

                      Preenchido em rust com o visto em papel, e não o
                      contrário: a pastilha precisa se separar de um fundo que
                      também é rosado. */}
                  {obra.urgencia && (
                    <span className="absolute -top-px -right-px w-[14px] h-[14px] rounded-full bg-rust text-paper
                                     inline-flex items-center justify-center ring-2 ring-surface">
                      <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l5 5L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              )}

              {/* o título saiu daqui: com três botões ao lado ele só cabia
                  truncado. Agora abre o corpo, com a largura toda. */}
              <span className="flex-1" />

              {/* Duplicar vive ao lado de Editar porque é a mesma família de
                  ação — e porque quase sempre o passo seguinte é editar a
                  cópia. Só ícone: o cabeçalho já carrega três controles. */}
              <button
                className="neo-icon !w-9 !h-9 shrink-0"
                onClick={() => onDuplicar?.(obra)}
                title="Duplicar esta obra"
                aria-label="Duplicar esta obra"
              >
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>

              <button className="neo-btn !py-1.5 !px-3 shrink-0" onClick={() => onEdit?.(obra)}>
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                Editar
              </button>
              <button className="neo-icon !w-9 !h-9 shrink-0" onClick={onClose}>×</button>
            </div>
            <div className="flex-1 overflow-auto">

              {/* ---- CAPA E IDENTIDADE, lado a lado ----
                  Antes o título ocupava uma faixa própria e a capa dividia a
                  linha seguinte com uma grade de quatro números. A grade saiu
                  (ver abaixo) e, sem ela, a capa ficaria sozinha ao lado de um
                  vazio — então o título desceu para o lado dela, que é onde ele
                  sempre quis estar: capa e nome são a mesma informação dita de
                  dois jeitos, e lê-las juntas é mais rápido que lê-las em
                  sequência.

                  A capa continua em caixa QUADRADA, como na galeria: a imagem
                  fica contida dentro, sem recorte, e o placeholder preenche. */}
              <div className="flex gap-4 px-5 pt-5 pb-4">
                <CapaDaFicha obra={obra} src={coverOf(obra, filters.status)} />

                <div className="min-w-0 flex-1">
                  {edOf(obra) && (
                    <div className="font-rotulo text-rotulo uppercase text-acento-texto">{edOf(obra)}</div>
                  )}
                  <h2 className="mt-1.5 font-display text-secao sm:text-titulo text-ink leading-tight break-words">{obra.nome}</h2>
                  <Autores key={obra.id} obra={obra} />
                </div>
              </div>

              {/* ---- OS SELOS, no lugar da ficha técnica ----
                  Edição e origem eram linhas de uma lista
                  rotulada — quatro rótulos para quatro palavras. Viram selos
                  porque são ETIQUETAS: valores curtos de um conjunto fechado,
                  que se reconhecem pela forma antes de serem lidos. E é a mesma
                  linguagem do cartão da galeria, então quem já viu a obra na
                  grade reencontra aqui os mesmos sinais.

                  O status entra junto, e não mais numa célula de painel: ele é
                  da mesma natureza dos outros: um fato curto sobre a obra. */}
              <div className="flex flex-wrap gap-1.5 px-5 pb-5">
                {/* O STATUS E O TIPO SAÍRAM DAQUI.

                    O status porque o seletor Quero/Tenho está logo abaixo, e
                    um selo acima dele era a mesma pergunta respondida duas
                    vezes na mesma tela — o eco que esta ficha veio eliminar. O
                    seletor ganha: ele não só informa, deixa mudar. Em série e
                    box, onde não há seletor, quem responde é a seção de
                    Volumes, com o número exato ("2 de 3") em vez de um sim ou
                    não que seria sempre impreciso.

                    O tipo porque "Avulso" é o caso comum e dizer o óbvio é
                    ruído: uma obra sem lista de volumes é avulsa, e uma com
                    lista é série ou box — a própria seção de Volumes mostra
                    isso melhor do que a palavra. */}
                {/* +18 VEM PRIMEIRO, e preenchido em tinta cheia: é o único
                    selo desta linha que muda o que se pode fazer com a obra, e
                    não só o que ela é. Preto com tinta clara é a cor que a
                    classificação brasileira usa para o 18 na capa — quem
                    cadastrou olhando para a capa reencontra o mesmo sinal.

                    Não usa rust de propósito: nesta tela o rust é da urgência,
                    e duas coisas diferentes na mesma cor deixam as duas mais
                    fracas. */}
                {obra.adulto && <span className="pill bg-ink text-paper">+18</span>}
                {edicaoDe(obra) && <span className="pill pill-edicao">{edicaoDe(obra)}</span>}
                {/* "EDIÇÃO" NA FRENTE porque sozinhas as palavras eram ambíguas:
                    "Importado" ao lado do nome de um quadrinho lê como se a OBRA
                    fosse estrangeira, quando o que é importado é esta edição —
                    um Batman publicado pela Panini é obra estrangeira e edição
                    nacional. Com o substantivo na frente, o selo diz de que
                    está falando.

                    "Importada", no feminino: concorda com edição. */}
                {isImp(obra)
                  ? <span className="pill pill-imp">Edição importada</span>
                  : <span className="pill bg-toque text-ink-soft">Edição nacional</span>}

                {/* O LINK DO GUIA FECHA ESTA LINHA, empurrado para a direita.
                    Tinha um bloco próprio logo abaixo e, sem a lista rotulada
                    que ele acompanhava, ficou boiando entre dois espaços em
                    branco. Ele é "mais sobre esta obra, em outro lugar" — da
                    mesma natureza dos selos, que é o que a obra É. Na mesma
                    linha, some um bloco inteiro de altura.

                    Link, e não botão: o Guia não tem API, é só um atalho. E
                    discreto de propósito — a ação principal desta tela é o que
                    você faz com a SUA obra, não sair do app. */}
                <a href={linkDoGuia(obra.nome)} target="_blank" rel="noopener noreferrer"
                   title="Abrir a ficha desta obra no Guia dos Quadrinhos"
                   className="ml-auto self-center inline-flex items-center gap-1 text-apoio text-ink-faint
                              hover:text-acento-texto underline underline-offset-2 decoration-linha
                              hover:decoration-current transition-colors">
                  Guia dos Quadrinhos
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              </div>

              {/* A LISTA ROTULADA SAIU DAQUI.

                  Ela trazia Tipo, Edição, Origem, País, Autores e Volumes —
                  e cinco desses seis já estavam ditos noutro lugar da mesma
                  tela: tipo e volumes na grade de números logo acima, autores
                  em lugar nenhum de destaque, origem numa linha de uma
                  palavra. O país saiu do app inteiro. Agora o que sobrou virou
                  selo, a autoria subiu
                  para debaixo do título (onde se procura por ela) e os volumes
                  têm a seção própria, lá embaixo, que sempre tiveram.

                  O link do Guia subiu para a linha dos selos. */}

              {/* `key` na obra: trocando de obra, o componente é outro e o
                  rascunho local da anotação nasce com o texto certo. Sem ela,
                  o React reaproveitaria o mesmo componente e o texto da obra
                  anterior ficaria no campo da seguinte. */}
              <Situacao key={obra.id} obra={obra} />

              {/* ---- volumes ---- */}
              {multi && (
                <div className="px-5 pb-6 border-t border-linha pt-5">
                  {/* O título dos volumes e o botão que os solta dividem a
                      mesma linha: a ação fica encostada no que ela desfaz.

                      Aqui, e não no cabeçalho da gaveta, porque lá já moram
                      quatro controles e porque desmembrar não é irmão de
                      fixar ou duplicar — é uma ação de estrutura, e ela só
                      existe para quem tem volumes. */}
                  <div className="flex items-baseline gap-3 mb-3">
                    <div className="font-rotulo text-rotulo uppercase text-ink-faint flex-1 min-w-0">
                      Volumes — {ownedCount(obra)} de {unidades}
                      {filtrando && (
                        <span className="text-acento-texto"> · {notaDoFiltro} ({volumes.length})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="neo-btn !py-1 !px-2.5 shrink-0"
                      onClick={desmembrar}
                      title={`Transformar os ${unidades} volumes em ${unidades} obras avulsas`}
                    >
                      <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {/* um bloco em cima, três soltos embaixo: a figura diz
                            o que o botão faz sem precisar da palavra */}
                        <rect x="7" y="3" width="10" height="6" rx="1.5" />
                        <path d="M12 9v3M5 15v-1.5a1.5 1.5 0 0 1 1.5-1.5h11a1.5 1.5 0 0 1 1.5 1.5V15" />
                        <rect x="2" y="15" width="6" height="6" rx="1.5" />
                        <rect x="16" y="15" width="6" height="6" rx="1.5" />
                      </svg>
                      Desmembrar
                    </button>
                  </div>
                  {/* A grade estica todas as células até a altura da mais alta e o
                      selo é empurrado para baixo com mt-auto. Assim o nome pode
                      quebrar em quantas linhas precisar — SEM corte — e os selos
                      continuam alinhados na mesma linha de base. */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {volumes.map((v, i) => {
                      /* O índice que vai para a fila é o da obra, não o
                         desta lista: com o filtro em "Tenho", `volumes` é um
                         recorte, e o 2º da tela pode ser o 5º da série. Os
                         objetos são os mesmos (unitsForStatus filtra o array
                         de volsOf sem copiar), então `indexOf` acha o certo. */
                      const iReal = todosOsVolumes.indexOf(v)
                      const owns = v.status === 'biblioteca'
                      const label = v.nome || `Vol. ${i + 1}`
                      return (
                        <div key={i} className="flex flex-col gap-2 min-w-0">
                          {/* mesma caixa quadrada da galeria */}
                          <div className={`w-full aspect-square relative flex items-center justify-center ${owns ? '' : 'opacity-55'}`}>
                            {v.imagem
                              ? <img src={v.imagem} alt="" loading="lazy" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_10px_20px_-10px_rgba(33,33,33,.55)]" />
                              : <div className={`w-full h-full rounded-pequeno flex items-center justify-center shadow-[0_10px_20px_-10px_rgba(33,33,33,.55)] ${classeTinta(label)}`}>
                                  <span className="font-display font-semibold text-secao leading-none text-sobre-tinta">{initials(label)}</span>
                                </div>}
                          </div>
                          {/* nome INTEIRO: quebra livre, sem line-clamp */}
                          <div className="text-apoio leading-snug text-ink break-words text-center">{label}</div>
                          <div className="flex items-center justify-center gap-1.5 mt-auto">
                            <span className={`pill ${owns ? 'pill-tenho' : 'pill-quero'}`}>{owns ? 'Tenho' : 'Quero'}</span>
                            <BotaoFila
                              compacto
                              rotulo={label}
                              naLista={naFila(fila, obra.id, iReal)}
                              cabe={podeEnfileirar(v)}
                              onClick={() => alternarFila(obra.id, iReal)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const IconFixar = ({ preenchido }) => (
  <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24"
       fill={preenchido ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
)
