import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FADE, MOLA_GAVETA } from '../lib/motion.js'
import { useStore } from '../lib/store.jsx'
import { reduzirFoto } from '../lib/foto.js'
import { initials, classeTinta } from '../lib/helpers.js'
import PopupDocumentos from './Documentos.jsx'
import PopupTutorialGitHub from './TutorialGitHub.jsx'
import AvisoSemServidor from './AvisoSemServidor.jsx'
import {
  TERMOS_VERSAO, DIGITOS, TENTATIVAS_MAX, VALIDADE_MIN, ESPERA_REENVIO_S,
  MAIORIDADE, emailValido, normalizarEmail, erroNascimento, idadeEm,
  pedirCodigo, conferirCodigo, esperaRestante, codigoPendente, limparCodigo,
} from '../lib/conta.js'

/* A PORTA: entrar, confirmar, cadastrar.
 *
 * Fica ENTRE a capa e a coleção. A capa continua sendo a capa — a imagem
 * grande, o logo, um botão só —, e o botão dela agora diz "Entrar" porque é
 * isto que vem depois.
 *
 * O CABEÇALHO FICA, no modo `soMarca` (ver Header.jsx): só o logo no centro,
 * sem busca, sem menu, sem contagem. O logo precisa continuar existindo aqui
 * porque é ele que viaja da capa até a barra (`layoutId="marca"`), e cortar o
 * cabeçalho nesta tela faria a marca sumir no meio da viagem para reaparecer
 * depois do login. As ferramentas é que saem: são portas para uma coleção que
 * ainda não se sabe de quem é.
 *
 * TRÊS PASSOS, UM ESTADO. Entrar e cadastrar terminam no MESMO lugar — a tela
 * do código —, e o que muda é só o que acontece quando o código confere:
 * entrar abre a sessão, cadastrar cria a conta e abre a sessão. Por isso o
 * cadastro em andamento fica guardado em `cadastro` enquanto o código é
 * conferido, em vez de a conta nascer antes da confirmação. Conta criada antes
 * do código seria conta criada com e-mail que ninguém provou ter.
 *
 * SEM SENHA. O que prova que o e-mail é seu é o código que chega nele. Não há
 * senha para esquecer, para vazar nem para repetir de outro site — e o custo é
 * depender da caixa de entrada para entrar, que é o mesmo custo de qualquer
 * "esqueci minha senha".
 *
 * ETAPA 0: não há servidor nenhum, e o código aparece na tela. Ver o topo de
 * `lib/conta.js` — é lá que mora a explicação, e é lá que a Etapa 1 mexe.
 */

/* As palavras de cada erro moram aqui, não no `conta.js`.
 *
 * O módulo devolve código ('expirado', 'queimado'); a tela escolhe a frase.
 * Assim o servidor da Etapa 1 pode devolver os mesmos códigos sem carregar
 * texto em português, e mudar uma frase não mexe em lógica nenhuma. */
const TEXTO_ENVIO = {
  email: 'Esse e-mail não parece completo.',
  demais: 'Muitos códigos pedidos para este e-mail na última hora. Tente mais tarde.',
}

const TEXTO_CODIGO = {
  curto: `Faltam dígitos — o código tem ${DIGITOS}.`,
  nenhum: 'Esse código não vale mais. Peça outro.',
  expirado: `O código venceu (vale ${VALIDADE_MIN} minutos). Peça outro.`,
  queimado: 'Erramos vezes demais, e o código foi cancelado. Peça outro.',
}

/* ------------------------------------------------------------------
   OS SEIS QUADRADOS

   Um quadrado por dígito, e não um campo de texto só, porque o código vem de
   um e-mail e é LIDO antes de ser digitado: seis caixas dizem de olho quantos
   dígitos faltam e dão onde conferir o que já foi batido. Num campo corrido,
   "48213" e "482130" têm a mesma cara.

   O valor é UMA string de até 6 dígitos, sem buracos: preenche da esquerda
   para a direita e o foco anda sozinho. Por isso clicar numa caixa adiante das
   preenchidas devolve o foco para a primeira vazia — com buracos permitidos,
   "4_2_1_" seria um estado possível, e nenhum servidor sabe o que fazer com
   ele.

   `inputMode="numeric"`: teclado de números no celular. `autoComplete=
   "one-time-code"` só na PRIMEIRA caixa — é o que faz o iOS e o Android
   oferecerem o código vindo da notificação; nas seis, o preenchimento
   automático dispara seis vezes e embaralha.

   COLAR é tratado à parte, com `onPaste`. As caixas têm `maxLength={1}`, que
   é o que impede dois dígitos na mesma caixa ao digitar — e é também o que
   cortaria uma cola de seis para um. Interceptando a cola antes, os seis
   dígitos se espalham pelas seis caixas, que é o que quem colou quis dizer.
   ------------------------------------------------------------------ */
