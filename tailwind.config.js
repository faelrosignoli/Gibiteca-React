/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* O PAPEL é temável junto com o acento: o Moss usa o creme de sempre,
           o Nockout um prateado. Canais separados por espaço pelo mesmo motivo
           do acento — manter `bg-paper/60` funcionando. */
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          2:       'rgb(var(--paper-2) / <alpha-value>)',
          3:       'rgb(var(--paper-3) / <alpha-value>)',
        },
        // Uma tinta só, quatro papéis, tudo por opacidade — como o United
        // Carriers faz. Vantagem sobre cores sólidas: o texto continua legível
        // sobre qualquer superfície, inclusive sobre uma capa colorida.
        ink: {
          DEFAULT: 'rgba(35,39,28,1)',      // texto forte
          soft:    'rgba(35,39,28,.78)',    // subtítulo
          faint:   'rgba(35,39,28,.56)',    // apoio
          mute:    'rgba(35,39,28,.38)',    // desabilitado
          2:       '#2c3124',               // hover de superfície escura
        },
        /* O ACENTO é temável: os valores moram em variáveis no index.css, e
           trocar o tema repinta os ~100 usos de uma vez. Canais separados por
           espaço, não hex, para o Tailwind ainda conseguir aplicar opacidade
           (`bg-moss/40`) por cima. */
        moss: {
          DEFAULT: 'rgb(var(--moss) / <alpha-value>)',
          2:       'rgb(var(--moss-2) / <alpha-value>)',
          3:       'rgb(var(--moss-3) / <alpha-value>)',
          line:    'rgb(var(--moss-line) / <alpha-value>)',
        },
        /* O acento como TEXTO é um tom à parte. No Moss dá na mesma; no
           Nockout não: #FF5000 sobre creme fica em 2,8:1, ilegível em rótulo
           de 10px. Aqui ele escurece o quanto precisa para passar. */
        'acento-texto': 'rgb(var(--acento-texto) / <alpha-value>)',
        /* A tinta que vai EM CIMA do acento. No Moss é o creme; no Nockout o
           creme cai para 3,3:1 e quem lê bem é a tinta escura. */
        'sobre-acento': 'rgb(var(--sobre-acento) / <alpha-value>)',
        gold:    '#B0862B',
        rust:    '#9C4A2E',
        blue:    '#2f5aa8',   // selo "Importado"
        box:     '#8a6a45',   // selo "Box"
        // superfície é creme, não branco puro — nenhuma das referências usa #fff
        surface: { DEFAULT: '#FFFDF8', 2: '#fbfcf7', pure: '#ffffff' },

        // ---- véus de tinta, nomeados por PAPEL ----
        // Antes eram 12 opacidades avulsas espalhadas pelos componentes.
        // O componente pede a função, não o tom.
        linha:     'rgba(35,39,28,.08)',    // fio de 1px, separação sutil
        separador: 'rgba(35,39,28,.12)',    // divisória com presença
        // Contorno de CAMPO. Separador é véu de divisória: num formulário
        // inteiro de caixas ele some, e a tela vira creme sobre creme. Aqui o
        // fio precisa dizer onde o campo começa e onde termina.
        contorno:  'rgba(35,39,28,.24)',    // borda de input, botão, seletor
        toque:     'rgba(35,39,28,.055)',   // fundo de hover
        veu:       'rgba(35,39,28,.5)',     // backdrop de modal

        // ---- tintas pálidas de estado ----
        'tinta-moss': 'rgb(var(--tinta-moss) / <alpha-value>)',
        'tinta-gold': '#f3ead4',
        'tinta-rust': '#f0e2da',
      },

      fontFamily: {
        // "serif" era mentira: Bricolage Grotesque é uma grotesca.
        // O papel é display, e o nome agora diz isso.
        display: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"Space Mono"', 'ui-monospace', 'monospace'],
      },

      // ---- escala tipográfica: 7 níveis no lugar de 25 tamanhos avulsos ----
      // Cada nível carrega tamanho + entrelinha + entreletras JUNTOS, para
      // ninguém escolher entrelinha à mão. A entrelinha cai conforme o tamanho
      // sobe; a entreletras é negativa acima de 16px e positiva só no rótulo.
      // Todos os tamanhos são multiplicados por --escala (definida em
      // index.css, padrão 1). Mudar esse número reescala a tipografia inteira
      // do app em um lugar só — é o truque do --scale-ratio do Son Daven.
      fontSize: {
        display: ['calc(40px * var(--escala))', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        titulo:  ['calc(28px * var(--escala))', { lineHeight: '0.98', letterSpacing: '-0.025em' }],
        secao:   ['calc(20px * var(--escala))', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        obra:    ['calc(16px * var(--escala))', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        corpo:   ['calc(14px * var(--escala))', { lineHeight: '1.55', letterSpacing: '0' }],
        apoio:   ['calc(12px * var(--escala))', { lineHeight: '1.45', letterSpacing: '0' }],
        rotulo:  ['calc(10px * var(--escala))', { lineHeight: '1',    letterSpacing: '0.16em' }],
      },

      boxShadow: {
        amb:      '0 16px 34px -22px rgba(35,39,28,.45)',
        'amb-lg': '0 26px 46px -24px rgba(35,39,28,.5)',
        island:   'inset 0 1px 0 rgba(255,255,255,.85), 0 18px 44px -22px rgba(35,39,28,.42)',
      },

      // ---- raios: três nomeados. `core` é derivado, não arbitrário: é
      //      `grande` menos o padding da casca, para a curva ficar concêntrica.
      borderRadius: {
        pequeno: '8px',
        medio:   '16px',
        grande:  '28px',
        // núcleos derivados: casca menos o padding dela, para a curva ficar
        // concêntrica. Um por tamanho de casca.
        core:         '22px',  // grande (28) − 6px de padding, no desktop
        'core-medio': '12px',  // medio  (16) − 4px de padding, no celular
      },

      keyframes: {
        modalIn: { '0%': { opacity: 0, transform: 'translateY(-10px) scale(.98)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { modalIn: 'modalIn .22s ease both' },
    },
  },
  plugins: [],
}
