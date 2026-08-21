/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:   { DEFAULT: '#F4F0E6', 2: '#EBE5D4', 3: '#E1DAC4' },
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
        moss:    { DEFAULT: '#4B5D3A', 2: '#5E7146', 3: '#879266', line: '#c4cbaf' },
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
        toque:     'rgba(35,39,28,.055)',   // fundo de hover
        veu:       'rgba(35,39,28,.5)',     // backdrop de modal

        // ---- tintas pálidas de estado ----
        'tinta-moss': '#f2f5ea',
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