function CampoCodigo({ valor, onChange, onCompleto, invalido }) {
  const refs = useRef([])

  /* O ESPELHO DO VALOR, e por que ele precisa existir.
   *
   * O foco anda sozinho: escrevendo na caixa 0, o cursor pula para a 1 — e
   * esse pulo acontece DENTRO do `onChange`, antes de o React redesenhar.
   * Nesse instante, o `valor` que as funções enxergam ainda é o de antes.
   *
   * O guarda do `onFocus` (que devolve o cursor para a primeira caixa vazia)
   * lia justamente esse valor velho: via a caixa 1 recebendo foco com o campo
   * ainda "vazio", concluía que era um salto adiante e mandava o cursor de
   * volta para a 0. Que já estava cheia. E `maxLength={1}` recusa o segundo
   * dígito — então o campo TRAVAVA no primeiro número, sem erro nenhum na
   * tela.
   *
   * O espelho é atualizado no mesmo gesto que muda o valor, e não só a cada
   * render. Assim o guarda sempre pergunta ao presente.
   *
   * (Escapou dos primeiros testes porque colar não passa pelo avanço
   * automático: cola os seis de uma vez e nunca move o foco entre caixas.) */
  const valorRef = useRef(valor)
  valorRef.current = valor

  /* Campo vazio chama o foco para a primeira caixa. Vale ao abrir a tela — o
     cursor tem de estar onde se digita, sem um clique só para isso — e vale
     depois de cada erro, que é quando o pai limpa tudo. */
  useEffect(() => { if (valor === '') refs.current[0]?.focus() }, [valor])

  /* Muda o valor e leva o foco junto, avisando o espelho antes do pulo. */
  const aplicar = (novo) => {
    valorRef.current = novo
    onChange(novo)
    refs.current[Math.min(novo.length, DIGITOS - 1)]?.focus()
  }

  const escrever = (i, texto) => {
    const limpo = (texto || '').replace(/\D/g, '')
    if (!limpo) return
    const novo = (valorRef.current.slice(0, i) + limpo).slice(0, DIGITOS)
    aplicar(novo)
    if (novo.length === DIGITOS) onCompleto(novo)
  }

  /* Backspace apaga sempre o ÚLTIMO dígito, não o da caixa focada. Sem
     buracos, o último é o único que pode sair sem deixar um. */
  const aoTecla = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      aplicar(valorRef.current.slice(0, Math.max(0, valorRef.current.length - 1)))
    } else if (e.key === 'ArrowLeft') {
      refs.current[Math.max(0, i - 1)]?.focus()
    } else if (e.key === 'ArrowRight') {
      refs.current[Math.min(DIGITOS - 1, i + 1)]?.focus()
    }
  }

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-center" role="group" aria-label={`Código de ${DIGITOS} dígitos`}>
      {Array.from({ length: DIGITOS }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={valor[i] || ''}
          aria-label={`Dígito ${i + 1}`}
          aria-invalid={invalido || undefined}
          onChange={e => escrever(i, e.target.value)}
          onPaste={e => { e.preventDefault(); escrever(0, e.clipboardData.getData('text')) }}
          onKeyDown={e => aoTecla(i, e)}
          /* Foco numa caixa adiante volta para a primeira vazia: ver o
             comentário do bloco sobre buracos. */
          onFocus={() => {
            const v = valorRef.current                 // o presente, não o render anterior
            if (i > v.length) refs.current[Math.min(v.length, DIGITOS - 1)]?.focus()
          }}
          /* `font-mono` e largura fixa: dígito a dígito, as caixas não podem
             mudar de tamanho conforme o número que caiu dentro. */
          className={`w-11 h-14 sm:w-12 sm:h-16 text-center font-mono text-secao rounded-medio
            border bg-paper text-ink outline-none transition-colors
            ${invalido ? 'border-rust' : 'border-contorno focus:border-moss'}
            focus:shadow-[0_0_0_3px_rgb(var(--moss-2)/.14)]`}
        />
      ))}
    </div>
  )
}


