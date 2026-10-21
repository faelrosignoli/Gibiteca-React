import { CONTATO, IDADE_ADULTA, PRAZO_RESPOSTA } from './termos.js'

/* O FAQ.
 *
 * Em dados, e não em JSX, pelo mesmo motivo dos termos: a mesma pergunta pode
 * precisar aparecer na ajuda, num aviso e numa página pública, e prosa marcada
 * à mão em três lugares vira três redações diferentes da mesma resposta.
 *
 * `g` é o grupo. Serve para separar visualmente sem obrigar ninguém a rolar um
 * paredão de doze perguntas seguidas procurando a sua.
 *
 * AS RESPOSTAS DIZEM O ESTADO DE HOJE, inclusive quando ele é desconfortável —
 * "não existe servidor", "limpar o navegador apaga". Um FAQ que descreve o
 * app que se quer ter, e não o que está no ar, não é ajuda: é propaganda que
 * deixa a pessoa perder a coleção.
 *
 * QUANDO O SERVIDOR CHEGAR, as perguntas 3, 4, 5 e 6 mudam ou saem. Estão
 * marcadas com `temporaria: true` para ninguém precisar reler as doze.
 */
export const FAQ = [
  {
    g: 'Entrar e sair',
    q: 'Por que não tem senha?',
    a: [
      'Porque o que prova que o e-mail é seu é o código que chega nele. Sem senha não há o que esquecer, o que vazar, nem o que repetir de outro site.',
      'A cada entrada chega um código de seis dígitos. Ele vale dez minutos, aceita cinco tentativas e só serve uma vez.',
    ],
  },
  {
    g: 'Entrar e sair',
    q: 'O código não chegou. E agora?',
    a: [
      'Hoje ele não chega mesmo: o servidor de e-mail ainda não está no ar, e por isso o código aparece na própria tela, dentro de um aviso amarelo.',
      'Quando o envio começar a funcionar, confira a caixa de spam e espere um minuto antes de pedir outro — pedir dois seguidos faz o primeiro parar de valer.',
    ],
    temporaria: true,
  },
  {
    g: 'Entrar e sair',
    q: 'Saí da conta. Perdi a coleção?',
    a: [
      'Não. Sair apaga só a sessão deste aparelho; a coleção continua onde estava e volta quando você entrar de novo.',
      'Quem apaga de verdade é o botão "Apagar conta", no fim do perfil — e ele avisa antes.',
    ],
  },

  {
    g: 'Onde ficam os seus dados',
    q: 'Onde a minha coleção fica guardada?',
    a: [
      'No armazenamento do seu próprio navegador. Ela não passa por servidor nenhum, porque ainda não existe servidor.',
      'Isso tem um lado bom e um ruim. O bom: ninguém além de você alcança os seus dados. O ruim: limpar os dados do navegador apaga tudo, e trocar de aparelho não leva nada junto.',
    ],
    temporaria: true,
  },
  {
    g: 'Onde ficam os seus dados',
    q: 'O que é conectar ao GitHub, e por que fazer isso?',
    a: [
      'É dar à gibiteca um lugar fixo para guardar a coleção: um repositório que é seu, na sua conta do GitHub. A partir daí ela fica igual em qualquer aparelho em que você entrar, e sobrevive a limpar o navegador.',
      'O caminho é ☰ › Seus dados › Perfil, e lá dentro há um passo a passo. Você cria uma chave de acesso com permissão limitada, cola no campo e pronto — a chave fica só no seu aparelho.',
      'Enquanto não há servidor, essa é a única forma de a coleção não depender de um navegador só.',
    ],
    temporaria: true,
  },
  {
    g: 'Onde ficam os seus dados',
    q: 'Limpei o navegador e sumiu tudo. Dá para recuperar?',
    a: [
      'Se você tinha conectado ao GitHub, sim: entre de novo, conecte o mesmo repositório e puxe da nuvem.',
      'Se você tinha baixado um backup, também: use "Restaurar" dentro de Backup.',
      'Se não havia nem um nem outro, não há como recuperar. É exatamente isso que o aviso amarelo do topo tenta evitar.',
    ],
    temporaria: true,
  },
  {
    g: 'Onde ficam os seus dados',
    q: 'Como levo a coleção para outro aparelho?',
    a: [
      'Conectando os dois ao mesmo repositório do GitHub, ou baixando um backup num e restaurando no outro.',
      'O backup é um arquivo só, com obras, listas, fila e perfil dentro.',
    ],
  },

  {
    g: 'Idade e conteúdo adulto',
    q: 'Como funciona o filtro de conteúdo adulto?',
    a: [
      `Parte do acervo é destinada a maiores de ${IDADE_ADULTA} anos e fica oculta por padrão.`,
      `Para vê-la é preciso ter informado a data de nascimento, ter ${IDADE_ADULTA} anos ou mais e ligar a opção. Quem tem menos não consegue ligar.`,
      'Ao aceitar os termos, você declara que a data informada é verdadeira.',
    ],
  },
  {
    g: 'Idade e conteúdo adulto',
    q: 'Posso mudar a minha data de nascimento?',
    a: [
      'Ela aparece no perfil, mas não é editável ali: mudar a idade com um clique esvaziaria o sentido do filtro.',
      `Se você digitou errado, escreva para ${CONTATO} contando o que aconteceu.`,
    ],
  },

  {
    g: 'Os dados das obras',
    q: 'Achei um erro nos dados de uma obra. Como aviso?',
    a: [
      'Pela contestação, aqui mesmo na ajuda. Você diz qual obra, qual campo está errado, o que está lá hoje e o que deveria estar.',
      `Cada contestação é analisada antes de qualquer mudança, e a resposta vem em até ${PRAZO_RESPOSTA}.`,
    ],
  },
  {
    g: 'Os dados das obras',
    q: 'As capas são de vocês?',
    a: [
      'Não. Capas, títulos e obras pertencem a quem tem direito sobre eles — autoras, autores, editoras e licenciantes. Aqui elas servem só para identificar a edição.',
      `Quem tem direito sobre uma imagem pode pedir a remoção dela por ${CONTATO}.`,
    ],
  },

  {
    g: 'Privacidade',
    q: 'Vocês vendem os meus dados?',
    a: [
      'Não. Não há venda, aluguel ou cessão de dados a parceiros, anunciantes ou terceiros, e não há publicidade dentro do aplicativo.',
      'Hoje a questão nem chega a se colocar: os seus dados não saem do seu navegador e do repositório que é seu.',
    ],
  },
  {
    g: 'Privacidade',
    q: 'Como apago a minha conta?',
    a: [
      'Em ☰ › Seus dados › Perfil, no último botão da tela: "Apagar conta". Ele pede confirmação.',
      'Apagar remove o perfil, a conta, as obras, as listas e a fila deste navegador, e não tem desfazer. O que estiver num repositório seu do GitHub continua lá, sob o seu controle.',
    ],
  },
]

