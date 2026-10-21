import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import {
  MOLA_GAVETA, FADE, VOLTA_DO_ARRASTO, ELASTICO_DIREITA, ELASTICO_BAIXO,
  deveDispensar, useEhDesktop, usaMovimentoReduzido,
} from '../lib/motion.js'
import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { linkDoGuia } from '../lib/catalogo.js'
import { Switch, CheckTile, lbl, box } from './Campos.jsx'
import { EstrelasInput } from './Estrelas.jsx'
import { coverOf, tipoOf, edOf, edicaoDe, isImp, authorsOf, paisesOf, unitsForStatus, avgNota, unitsOf, ownedCount, sumValor, fmtBRL, statusMatch, initials, classeTinta, volumesSemCapa, naFila, podeEnfileirar , moneyFormat, moneyToNumber } from '../lib/helpers.js'

/* ------------------------------------------------------------------
   SITUAÇÃO E ANOTAÇÃO, EDITÁVEIS AQUI MESMO

   Estavam dentro do editor, numa seção chamada "Situação". Saíram de lá
   porque não são da mesma natureza do resto do editor: título, autoria,
   editora e país descrevem a OBRA — existiriam igual se ela não fosse sua.
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
          {tem && (
            <>
              <div className={box}>
                <label className={lbl}>Valor pago</label>
                <input
                  className="field-input" inputMode="numeric"
                  defaultValue={obra.valorPago ? moneyFormat(obra.valorPago) : ''}
                  onBlur={e => {
                    const v = moneyToNumber(e.target.value)
                    if (v !== (obra.valorPago || 0)) gravar({ valorPago: v })
                  }}
                  placeholder="R$ 0,00"
                />
              </div>

              {/* UMA LINHA, DOIS ESTADOS DA MESMA PERGUNTA: "e aí, já leu?"
                  Antes de ler, o que falta é a vez na fila; depois de ler, o
                  que falta é a nota. Nunca os dois ao mesmo tempo — então o
                  segundo lugar da linha é um só, e troca de ocupante.

                  Empilhados, eram três linhas para três perguntas que são uma
                  só, e a fila ainda morava longe, lá em cima, perto da ficha
                  técnica — onde não tinha nada a ver com o que está ao redor.

                  Quem some sozinho é a fila: `podeEnfileirar` já exige estar
                  na estante e NÃO estar lido, que é exatamente a condição do
                  ternário. O `BotaoFila` devolve `null` quando não cabe, e o
                  ternário existe para pôr as estrelas no lugar vago. */}
              <div className="flex items-center gap-2.5">
                <CheckTile checked={!!obra.lido} onChange={e => gravar({ lido: e.target.checked, ...(e.target.checked ? {} : { nota: 0 }) })}>
                  Lido
                </CheckTile>

                {obra.lido ? (
                  <div className="flex-1 h-[42px] flex items-center justify-center">
                    <EstrelasInput value={obra.nota || 0} onChange={n => gravar({ nota: n })} />
                  </div>
                ) : (
                  <BotaoFila
                    naLista={naFila(fila, obra.id, null)}
                    cabe={podeEnfileirar(obra)}
                    onClick={() => alternarFila(obra.id, null)}
                  />
                )}
              </div>
            </>
          )}
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

