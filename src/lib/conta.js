/* A CONTA — e o servidor que ainda não existe.
 *
 * ETAPA 0: não há servidor. Tudo aqui roda no navegador, e o código de
 * confirmação aparece NA TELA em vez de chegar por e-mail.
 *
 * Isso não é um atalho preguiçoso, é a ordem certa de construir: as telas de
 * entrar / confirmar / cadastrar têm estados que ninguém acerta de primeira —
 * código errado, código vencido, reenvio cedo demais, e-mail malformado,
 * menor de idade. Cada um é um texto, um foco de teclado e um botão
 * desabilitado. Acertar isso contra um servidor de mentira custa segundos por
 * tentativa; contra um servidor de verdade custa um e-mail por tentativa e a
 * paciência de esperar a caixa de entrada.
 *
 * O QUE A ETAPA 1 TROCA: só o corpo de `pedirCodigo` e `conferirCodigo` —
 * viram duas chamadas de rede. Por isso as duas já são `async` apesar de não
 * esperarem por nada: quem chama já trata promessa, já mostra "enviando…", já
 * cuida de falha. Trocar o dentro não mexe em nenhuma tela.
 *
 * O QUE A ETAPA 0 NÃO É: segurança. Enquanto o código nasce e morre no mesmo
 * navegador, qualquer pessoa entra com qualquer e-mail — o código está ali na
 * tela. E está tudo bem, porque não há nada a proteger: os dados também são
 * deste navegador. Quem guarda segredo é o servidor, na etapa seguinte, e é
 * lá que o código vira hash, que a tentativa é contada do lado de fora e que
 * o limite de envio não depende da honestidade do cliente.
 *
 * Por isso o código fica guardado em texto puro logo abaixo, sem hash: um
 * hash aqui seria cerimônia. O atacante e o usuário são o mesmo navegador, e
 * fingir o contrário esconderia justamente o trabalho que a Etapa 1 tem de
 * fazer.
 */

/* ---------------------------------------------------------------
   A FORMA DA CONTA

   Separada do `perfil` (foto, nome, sobrenome) de propósito. Perfil é o que
   se mostra e se troca à vontade; conta é o que identifica — e-mail,
   nascimento, o aceite dos termos. São dois ciclos de vida: trocar a foto é
   rotina, trocar o e-mail da conta é mudar de identidade.

   O que NÃO está aqui: a sessão. Estar logado agora é fato deste aparelho, e
   vive numa chave própria (ver `sessao.js` dentro do store). Se a sessão
   morasse na conta, ela iria no backup — e restaurar um backup noutro
   computador deixaria a pessoa logada lá sem nunca ter digitado nada.
   --------------------------------------------------------------- */
export const CONTA_VAZIA = () => ({
  email: '',
  nascimento: '',   // 'AAAA-MM-DD', do jeito que o <input type="date"> entrega
  termos: null,     // { aceito: true, versao, em } — ver TERMOS_VERSAO
})

/* A versão do que a pessoa aceitou, não a data em que aceitou.
 *
 * As duas coisas ficam guardadas, e são diferentes: `em` é quando ela clicou,
 * `versao` é QUAL texto estava na tela naquele clique. Mudando os termos, esta
 * constante muda — e aí dá para saber quem aceitou a versão velha e precisa
 * ver a nova. Sem isso, um texto reescrito transforma todos os aceites
 * antigos em aceites de algo que ninguém leu.
 *
 * O NÚMERO mora junto do texto, em `lib/termos.js`, e é só reexportado aqui.
 * Texto e versão que vivem em arquivos diferentes mudam em commits diferentes
 * mais cedo ou mais tarde — e aí o aceite aponta para uma versão que ninguém
 * escreveu. Este `export` existe para quem já importava daqui. */
export { DOC_VERSAO as TERMOS_VERSAO } from './termos.js'

