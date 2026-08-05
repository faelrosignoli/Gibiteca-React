/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:   { DEFAULT: '#F4F0E6', 2: '#EBE5D4', 3: '#E1DAC4' },
        ink:     { DEFAULT: '#20241A', soft: '#565b48', faint: '#8a8d78' },
        moss:    { DEFAULT: '#4B5D3A', 2: '#5E7146', 3: '#879266', line: '#c4cbaf' },
        gold:    '#B0862B',
        rust:    '#9C4A2E',
        surface: '#ffffff',
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
        'neo-rust': '3px 3px 0 var(--rust)',
      },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
}
