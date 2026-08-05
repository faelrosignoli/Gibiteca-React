/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:   { DEFAULT: '#F4F0E6', 2: '#EBE5D4', 3: '#E1DAC4' },
        // ink alinhado à última versão do index.html (#23271C)
        ink:     { DEFAULT: '#23271C', soft: '#565b48', faint: '#8a8d78' },
        moss:    { DEFAULT: '#4B5D3A', 2: '#5E7146', 3: '#879266', line: '#c4cbaf' },
        gold:    '#B0862B',
        rust:    '#9C4A2E',
        blue:    '#2f5aa8',   // selo "Importado"
        box:     '#8a6a45',   // selo "Box"
        surface: { DEFAULT: '#ffffff', 2: '#fbfcf7' },
      },
      fontFamily: {
        serif: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neo:    '3px 3px 0 var(--ink)',
        'neo-sm': '2px 2px 0 var(--ink)',
        'neo-lg': '4px 4px 0 var(--ink)',
        'neo-xl': '5px 5px 0 var(--ink)',
        'neo-rust': '3px 3px 0 var(--rust)',
      },
      borderRadius: { xl2: '14px' },
      keyframes: {
        modalIn: { '0%': { opacity: 0, transform: 'translateY(-10px) scale(.98)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { modalIn: 'modalIn .22s ease both' },
    },
  },
  plugins: [],
}
