/* TERMOS DE USO E POLÍTICA DE PRIVACIDADE
 *
 * Dois documentos, um arquivo. Eles mudam juntos, são aceitos no mesmo clique
 * e carregam a MESMA versão — separá-los em dois arquivos abriria a porta
 * para um ser atualizado sem o outro, e para um aceite que cobre metade do
 * que a pessoa concordou.
 *
 * POR QUE NO CÓDIGO, e não num arquivo de texto editável solto: o aceite
 * guardado aponta para `DOC_VERSAO`. Texto e versão têm de mudar no mesmo
 * commit, ou o aceite de alguém passa a apontar para um texto que já não
 * existe. Juntos no mesmo arquivo, esquecer um dos dois é difícil.
 *
 * ESTRUTURA EM DADOS, não em HTML pronto: a mesma seção precisa aparecer no
 * pop-up do cadastro, na central de ajuda e, um dia, numa página pública.
 * Prosa marcada à mão em três lugares vira três versões diferentes.
 *
 * NÃO É PARECER JURÍDICO. É um texto de produto, escrito para ser lido por
 * quem usa o app, apoiado na LGPD (Lei 13.709/2018), no Marco Civil (Lei
 * 12.965/2014), no ECA Digital (Lei 15.211/2025) e no CDC. Antes de valer
 * para valer, pede leitura de advogado — em especial os pontos de idade,
 * direito de imagem das capas e responsabilidade sobre dados de catálogo.
 */

/* A versão vale para os DOIS documentos. Mudou qualquer um dos textos, muda
   aqui — é isso que permite saber, depois, quem aceitou o quê. */
export const DOC_VERSAO = '1.0'
export const DOC_DESDE = '20 de outubro de 2026'

export const CONTATO = 'contato@gibiteca.com.br'
export const PRAZO_RESPOSTA = '15 dias corridos'

export const IDADE_MINIMA = 13
export const IDADE_ADULTA = 18

/* ==================================================================
   TERMOS DE USO
   ================================================================== */