/* ---------------------------------------------------------------
   IDADE

   `new Date('2000-05-10')` é a armadilha: a string com guiões é lida como
   MEIA-NOITE EM UTC, e no Brasil (UTC-3) isso cai no dia 9. Quem nasceu dia
   1º perde um dia, e em 31/12 perde o ano inteiro. Por isso os pedaços são
   lidos à mão e montados em data LOCAL.

   A regex casa com 2000-02-31, que não existe — então a data montada é
   conferida contra os números que entraram: o Date aceita o 31 de fevereiro e
   devolve 2 ou 3 de março, e os campos não batem mais.
   --------------------------------------------------------------- */
export function idadeEm(nascimento, hoje = new Date()) {
  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento || '')
  if (!p) return null
  const ano = +p[1], mes = +p[2], dia = +p[3]

  const d = new Date(ano, mes - 1, dia)
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null

  let idade = hoje.getFullYear() - ano
  /* Fez aniversário este ano? `getMonth()` conta de 0, o mês digitado conta de
     1 — daí o +1. No próprio dia do aniversário já conta (>=). */
  const fez = (hoje.getMonth() + 1) > mes || ((hoje.getMonth() + 1) === mes && hoje.getDate() >= dia)
  if (!fez) idade--
  return idade
}

export const MAIORIDADE = 18

/* Devolve um CÓDIGO de problema, não um texto: a tela escolhe as palavras.
   `null` = serve. */
export function erroNascimento(nascimento) {
  if (!nascimento) return 'vazio'
  const idade = idadeEm(nascimento)
  if (idade == null) return 'invalido'
  if (idade < 0) return 'futuro'
  if (idade > 120) return 'antigo'
  return null
}

/* Maior de idade é PERGUNTA, não campo guardado.
 *
 * Guardar `maiorDeIdade: true` seria guardar uma verdade com prazo: quem se
 * cadastra aos 17 faz 18 em algum momento, e o campo continuaria mentindo até
 * alguém reparar. A data de nascimento não vence; a idade se calcula. */
export function maiorDeIdade(nascimento) {
  const idade = idadeEm(nascimento)
  return idade != null && idade >= MAIORIDADE
}

/* ---------------------------------------------------------------
   E-MAIL

   Uma regex curta de propósito. A regex "completa" do RFC 5322 tem centenas
   de caracteres, e ainda assim não diz se a caixa existe — só o envio diz.
   Esta pega o que dá para pegar sem servidor: tem arroba, tem algo dos dois
   lados, tem ponto no domínio, não tem espaço. O resto é trabalho do e-mail
   que não chega.
   --------------------------------------------------------------- */
export function emailValido(email) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test((email || '').trim())
}

/* O e-mail guardado é sempre minúsculo e sem espaço nas pontas.
   Quem digita "Rafael@Gmail.com " e depois "rafael@gmail.com" espera entrar na
   mesma conta — e o domínio é insensível a caixa por norma. */
export const normalizarEmail = (email) => (email || '').trim().toLowerCase()

/* ---------------------------------------------------------------
   O CÓDIGO DE 6 DÍGITOS

   Os números abaixo são as regras do produto, e vão subir para o servidor
   exatamente assim na Etapa 1. Ficam aqui, juntos e com nome, porque cada um
   é uma decisão e não um detalhe:

   6 DÍGITOS = 1 milhão de combinações. Com 5 tentativas por código, a chance
   de acertar chutando é 5 em 1 milhão. Quatro dígitos dariam 5 em 10 mil, que
   para uma caixa de entrada é pouco demais.

   10 MINUTOS: tempo de trocar de aplicativo, achar o e-mail e voltar, com
   folga para a fila do provedor. Mais que isso deixa um código vivo largado
   numa caixa de entrada que pode não ser mais a mesma pessoa.

   5 TENTATIVAS e o código morre. Sem isso, 1 milhão de combinações é só uma
   questão de paciência.

   60 SEGUNDOS entre envios, 5 envios por hora. O primeiro protege o usuário
   de si mesmo (clicar duas vezes manda dois códigos, e o primeiro vira
   lixo que confunde); o segundo protege o endereço de alguém transformando a
   caixa de entrada de outra pessoa num depósito de spam.
   --------------------------------------------------------------- */
