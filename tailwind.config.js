/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './frontend/**/*.html',
    './frontend/js/**/*.js'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d1117',
          secondary: '#161b22',
          tertiary: '#21262d',
          border: '#30363d'
        },
        gain: '#3fb950',
        loss: '#f85149',
        caution: '#d29922',
        accent: '#58a6ff',
        muted: '#9da5ae'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif']
      }
    }
  },
  // Safelist color classes that are assembled at runtime in currency.js and
  // the table renderers. Tailwind's content scanner sees them as literal
  // strings in the JS source, but we list them here as belt-and-suspenders.
  safelist: [
    'text-gain', 'text-loss', 'text-white', 'text-muted', 'text-caution', 'text-accent'
  ]
};