export const TERMOS = {
  id: 'termos',
  titulo: 'Termos de uso',
  versao: DOC_VERSAO,
  desde: DOC_DESDE,
  secoes: [
    {
      n: '1',
      t: 'Aceitação',
      p: [
        'Usar a Minha Gibiteca significa concordar com estes Termos e com a Política de Privacidade.',
        'Ao criar a conta, o aceite fica registrado com a versão do texto e a data em que foi dado. Os dois ficam visíveis no seu perfil, e mudando o texto você é avisado antes de a nova versão valer.',
      ],
    },
    {
      n: '2',
      t: 'O que é a Minha Gibiteca',
      p: [
        'É um aplicativo para organizar coleção de quadrinhos: registrar o que você tem, o que quer, o que já leu, montar listas e uma fila de leitura.',
        'Não há notificações, feed por algoritmo, contagem de seguidores nem nota pública. A coleção é sua e é privada por padrão.',
      ],
    },
    {
      n: '3',
      t: 'Conta e acesso',
      p: [
        'O acesso é por e-mail, com um código de seis dígitos enviado a cada entrada. Não há senha para esquecer, vazar ou repetir de outro site.',
        `Ao se cadastrar você declara ter pelo menos ${IDADE_MINIMA} anos — ou autorização de quem é responsável por você —, informar dados verdadeiros e ser a única pessoa titular da conta. A conta não se transfere.`,
        'Guardar o acesso à sua caixa de e-mail é o que guarda a sua conta. Suspeitando de acesso indevido, escreva para o contato no fim deste texto.',
      ],
    },
    {
      n: '4',
      t: 'Idade e conteúdo adulto',
      p: [
        `Parte do acervo é destinada a maiores de ${IDADE_ADULTA} anos e fica oculta por padrão.`,
        `Para ver esse conteúdo é preciso ter conta, ter informado a data de nascimento, ter ${IDADE_ADULTA} anos ou mais e ligar a opção expressamente. Quem tem menos não consegue ligar.`,
        'Ao aceitar estes Termos, você declara que a data de nascimento informada é verdadeira. Informar data falsa para alcançar conteúdo adulto é responsabilidade de quem informa.',
        'A data de nascimento é coletada apenas para essa verificação, com base no art. 24 da Lei 15.211/2025. Ela pode ser apagada a qualquer momento, e apagá-la desliga o acesso ao conteúdo adulto.',
      ],
    },
    {
      n: '5',
      t: 'Menores de idade',
      p: [
        `Quem tem entre ${IDADE_MINIMA} e ${IDADE_ADULTA} anos pode usar o aplicativo e organizar a própria coleção; o conteúdo adulto permanece bloqueado.`,
        'Pais e responsáveis acompanham o uso por crianças e adolescentes sob sua guarda. Dúvidas sobre isso podem ser enviadas ao contato no fim deste texto.',
      ],
    },
    {
      n: '6',
      t: 'Os dados das obras',
      p: [
        'As informações bibliográficas das obras — título, autoria, editora, data, características — formam um catálogo de consulta. Elas são reunidas com cuidado, e ainda assim podem conter erro.',
        'Encontrando um dado errado, você pode contestá-lo pelo próprio aplicativo, indicando o que está incorreto e qual seria a informação certa. Cada contestação é analisada antes de qualquer mudança, e o prazo de resposta é de ' + PRAZO_RESPOSTA + '.',
        'Imprecisão no catálogo não gera responsabilidade da Minha Gibiteca. Corrigir é um compromisso de manutenção, não uma garantia de exatidão.',
      ],
    },
    {
      n: '7',
      t: 'Capas e direitos das obras',
      p: [
        'As obras, os títulos e as capas pertencem a quem tem direito sobre eles: autoras, autores, editoras e licenciantes. As imagens aparecem aqui para identificar edições, e nada mais.',
        'Registrar uma obra na sua coleção não dá a você nem à Minha Gibiteca qualquer direito sobre ela.',
        'Quem tem direito sobre uma imagem pode pedir a remoção dela pelo contato no fim deste texto. O pedido é analisado em até ' + PRAZO_RESPOSTA + '.',
      ],
    },
    {
      n: '8',
      t: 'O que é seu',
      p: [
        'São seus os dados que você cria: quais obras tem, quais quer, o que já leu, suas notas, suas listas e a ordem da sua fila.',
        'Esses dados são usados para fazer o aplicativo funcionar e nada além disso. Não são vendidos, alugados nem cedidos a terceiros, e não alimentam publicidade.',
        'Você pode baixar tudo em um arquivo, a qualquer momento, pelo próprio aplicativo.',
      ],
    },
    {
      n: '9',
      t: 'Onde a sua coleção fica guardada',
      p: [
        'Hoje a coleção fica no seu próprio navegador e, se você quiser, num repositório do GitHub que é seu — você conecta, você controla, e a chave de acesso não sai do seu aparelho.',
        'Limpar os dados do navegador apaga a coleção que não estiver conectada a um repositório. Essa é a razão do aviso que aparece no topo do aplicativo.',
        'Quando houver servidor próprio, você será avisado antes da mudança e nada será movido sem o seu aceite.',
      ],
    },
    {
      n: '10',
      t: 'Conduta',
      p: [
        'Não é permitido usar o aplicativo para publicar conteúdo ofensivo, discriminatório ou ilegal; enviar contestações falsas ou em massa; tentar acessar dados de outras pessoas ou atacar o sistema; informar dados falsos no cadastro, em especial a data de nascimento; ou raspar o catálogo de forma automatizada sem autorização.',
        'Conteúdo irregular pode ser removido, e casos graves podem levar à suspensão ou ao encerramento da conta.',
      ],
    },
    {
      n: '11',
      t: 'Encerrar a conta',
      p: [
        'Você pode apagar a conta a qualquer momento, pelo perfil, sem precisar justificar.',
        'Apagar remove os seus dados pessoais e os da sua coleção, e não tem desfazer. O que você já tiver enviado a um repositório do GitHub seu continua lá, sob o seu controle — apague por lá se quiser.',
      ],
    },
    {
      n: '12',
      t: 'Propriedade do aplicativo',
      p: [
        'Nome, logotipo, código, desenho e textos da Minha Gibiteca pertencem a quem a mantém. Reproduzir ou distribuir sem autorização não é permitido.',
      ],
    },
    {
      n: '13',
      t: 'Limites de responsabilidade',
      p: [
        'A Minha Gibiteca não responde por imprecisões de catálogo, por indisponibilidades temporárias, por conteúdo de sites externos nem por perdas decorrentes de dados guardados apenas no navegador de quem usa.',
        'Não há garantia de funcionamento ininterrupto. Havendo incidente com dados pessoais, você será avisado, conforme a LGPD e as orientações da ANPD.',
      ],
    },
    {
      n: '14',
      t: 'Mudanças neste texto',
      p: [
        'Mudanças são avisadas dentro do aplicativo antes de passarem a valer, e a versão fica registrada no seu aceite.',
        'Continuar usando depois do aviso significa aceitar a nova versão.',
      ],
    },
    {
      n: '15',
      t: 'Lei e foro',
      p: [
        'Vale a legislação brasileira — LGPD, Marco Civil da Internet, Lei 15.211/2025 e Código de Defesa do Consumidor.',
        'Fica eleito o foro do domicílio de quem usa o aplicativo.',
      ],
    },
    {
      n: '16',
      t: 'Contato',
      p: [
        `Dúvidas, pedidos e reclamações: ${CONTATO}. A resposta vem em até ${PRAZO_RESPOSTA}.`,
      ],
    },
  ],
}

/* ==================================================================
   POLÍTICA DE PRIVACIDADE
   ================================================================== */
