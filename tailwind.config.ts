import type { Config } from 'tailwindcss';

// Every color comes from CSS variables in app/globals.css,
// so light and dark themes share one token set.
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--ground)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--border)',
        ink: 'var(--text)',
      muted: 'var(--text-2)',
        accent: 'var(--accent)',
        'accent-tx': 'var(--accent-tx)',
        'accent-bg': 'var(--accent-bg)',
        'on-accent': 'var(--on-accent)',
        ok: 'var(--ok)',
        'ok-bg': 'var(--ok-bg)',
        warn: 'var(--warn)',
        'warn-bg': 'var(--warn-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        chip: 'var(--chip)',
        filament: '#00E5FF',
      },
      borderColor: { DEFAULT: 'var(--border)' },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: { pop: 'var(--shadow)' },
      keyframes: { cfpulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } } },
      animation: { cfpulse: 'cfpulse 1.4s infinite' },
    },
  },
  plugins: [],
} satisfies Config;