/* Os campos que uma contestação pode apontar.
 *
 * Lista fechada, e não um campo de texto livre para dizer "o que está errado":
 * texto livre chega como "o autor" numa contestação e "autoria" noutra, e
 * quem for analisar passa a adivinhar. Fechado, dá para agrupar, contar e um
 * dia automatizar — e "outro" existe justamente para o que não couber.
 */
export const CAMPOS_CONTESTAVEIS = [
  { v: 'titulo', rotulo: 'Título' },
  { v: 'autoria', rotulo: 'Autoria (roteiro, desenho, arte)' },
  { v: 'editora', rotulo: 'Editora' },
  { v: 'ano', rotulo: 'Ano ou data de publicação' },
  { v: 'edicao', rotulo: 'Tipo de edição, formato ou número de volumes' },
  { v: 'capa', rotulo: 'Capa (imagem errada ou de outra edição)' },
  { v: 'outro', rotulo: 'Outro' },
]

/* Monta o texto da contestação.
 *
 * Fica em função, fora do componente, porque o MESMO texto vai para dois
 * lugares: o corpo do e-mail e a área de transferência. Montado duas vezes,
 * um dos dois ficaria sem um campo na primeira vez que a lista mudasse.
 *
 * Formato de rótulo e valor, uma linha cada: é o que sobrevive a cliente de
 * e-mail que come formatação, e é o que um dia um servidor lê sem ambiguidade.
 */
export function textoDaContestacao({ obra, campo, atual, correto, fonte }) {
  const rotulo = (CAMPOS_CONTESTAVEIS.find(c => c.v === campo) || {}).rotulo || campo
  return [
    'CONTESTAÇÃO DE DADOS DE OBRA',
    '',
    'Obra: ' + (obra || '—'),
    'Campo: ' + rotulo,
    'Está registrado como: ' + (atual || '—'),
    'O correto seria: ' + (correto || '—'),
    'Fonte: ' + (fonte || '—'),
    '',
    'Enviado pela Minha Gibiteca em ' + new Date().toLocaleString('pt-BR'),
  ].join('\n')
}

/* O `mailto:` pronto.
 *
 * `encodeURIComponent` no assunto E no corpo: sem isso, a primeira quebra de
 * linha ou acento encerra o parâmetro e o e-mail abre pela metade.
 */
export function mailtoDaContestacao(dados) {
  const assunto = 'Contestação de dados — ' + (dados.obra || 'obra sem título')
  return 'mailto:' + CONTATO
    + '?subject=' + encodeURIComponent(assunto)
    + '&body=' + encodeURIComponent(textoDaContestacao(dados))
}