export const PRIVACIDADE = {
  id: 'privacidade',
  titulo: 'Política de privacidade',
  versao: DOC_VERSAO,
  desde: DOC_DESDE,
  secoes: [
    {
      n: '1',
      t: 'Quais dados são coletados',
      p: [
        'O que você informa: e-mail, data de nascimento, primeiro nome, sobrenome e, se quiser, uma foto de perfil. Sobrenome e foto são opcionais.',
        'O que você cria: a sua coleção, suas listas, sua fila de leitura, notas e status de leitura.',
        'O que NÃO é coletado: senha (não existe), telefone, endereço, CPF ou qualquer documento, localização, contatos do aparelho, e nada destinado a publicidade ou perfilamento.',
      ],
    },
    {
      n: '2',
      t: 'Para que cada dado serve',
      p: [
        'E-mail: identificar a conta e enviar o código de acesso. É a base de execução do contrato (LGPD, art. 7º, V).',
        `Data de nascimento: verificar idade para o filtro de conteúdo adulto, e só isso. É cumprimento de obrigação legal (LGPD, art. 7º, II, com a Lei 15.211/2025).`,
        'Nome, sobrenome e foto: identificar você dentro do próprio aplicativo. É consentimento, e podem ser apagados a qualquer momento.',
        'Dados da coleção: fazer o aplicativo funcionar.',
        'Não há decisão automatizada com efeito comercial, nem traçado de perfil.',
      ],
    },
    {
      n: '3',
      t: 'Onde os dados ficam',
      p: [
        'Hoje, no seu próprio navegador — e, se você conectar, num repositório do GitHub que é seu, com a chave de acesso guardada apenas no seu aparelho.',
        'Isso significa que, hoje, quem mantém a Minha Gibiteca não tem acesso à sua coleção nem ao seu perfil: eles nunca saem do seu controle.',
        'Quando houver servidor próprio, esta seção será reescrita e você será avisado antes.',
      ],
    },
    {
      n: '4',
      t: 'Compartilhamento',
      p: [
        'Não há venda, aluguel ou cessão de dados pessoais a parceiros, anunciantes ou terceiros.',
        'Conectando a nuvem, os seus dados passam a transitar e ficar guardados no GitHub, por sua escolha e sob a conta e os termos do GitHub.',
        'Dados podem ser entregues a autoridades quando a lei exigir, e você será avisado quando for permitido avisar.',
      ],
    },
    {
      n: '5',
      t: 'Cookies e rastreamento',
      p: [
        'Não são usados cookies de rastreamento, pixels de publicidade nem ferramentas de medição de terceiros.',
        'O aplicativo guarda informações no armazenamento local do seu navegador para funcionar — a sua coleção, o tema escolhido, o estado da sessão. Isso fica no seu aparelho e não é enviado a lugar nenhum sem a sua ação.',
      ],
    },
    {
      n: '6',
      t: 'Proteção de crianças e adolescentes',
      p: [
        `Conteúdo adulto fica oculto por padrão e depende de data de nascimento informada e de ativação expressa por quem tem ${IDADE_ADULTA} anos ou mais.`,
        `Dados de crianças com menos de ${IDADE_MINIMA} anos coletados sem autorização de responsável são apagados assim que identificados.`,
      ],
    },
    {
      n: '7',
      t: 'Segurança',
      p: [
        'O acesso é sem senha: um código de seis dígitos, de uso único, que vence em dez minutos e aceita cinco tentativas.',
        'A comunicação com o GitHub é por HTTPS, com uma chave de acesso de permissão limitada, criada e revogável por você.',
        'Nenhum sistema é inviolável. Havendo incidente com risco aos seus dados, você será avisado.',
      ],
    },
    {
      n: '8',
      t: 'Por quanto tempo os dados ficam',
      p: [
        'Enquanto a conta existir. Apagando a conta, os dados guardados neste navegador são removidos na hora.',
        'O que estiver num repositório do GitHub seu permanece lá até você apagar, porque aquele repositório é seu.',
      ],
    },
    {
      n: '9',
      t: 'Os seus direitos (LGPD, art. 18)',
      p: [
        'Acesso e correção: pelo perfil, dentro do aplicativo.',
        'Eliminação: pelo botão de apagar conta, no fim do perfil.',
        'Portabilidade: pelo backup, que baixa tudo num arquivo.',
        `Informação sobre compartilhamentos, oposição e qualquer outro pedido: ${CONTATO}.`,
        'Você também pode reclamar à ANPD, em gov.br/anpd.',
      ],
    },
    {
      n: '10',
      t: 'Mudanças nesta política',
      p: [
        'Mudanças são avisadas dentro do aplicativo antes de passarem a valer, com a versão registrada no seu aceite.',
      ],
    },
    {
      n: '11',
      t: 'Contato',
      p: [
        `Responsável pelo tratamento dos dados: quem mantém a Minha Gibiteca, pelo e-mail ${CONTATO}, com resposta em até ${PRAZO_RESPOSTA}.`,
      ],
    },
  ],
}

export const DOCUMENTOS = [TERMOS, PRIVACIDADE]