function Numero({ rotulo, valor, sub, capitalizar }) {
  return (
    <div className="bg-surface px-3.5 py-3">
      <dt className="font-rotulo text-rotulo uppercase text-ink-faint">{rotulo}</dt>
      <dd className="mt-1.5 flex items-baseline gap-1.5 min-w-0">
        <span className={`font-mono text-secao text-ink tabular-nums truncate ${capitalizar ? 'capitalize' : ''}`}>{valor}</span>
        {sub ? <span className="text-apoio text-ink-faint shrink-0">{sub}</span> : null}
      </dd>
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
      title={titulo} className={'neo-btn flex-1 justify-center ' + (naLista ? '!bg-moss !text-sobre-acento !border-moss' : '')}>
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
              {/* ---- URGENTE ----
                  Mora na PONTA ESQUERDA do cabeçalho, sozinho, longe dos
                  outros três. Os de lá são ações sobre a ficha — fixar,
                  duplicar, editar, fechar; este é um ESTADO da obra, e o
                  único da ficha que precisa ser visto sem rolar.

                  Só ícone, sem palavra: era uma caixa de marcação de largura
                  inteira no corpo para uma coisa que é sim ou não.

                  VERMELHO NOS DOIS ESTADOS, e não só quando ligado. Urgência
                  é a única coisa nesta tela que usa rust, então a cor já
                  identifica o botão antes de dizer se ele está aceso. O que
                  separa ligado de desligado é o PREENCHIMENTO: apagado, o
                  triângulo é só contorno sobre o fundo da barra; aceso, ele
                  é um bloco cheio. Forma, não só cor — quem não distingue
                  rust de tinta ainda vê um triângulo encher.

                  Só aparece em obra avulsa que você ainda NÃO tem: urgência é
                  a pressa de conseguir, e o que já está na estante não tem
                  pressa nenhuma. Em série, a pressa é de cada volume. */}
              {tipoOf(obra) === 'avulso' && obra.status !== 'biblioteca' && (
                <button
                  className={`neo-icon !w-9 !h-9 shrink-0 !border-rust ${obra.urgencia ? '!bg-rust !text-paper' : '!text-rust'}`}
                  onClick={() => upsertObra({ ...obra, urgencia: !obra.urgencia })}
                  aria-pressed={!!obra.urgencia}
                  title={obra.urgencia ? 'Tirar a marca de urgente' : 'Marcar como urgente'}
                  aria-label={obra.urgencia ? 'Tirar a marca de urgente' : 'Marcar como urgente'}
                >
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24"
                       fill={obra.urgencia ? 'currentColor' : 'none'} stroke="currentColor"
                       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4.2 21 19.4H3L12 4.2Z" />
                    {!obra.urgencia && <path d="M12 10v3.6M12 16.4h.01" />}
                  </svg>
                </button>
              )}

              {/* o título saiu daqui: com três botões ao lado ele só cabia
                  truncado. Agora abre o corpo, com a largura toda. */}
              <span className="flex-1" />

              {/* Fixar destaca a obra na grade. Só uma por vez: fixar outra
                  troca a anterior, e clicar de novo desafixa. */}
              <button
                className={`neo-icon !w-9 !h-9 shrink-0 ${estaFixada ? '!bg-moss !text-sobre-acento' : ''}`}
                onClick={() => fixarObra(obra.id)}
                aria-pressed={estaFixada}
                title={estaFixada ? 'Desafixar da grade' : 'Fixar como destaque da grade'}
                aria-label={estaFixada ? 'Desafixar da grade' : 'Fixar como destaque da grade'}
              >
                <IconFixar preenchido={estaFixada} />
              </button>

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

              {/* ---- título, com a largura inteira para quebrar ---- */}
              <div className="px-5 pt-5">
                {edOf(obra) && (
                  <div className="font-rotulo text-rotulo uppercase text-acento-texto">{edOf(obra)}</div>
                )}
                <h2 className="mt-2 font-display text-titulo text-ink break-words">{obra.nome}</h2>
              </div>

              {/* ---- capa quadrada + números da obra ---- */}
              <div className="flex gap-4 px-5 pt-4 pb-5">
                {/* caixa QUADRADA, como na galeria. A capa fica contida dentro,
                    sem recorte; o placeholder preenche o quadrado. */}
                <div className="w-24 sm:w-28 shrink-0 self-start aspect-square relative flex items-center justify-center">
                  {coverOf(obra, filters.status)
                    ? <img src={coverOf(obra, filters.status)} alt="" className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_18px_30px_-18px_rgba(33,33,33,.55)]" />
                    : <div className={`w-full h-full flex items-center justify-center text-sobre-tinta ${classeTinta(edOf(obra) || obra.nome)}`}>
                        <span className="font-display font-semibold text-titulo leading-none">{initials(obra.nome)}</span>
                      </div>}
                </div>

                {/* números com régua, nunca crus */}
                <dl className="flex-1 min-w-0 grid grid-cols-2 gap-px bg-linha rounded-medio overflow-hidden border border-linha self-start">
                  <Numero rotulo="Status" valor={statusMatch(obra, 'biblioteca') ? 'Tenho' : 'Quero'} />
                  {multi
                    ? <Numero rotulo="Na estante" valor={ownedCount(obra)} sub={`de ${unidades}`} />
                    : <Numero rotulo="Tipo" valor={tipoOf(obra)} capitalizar />}
                  <Numero rotulo="Nota" valor={avgNota(obra) > 0 ? avgNota(obra).toFixed(1).replace('.', ',') : '—'} sub={avgNota(obra) > 0 ? 'de 5' : null} />
                  <Numero rotulo="Investido" valor={sumValor(obra) > 0 ? fmtBRL(sumValor(obra)) : '—'} />
                </dl>
              </div>

              {/* ---- ficha técnica: rótulo mono à esquerda, valor à direita ---- */}
              <div className="px-5 pb-5">
                <dl className="rounded-medio border border-linha overflow-hidden">
                  {[
                    ['Tipo', tipoOf(obra)],
                    ['Edição', edicaoDe(obra)],
                    ['Origem', isImp(obra) ? 'Importado' : 'Nacional'],
                    ['País', paisesOf(obra).join(', ')],
                    ['Autores', authorsOf(obra).join(', ')],
                    multi ? ['Volumes', `${ownedCount(obra)} de ${unidades}`] : null,
                  ].filter(l => l && l[1]).map(([k, v], i) => (
                    <div key={k} className={`flex items-baseline gap-4 px-4 py-2.5 ${i ? 'border-t border-linha' : ''}`}>
                      <dt className="font-rotulo text-rotulo uppercase text-ink-faint w-[86px] shrink-0">{k}</dt>
                      <dd className={`text-corpo text-ink min-w-0 ${k === 'Tipo' ? 'capitalize' : ''}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
                {/* Consultar a ficha da obra onde a edição brasileira está
                    certa. Link, não consulta: o Guia não tem API.

                    DISCRETO, e não um botão de largura inteira. Ocupando a
                    linha toda logo abaixo da ficha, ele lia como a ação
                    principal da tela — e a ação principal daqui é o que você
                    faz com a SUA obra, não sair do app. Encolhido e alinhado
                    à direita, continua ao alcance de quem procura por ele e
                    para de disputar com o resto.

                    O rótulo perdeu o "Ver no": a seta já diz que leva para
                    fora, e o nome do destino basta. */}
                <div className="flex justify-end mt-2">
                  <a href={linkDoGuia(obra.nome)} target="_blank" rel="noopener noreferrer"
                     title="Abrir a ficha desta obra no Guia dos Quadrinhos"
                     className="inline-flex items-center gap-1 text-apoio text-ink-faint hover:text-acento-texto
                                underline underline-offset-2 decoration-linha hover:decoration-current transition-colors">
                    Guia dos Quadrinhos
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </a>
                </div>
              </div>

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