/* Rótulo de campo, repetido em todo formulário do app. */
const rot = 'font-rotulo text-rotulo uppercase text-ink-soft pl-0.5'

/* Erro de um campo. Some quando não há erro — e não fica um espaço vazio
   reservado: num formulário de seis linhas, seis espaços reservados somam
   um buraco do tamanho de outro campo. */
const Erro = ({ children }) =>
  children ? <p className="text-apoio text-rust leading-snug pl-0.5">{children}</p> : null

/* ==================================================================
   A TELA
   ================================================================== */
export default function Entrada() {
  const { conta, criarConta, entrarNaConta } = useStore()

  /* O QUE JÁ ESTAVA PENDENTE quando esta tela nasceu.
   *
   * Um código vive no localStorage, então recarregar a página no meio da
   * confirmação não pode voltar para o começo: o código continua válido e
   * continua na caixa de entrada.
   *
   * Isso é ESTADO INICIAL, não efeito. Tentei primeiro com um `useEffect` de
   * montagem chamando `setPasso('codigo')`, e ele revelou um bom motivo para
   * não fazer assim: o `AnimatePresence` recebia uma troca de passo no mesmo
   * quadro da montagem, segurava a saída do passo antigo e nunca montava o
   * novo — `passo` dizia 'codigo' e a tela mostrava 'entrar', sem erro nenhum.
   *
   * Nascer no passo certo não tem esse problema, e ainda evita o piscar da
   * tela de entrar antes da troca. Quem recompõe um estado salvo está
   * escolhendo onde começar, não navegando para outro lugar.
   *
   * `useState(...)` com função passa um inicializador: ele roda uma vez e o
   * resultado fica. Lido direto no corpo, releria a cada render.
   *
   * SÓ RECOMPÕE CÓDIGO DE CONTA QUE EXISTE. Um F5 no meio do CADASTRO perde o
   * formulário, que vivia na memória, mas não o código, que vive no disco.
   * Recompondo esse código, acertá-lo abriria sessão para uma conta que nunca
   * nasceu — e o portão do App, que exige sessão E conta, deixaria a pessoa
   * presa nesta tela sem dizer por quê. Então esse código é descartado e o
   * cadastro recomeça, que é a única coisa que pode dar certo. */
  const [pendente] = useState(() => {
    const p = codigoPendente()
    if (!p) return null
    if (p.email !== conta.email) { limparCodigo(); return null }
    return p
  })

  /* SEM CONTA NESTE NAVEGADOR, A TELA ABRE NO CADASTRO.
   *
   * A tela de entrar é um beco sem saída quando não há conta: não existe
   * servidor onde procurar, então o e-mail NUNCA vai ser encontrado e a única
   * resposta possível é um erro vermelho. Era o que acontecia com quem já
   * usava o app antes de existirem contas — abria, digitava o próprio e-mail,
   * e recebia "não encontramos conta com esse e-mail".
   *
   * Abrindo direto no cadastro, a primeira coisa que a pessoa vê é o caminho
   * que funciona. O link "Já tem conta? Entrar" continua ali para quem quiser
   * a outra tela.
   *
   * O código pendente ganha de tudo: se há um em andamento, é nele que a tela
   * abre, com ou sem conta. */
  const [passo, setPasso] = useState(() =>
    pendente ? 'codigo' : (conta.email ? 'entrar' : 'cadastro')
  )  // 'entrar' | 'codigo' | 'cadastro'
  const [enviando, setEnviando] = useState(false)
  const [termosAbertos, setTermosAbertos] = useState(false)
  const [tutorialAberto, setTutorialAberto] = useState(false)

  /* ENTRAR */
  const [email, setEmail] = useState(conta.email || '')
  const [erroEntrar, setErroEntrar] = useState('')

  /* CÓDIGO. `alvo` é o e-mail que está sendo confirmado — pode não ser o do
     campo de entrar, porque o cadastro também cai aqui. `cadastro` guarda a
     conta que vai nascer SE o código conferir; `null` significa que isto é um
     login numa conta que já existe. */
  const [alvo, setAlvo] = useState(() => (pendente ? pendente.email : ''))
  const [cadastro, setCadastro] = useState(null)
  const [digitos, setDigitos] = useState('')
  const [erroCodigo, setErroCodigo] = useState('')
  const [demo, setDemo] = useState('')             // só Etapa 0
  const [falta, setFalta] = useState(() => (pendente ? esperaRestante() : 0))

  /* Um relógio só, vivo enquanto a tela do código está no ar. Um intervalo
     por tique (recriado a cada mudança de `falta`) perderia segundos na troca. */
  useEffect(() => {
    if (passo !== 'codigo') return
    const t = setInterval(() => setFalta(esperaRestante()), 1000)
    return () => clearInterval(t)
  }, [passo])

  /* Pedir o código é o mesmo gesto vindo dos dois lados — daí uma função só.
     `novaConta` é o que vai nascer depois, ou `null` para login. */
  const pedir = async (destino, novaConta = null, { reenvio = false } = {}) => {
    setEnviando(true)
    const r = await pedirCodigo(destino)
    setEnviando(false)
    if (!r.ok) {
      const txt = r.erro === 'espere'
        ? `Espere ${r.segundos}s para pedir outro código.`
        : (TEXTO_ENVIO[r.erro] || 'Não deu para enviar agora.')
      if (reenvio) setErroCodigo(txt); else setErroEntrar(txt)
      return false
    }
    setAlvo(destino)
    setCadastro(novaConta)
    setDemo(r.codigo || '')          // vazio na Etapa 1, e o aviso some junto
    setDigitos('')
    setErroCodigo('')
    /* Zera a espera na hora, sem aguardar o próximo tique do relógio: o botão
       de reenviar tem de desabilitar no mesmo instante do clique. */
    setFalta(ESPERA_REENVIO_S)
    setPasso('codigo')
    return true
  }

  const aoEntrar = (e) => {
    e.preventDefault()
    setErroEntrar('')
    const destino = normalizarEmail(email)
    if (!emailValido(destino)) { setErroEntrar(TEXTO_ENVIO.email); return }
    /* DOIS CASOS DIFERENTES, que a mesma frase vinha tratando como um só.
     *
     * SEM CONTA NENHUMA não é erro de quem digitou: é o estado normal de quem
     * já usava o app antes de existirem contas, ou de um navegador novo. A
     * resposta certa é mandar para o cadastro, não acusar o e-mail.
     *
     * CONTA DE OUTRO E-MAIL é outra história — aí alguém errou a digitação ou
     * está no navegador errado, e precisa saber que existe conta aqui, só que
     * de outra pessoa.
     *
     * Etapa 0: existe UMA conta por navegador, e ela está aqui do lado. O
     * servidor da Etapa 1 responde isto de outro jeito — e há uma escolha a
     * fazer lá: dizer "não existe conta com esse e-mail" é o que ajuda quem
     * errou a digitar, e é também o que conta a estranhos quem tem conta.
     * Com cadastro em porta separada, como aqui, o uso ganha. */
    if (!conta.email) { setPasso('cadastro'); return }
    if (conta.email !== destino) {
      setErroEntrar('Este navegador tem conta com outro e-mail. Confira o que digitou, ou faça um cadastro novo.')
      return
    }
    pedir(destino)
  }

  const aoConferir = async (valor) => {
    setErroCodigo('')
    const r = await conferirCodigo(alvo, valor)
    if (!r.ok) {
      if (r.erro === 'errado') {
        setErroCodigo(`Código errado. ${r.restam} ${r.restam === 1 ? 'tentativa restante' : 'tentativas restantes'}.`)
      } else {
        setErroCodigo(TEXTO_CODIGO[r.erro] || 'Não deu para conferir.')
      }
      /* Errou: as caixas se esvaziam e o foco volta para a primeira.
         Mantendo os seis dígitos errados, corrigir um deles custaria seis
         backspaces — o campo não tem buracos, então só o último sai. Limpar
         é o que torna "3 tentativas restantes" uma frase sobre o que fazer
         agora, e não sobre o que já aconteceu. */
      if (r.erro !== 'curto') setDigitos('')
      return
    }
    /* Confere: agora, e só agora, a conta nasce. */
    if (cadastro) criarConta({ ...cadastro, email: r.email })
    else entrarNaConta(r.email)
    /* Não há `setPasso` aqui: a sessão abriu, o portão do App vê isso e esta
       tela inteira sai do ar. Mandar o passo adiante seria pintar um quarto
       estado que ninguém vê. */
  }

  const voltarParaEntrar = () => {
    limparCodigo()
    setPasso('entrar'); setDigitos(''); setErroCodigo(''); setDemo(''); setCadastro(null)
  }

  return (
    <>
      {/* O AVISO DE "AINDA SEM SERVIDOR" MORA AQUI, e só aqui.
       *
       * Esteve no topo da coleção e saiu de lá: dentro da estante ele é uma
       * faixa de alerta permanente sobre algo que não acabou de acontecer, e
       * faixa permanente vira paisagem — some do olhar e deixa de avisar.
       * Pior: ela aparecia por cima do que a pessoa abriu o app para ver.
       *
       * Na porta de entrada o lugar é outro. Aqui ainda não há coleção na
       * tela para atrapalhar, e aqui é onde a pergunta "onde isso tudo fica
       * guardado?" de fato se faz — na hora de criar a conta.
       *
       * NÃO aparece no passo do código: lá já existe o aviso dourado
       * explicando que o código está na tela por falta de servidor, e dois
       * recados sobre o mesmo assunto, empilhados, anulam um ao outro. */}
      {/* Largura contida: a faixa nasceu para o topo da estante, que é larga, e
          traz `max-w-[1320px]` consigo. Aqui embaixo há uma coluna de 420px —
          uma faixa de ponta a ponta sobre um formulário estreito joga o botão
          e o × para longe do texto que eles respondem. Este contêiner aperta o
          máximo interno sem a faixa precisar saber onde está. */}
      {passo !== 'codigo' && (
        <div className="mx-auto w-full max-w-[820px]">
          <AvisoSemServidor onTutorial={() => setTutorialAberto(true)} />
        </div>
      )}

      <main className="mx-auto w-full max-w-[1320px] px-5 pt-8 pb-20 sm:pt-16 flex justify-center">
        {/* Uma coluna estreita e centrada, não a largura da estante: aqui há
            uma pergunta por vez, e linha curta é o que faz formulário ler
            como formulário. */}
        <div className="w-full max-w-[420px]">
          {/* SEM AnimatePresence aqui. A troca de passo é remontagem pura: a
              `key` muda, o React desmonta o passo velho e monta o novo, e o
              `initial`/`animate` do motion.div dá a entrada.

              Houve duas tentativas com `AnimatePresence mode="wait"` e as duas
              travaram, de jeitos diferentes: com três filhos irmãos, a troca
              feita durante a montagem nunca completava; com um filho só e
              chave, foi a troca por clique que parou de completar — `passo` ia
              para 'cadastro' e a tela ficava em 'entrar', sem erro nenhum.

              `mode="wait"` segura a entrada do novo até o velho terminar de
              sair, e quando essa saída não termina não há nada na tela que
              diga isso. O que se ganha com ele aqui é um esmaecer de 0,22s; o
              que se perde quando falha é a tela inteira. Troca ruim.

              O preço é não haver animação de saída. A entrada deslizando de
              lado já conta "avançou um passo", que era o papel do conjunto. */}
          <div>
            <motion.div key={passo} {...FADE_PASSO}>
            {passo === 'entrar' && (
              <>
                <Titulo texto="Entrar" />

                <form onSubmit={aoEntrar} className="flex flex-col gap-4 mt-6" noValidate>
                  <div className="flex flex-col gap-1">
                    <label className={rot} htmlFor="entrada-email">E-mail</label>
                    <input
                      id="entrada-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      className="field-input"
                      placeholder="nome@exemplo.com"
                      value={email}
                      aria-invalid={!!erroEntrar || undefined}
                      onChange={e => { setEmail(e.target.value); setErroEntrar('') }}
                    />
                    <Erro>{erroEntrar}</Erro>
                  </div>

                  {/* `cta` cheio: é a única ação desta tela. */}
                  <button type="submit" className="cta cta-carimbo w-full justify-center !pl-6" disabled={enviando}>
                    {enviando ? 'Enviando…' : 'Entrar'}
                  </button>
                </form>

                {/* O cadastro fica ABAIXO e menor: quem já tem conta é a
                    maioria das visitas, e cadastrar-se acontece uma vez na
                    vida. Mesmo peso para os dois faria a porta ter duas
                    maçanetas. */}
                <p className="mt-6 text-center text-corpo text-ink-faint">
                  Primeira vez aqui?{' '}
                  <button
                    type="button"
                    onClick={() => { setPasso('cadastro'); setErroEntrar('') }}
                    className="text-moss underline underline-offset-2 font-medium"
                  >
                    Faça seu cadastro
                  </button>
                </p>
              </>
            )}

            {passo === 'codigo' && (
              <>
                <Titulo
                  texto="Confirme o código"
                  apoio={<>Enviamos {DIGITOS} dígitos para <strong className="text-ink-soft font-semibold">{alvo}</strong>.</>}
                />

                {/* ---- O AVISO DA ETAPA 0 ----
                    Sem servidor, nenhum e-mail sai — e um código invisível
                    tornaria a tela impossível de testar. Então ele aparece.

                    Fica numa caixa AMARELA e escrito "sem servidor" de
                    propósito: isto é andaime, não recurso. Na Etapa 1,
                    `r.codigo` deixa de vir, `demo` fica vazio e esta caixa
                    desaparece sozinha — sem ninguém ter de lembrar de tirá-la,
                    que é exatamente o jeito de um andaime destes ficar no ar
                    para sempre. */}
                {demo && (
                  <div className="mt-5 rounded-medio border border-gold/40 bg-gold/10 px-4 py-3">
                    <p className="font-rotulo text-rotulo uppercase text-ink-soft">Ainda sem servidor</p>
                    <p className="text-apoio text-ink-faint leading-relaxed mt-1">
                      Nenhum e-mail foi enviado. O código desta vez é{' '}
                      <strong className="font-mono text-corpo text-ink">{demo}</strong>.
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <CampoCodigo
                    valor={digitos}
                    onChange={v => { setDigitos(v); setErroCodigo('') }}
                    onCompleto={aoConferir}
                    invalido={!!erroCodigo}
                  />
                  <div className="mt-2 text-center">
                    <Erro>{erroCodigo}</Erro>
                  </div>
                </div>

                {/* Não há botão "confirmar": seis dígitos completos JÁ são o
                    gesto de confirmar, e um botão a mais depois do sexto
                    dígito é um passo que não decide nada. Quem erra recebe o
                    aviso e corrige no mesmo campo. */}
                <p className="mt-5 text-center text-apoio text-ink-faint leading-relaxed">
                  O código vale {VALIDADE_MIN} minutos e aceita {TENTATIVAS_MAX} tentativas.
                </p>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    className="neo-btn"
                    disabled={falta > 0 || enviando}
                    onClick={() => pedir(alvo, cadastro, { reenvio: true })}
                  >
                    {falta > 0 ? `Reenviar em ${falta}s` : (enviando ? 'Enviando…' : 'Reenviar o código')}
                  </button>
                  <button
                    type="button"
                    onClick={voltarParaEntrar}
                    className="text-apoio text-ink-faint underline underline-offset-2"
                  >
                    Usar outro e-mail
                  </button>
                </div>
              </>
            )}

            {passo === 'cadastro' && (
              <>
                <PassoCadastro
                  emailInicial={email}
                  enviando={enviando}
                  onVoltar={() => setPasso('entrar')}
                  onTermos={() => setTermosAbertos(true)}
                  onPronto={(dados) => pedir(dados.email, dados)}
                />
              </>
            )}
            </motion.div>
            </div>
        </div>
      </main>

      <PopupDocumentos open={termosAbertos} onClose={() => setTermosAbertos(false)} />
      <PopupTutorialGitHub open={tutorialAberto} onClose={() => setTutorialAberto(false)} />
    </>
  )
}

/* A entrada e a saída de cada passo. Objeto solto porque os três usam o
   mesmo — escrito três vezes, um deles acabaria diferente dos outros.
   Desloca no eixo X: os passos são uma sequência, e deslizar de lado é o que
   diz "avançou um" em vez de "trocou de assunto". */
const FADE_PASSO = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: FADE,
}

/* `apoio` é OPCIONAL, e sem ele não sobra parágrafo vazio.
   Um `<p>` sem conteúdo continua ocupando uma linha de altura, e o `gap-1.5`
   do cabeçalho ainda conta — o título ficaria com um degrau de ar embaixo
   sem nada dentro. */
function Titulo({ texto, apoio }) {
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="font-cartaz font-semibold uppercase text-secao text-acento-texto">{texto}</h1>
      {apoio && <p className="text-corpo text-ink-faint leading-relaxed">{apoio}</p>}
    </header>
  )
}