export const DIGITOS = 6
export const VALIDADE_MIN = 10
export const TENTATIVAS_MAX = 5
export const ESPERA_REENVIO_S = 60
export const ENVIOS_MAX_HORA = 5

const CHAVE_CODIGO = 'gibiteca_codigo'
const UMA_HORA = 3600 * 1000

/* Toda leitura de storage passa por aqui: navegador em modo privado pode
   lançar na simples leitura, e JSON de versão anterior pode não ser objeto. */
function lerPendente() {
  try {
    const bruto = localStorage.getItem(CHAVE_CODIGO)
    const d = bruto ? JSON.parse(bruto) : null
    return d && typeof d === 'object' ? d : null
  } catch (e) { return null }
}

function gravarPendente(d) {
  try {
    if (d) localStorage.setItem(CHAVE_CODIGO, JSON.stringify(d))
    else localStorage.removeItem(CHAVE_CODIGO)
  } catch (e) { /* sem storage: o código vive só nesta aba, e já basta */ }
}

/* Sorteia os dígitos no gerador criptográfico, não no `Math.random`.
 *
 * Na Etapa 0 dá no mesmo — o código está na tela. Mas esta linha vai subir
 * para o servidor junto com as regras acima, e lá a diferença é inteira:
 * `Math.random` é previsível a partir de algumas saídas, então quem visse
 * códigos de outras contas conseguiria adivinhar o próximo.
 *
 * `% 10` sobre um byte de 0 a 255 enviesaria os dígitos 0 a 5 (256 não divide
 * por 10); descartar os bytes acima de 249 tira o viés.
 */
function sortearCodigo() {
  const digitos = []
  while (digitos.length < DIGITOS) {
    const bytes = new Uint8Array(DIGITOS * 2)
    crypto.getRandomValues(bytes)
    for (const b of bytes) {
      if (b >= 250) continue
      digitos.push(b % 10)
      if (digitos.length === DIGITOS) break
    }
  }
  return digitos.join('')
}

/* Quanto falta para poder reenviar, em segundos. 0 = já pode.
   A tela chama isto num intervalo de 1s para mostrar a contagem. */
export function esperaRestante() {
  const p = lerPendente()
  if (!p || !p.enviadoEm) return 0
  const passou = (Date.now() - p.enviadoEm) / 1000
  return Math.max(0, Math.ceil(ESPERA_REENVIO_S - passou))
}

/* O que há de pendente, para a tela se recompor depois de um recarregamento
   no meio do caminho — sem isso, F5 na tela do código voltaria para o começo
   com um código válido perdido na caixa de entrada. */
export function codigoPendente() {
  const p = lerPendente()
  /* Sem `codigo` o registro é só o histórico de envios que sobreviveu a
     `limparCodigo` — não há nada para confirmar. */
  if (!p || !p.email || !p.codigo) return null
  if (Date.now() > p.expira) return null
  return { email: p.email, expira: p.expira, restamTentativas: TENTATIVAS_MAX - (p.tentativas || 0) }
}

/* Mata o CÓDIGO e preserva o histórico de envios.
 *
 * São duas coisas no mesmo registro, e confundi-las abre um buraco: o código
 * morre de três jeitos (acertou, venceu, queimou as tentativas), e se o
 * registro inteiro fosse apagado junto, queimar cinco tentativas de propósito
 * zeraria a espera de 60s E o teto de 5 por hora. O limite de envio existe
 * justamente contra quem está disposto a insistir — não pode depender de um
 * dado que o insistente consegue apagar.
 *
 * ETAPA 1: no servidor isto são duas tabelas, e a de limites é por ENDEREÇO,
 * não por código em andamento. Aqui cabe um registro só porque há uma conta
 * por navegador; a regra, porém, já é esta.
 */
export function limparCodigo() {
  const p = lerPendente()
  if (!p) return
  gravarPendente({ email: p.email, enviadoEm: p.enviadoEm, envios: p.envios || [] })
}

/* PEDIR UM CÓDIGO.
 *
 * Devolve `{ ok: true, codigo }` — e `codigo` só existe na Etapa 0, para a
 * tela poder mostrar na cara o que o e-mail mostraria. Na Etapa 1 o servidor
 * devolve `{ ok: true }` e mais nada: o código vai pelo e-mail, e quem o
 * devolvesse na resposta estaria entregando a chave a quem pediu.
 *
 * A tela trata `codigo` como opcional justamente por isso. Quando ele sumir,
 * nada quebra — o aviso amarelo some junto.
 */
export async function pedirCodigo(email) {
  const alvo = normalizarEmail(email)
  if (!emailValido(alvo)) return { ok: false, erro: 'email' }

  const p = lerPendente()
  const mesmo = p && p.email === alvo

  /* A espera de 60s vale por ENDEREÇO. Trocar de e-mail na tela não deve
     herdar a espera do endereço anterior — é outro pedido. */
  if (mesmo) {
    const falta = esperaRestante()
    if (falta > 0) return { ok: false, erro: 'espere', segundos: falta }

    /* Envios na última hora. A janela é deslizante: guarda os horários e
       descarta os velhos, em vez de zerar um contador de hora em hora — com
       contador fixo, 5 envios às 10h59 e 5 às 11h01 passariam. */
    const recentes = (p.envios || []).filter(t => Date.now() - t < UMA_HORA)
    if (recentes.length >= ENVIOS_MAX_HORA) return { ok: false, erro: 'demais' }
  }

  const codigo = sortearCodigo()
  const agora = Date.now()
  gravarPendente({
    email: alvo,
    codigo,                                   // texto puro: ver o comentário do topo
    expira: agora + VALIDADE_MIN * 60 * 1000,
    tentativas: 0,
    enviadoEm: agora,
    envios: [...(mesmo ? (p.envios || []).filter(t => agora - t < UMA_HORA) : []), agora],
  })
  return { ok: true, codigo }
}

/* CONFERIR.
 *
 * Erros por código e não por texto, pelo mesmo motivo de `erroNascimento`: a
 * tela decide as palavras, e aqui só se sabe o que aconteceu.
 *
 * 'curto'     — ainda não são 6 dígitos (nem conta como tentativa)
 * 'nenhum'    — não há código pendente para este e-mail
 * 'expirado'  — passou dos 10 minutos
 * 'queimado'  — acabaram as tentativas
 * 'errado'    — não é este; vem com quantas restam
 */
export async function conferirCodigo(email, digitado) {
  const limpo = (digitado || '').replace(/\D/g, '')
  if (limpo.length !== DIGITOS) return { ok: false, erro: 'curto' }

  const p = lerPendente()
  /* `!p.codigo`: o registro pode existir só como histórico de envios, depois
     de `limparCodigo`. Sem esta guarda, o palpite seria comparado com
     `undefined`, daria 'errado' e ainda gastaria uma tentativa de um código
     que não existe mais. */
  if (!p || !p.codigo || p.email !== normalizarEmail(email)) return { ok: false, erro: 'nenhum' }

  /* Vencido primeiro, antes de gastar tentativa: um código que já morreu não
     é um palpite errado, e queimar a tentativa de quem só demorou seria punir
     a demora duas vezes. */
  if (Date.now() > p.expira) { limparCodigo(); return { ok: false, erro: 'expirado' } }
  if ((p.tentativas || 0) >= TENTATIVAS_MAX) { limparCodigo(); return { ok: false, erro: 'queimado' } }

  if (limpo !== p.codigo) {
    const tentativas = (p.tentativas || 0) + 1
    if (tentativas >= TENTATIVAS_MAX) { limparCodigo(); return { ok: false, erro: 'queimado' } }
    gravarPendente({ ...p, tentativas })
    return { ok: false, erro: 'errado', restam: TENTATIVAS_MAX - tentativas }
  }

  /* Acertou: o código morre aqui. Um código de uso único que sobrevive ao uso
     é um código de uso múltiplo. */
  limparCodigo()
  return { ok: true, email: p.email }
}