/* ------------------------------------------------------------------
   CADASTRO

   Componente próprio, e não mais um ramo do pai, porque ele tem seis campos
   com estado e validação de cada um — tudo isso dentro do pai faria a tela de
   entrar carregar o peso do cadastro sem precisar.

   A FOTO É O MESMO BOTÃO DO PERFIL, com o mesmo redutor (`lib/foto.js`): quem
   põe a foto aqui e quem troca depois estão fazendo a mesma coisa, e duas
   caras para a mesma coisa é uma a mais.
   ------------------------------------------------------------------ */
function PassoCadastro({ emailInicial, enviando, onVoltar, onTermos, onPronto }) {
  const [foto, setFoto] = useState(null)
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState(emailInicial || '')
  const [nascimento, setNascimento] = useState('')
  const [aceitou, setAceitou] = useState(false)
  const [erros, setErros] = useState({})
  const fotoRef = useRef(null)

  const aoEscolherFoto = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''                     // permite reescolher o MESMO arquivo
    if (!f) return
    try { setFoto(await reduzirFoto(f)) }
    catch (err) { setErros(x => ({ ...x, foto: 'Não deu para usar essa imagem: ' + (err && err.message) })) }
  }

  const idade = idadeEm(nascimento)
  /* O aviso do filtro aparece só quando a data já é válida E é de menor. Não é
     um erro — menor de idade usa o app —, é o que vai acontecer com o acervo
     adulto, dito antes de acontecer e não depois. */
  const menor = idade != null && idade >= 0 && idade < MAIORIDADE

  const enviar = (e) => {
    e.preventDefault()
    const novos = {}
    if (!nome.trim()) novos.nome = 'Como te chamamos?'
    if (!emailValido(email)) novos.email = 'Esse e-mail não parece completo.'
    const eN = erroNascimento(nascimento)
    if (eN) novos.nascimento = {
      vazio: 'Falta a data de nascimento.',
      invalido: 'Essa data não existe.',
      futuro: 'Essa data está no futuro.',
      antigo: 'Confira o ano.',
    }[eN]
    if (!aceitou) novos.termos = 'Para criar a conta é preciso aceitar os termos.'
    setErros(novos)
    if (Object.keys(novos).length) return

    /* O aceite guarda TRÊS coisas: que aceitou, QUAL versão, e QUANDO.
       Só "aceitou: true" não serve de nada no dia em que o texto mudar —
       ver o comentário de `TERMOS_VERSAO` em lib/termos.js. */
    onPronto({
      email: normalizarEmail(email),
      nascimento,
      termos: { aceito: true, versao: TERMOS_VERSAO, em: new Date().toISOString() },
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      foto,
    })
  }

  return (
    <>
      <Titulo texto="Criar conta" />


      <form onSubmit={enviar} className="flex flex-col gap-4 mt-6" noValidate>
        {/* ---- foto ---- */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fotoRef.current?.click()}
            aria-label={foto ? 'Trocar a foto de perfil' : 'Escolher uma foto de perfil'}
            className="relative w-[72px] h-[72px] shrink-0 rounded-full overflow-hidden border border-contorno
              inline-flex items-center justify-center transition-colors hover:border-moss-3"
          >
            {foto
              ? <img src={foto} alt="" className="absolute inset-0 w-full h-full object-cover" />
              : <span className={'w-full h-full inline-flex items-center justify-center font-display font-semibold text-secao text-sobre-tinta ' + classeTinta(nome || 'gibiteca')}>
                  {initials([nome, sobrenome].filter(Boolean).join(' ') || '?')}
                </span>}
          </button>
          <input ref={fotoRef} type="file" accept="image/*" hidden onChange={aoEscolherFoto} />
          <div className="min-w-0 flex-1">
            {/* Mesmo rótulo do perfil: o círculo já mostra as iniciais quando
                não há foto, então a frase que explicava isso saiu. */}
            <div className="font-rotulo text-rotulo uppercase text-ink-faint">Foto opcional</div>
            <Erro>{erros.foto}</Erro>
          </div>
        </div>

        {/* ---- nome ---- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={rot} htmlFor="cad-nome">Primeiro nome</label>
            <input id="cad-nome" className="field-input" autoComplete="given-name"
              value={nome} aria-invalid={!!erros.nome || undefined}
              onChange={e => setNome(e.target.value)} placeholder="Como te chamam" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={rot} htmlFor="cad-sobrenome">Sobrenome</label>
            <input id="cad-sobrenome" className="field-input" autoComplete="family-name"
              value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <Erro>{erros.nome}</Erro>

        {/* ---- e-mail ---- */}
        <div className="flex flex-col gap-1">
          <label className={rot} htmlFor="cad-email">E-mail</label>
          <input id="cad-email" type="email" inputMode="email" autoComplete="email" className="field-input"
            placeholder="nome@exemplo.com" value={email} aria-invalid={!!erros.email || undefined}
            onChange={e => setEmail(e.target.value)} />
          <Erro>{erros.email}</Erro>
        </div>

        {/* ---- nascimento ----
             `type="date"` e não três caixas: o seletor nativo já sabe quantos
             dias tem cada mês, já fala o idioma do aparelho e já entrega
             'AAAA-MM-DD' — o mesmo formato que vai guardado. */}
        <div className="flex flex-col gap-1">
          <label className={rot} htmlFor="cad-nascimento">Data de nascimento</label>
          <input id="cad-nascimento" type="date" className="field-input"
            autoComplete="bday" max="9999-12-31" value={nascimento}
            aria-invalid={!!erros.nascimento || undefined}
            onChange={e => setNascimento(e.target.value)} />
          <p className="text-apoio text-ink-faint leading-relaxed">
            Essa informação não será compartilhada.
          </p>
          <Erro>{erros.nascimento}</Erro>
          {menor && (
            <p className="text-apoio text-ink-soft leading-relaxed rounded-medio bg-toque px-3 py-2">
              Você tem {idade} anos, então o filtro de conteúdo adulto fica ligado
              e não pode ser desligado até os {MAIORIDADE}.
            </p>
          )}
        </div>

        {/* ---- termos ----
             A caixa de aceite NÃO vem marcada. Aceite pré-marcado é aceite de
             quem não clicou, e o que está sendo aceito aqui inclui a
             declaração de que a data de nascimento é verdadeira. */}
        {/* A caixa NÃO fica dentro de um `<label>` que envolva a frase, embora
            essa seja a forma de sempre — porque a frase tem um BOTÃO dentro
            (o link dos termos). Com o label por fora, o nome acessível da
            caixa é montado a partir do texto do label e o botão aninhado vira
            um buraco: um leitor de tela anuncia "Li e aceito os , e declaro
            que a data de nascimento informada é verdadeira" — sem dizer o que
            se aceita, que é justamente a única palavra que importa ali.

            Então o nome vai explícito no `aria-label`, inteiro, e a frase ao
            lado é só o texto visível. O preço: clicar na frase não marca mais
            a caixa. Vale a troca — a frase contém um link, e um texto em que
            parte do clique abre uma janela e parte marca uma caixa é um texto
            que engana de qualquer jeito.

            A frase ao lado NÃO leva `aria-hidden`, embora repita o que o
            `aria-label` já diz: ela contém o botão dos termos, e esconder da
            árvore de acessibilidade um controle que o teclado ainda alcança
            é pior que ouvir a frase duas vezes. */}
        <div className="flex items-start gap-2.5 mt-1">
          <input id="cad-termos" type="checkbox" checked={aceitou}
            onChange={e => setAceitou(e.target.checked)}
            aria-invalid={!!erros.termos || undefined}
            aria-label="Li e aceito os termos de uso e a política de privacidade, e declaro que a data de nascimento informada é verdadeira."
            className="mt-0.5 w-4 h-4 shrink-0 accent-moss cursor-pointer" />
          <span className="text-apoio text-ink-faint leading-relaxed">
            Li e aceito os{' '}
            <button type="button" onClick={onTermos} className="text-moss underline underline-offset-2">
              termos de uso e a política de privacidade
            </button>
            , e declaro que a data de nascimento informada é verdadeira.
          </span>
        </div>
        <Erro>{erros.termos}</Erro>

        <button type="submit" className="cta cta-carimbo w-full justify-center !pl-6 mt-1" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-corpo text-ink-faint">
        Já tem conta?{' '}
        <button type="button" onClick={onVoltar} className="text-moss underline underline-offset-2 font-medium">
          Entrar
        </button>
      </p>
    </>
  )
}
