import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Tokens herdados do FinControl original
        bg: {
          DEFAULT: '#0b0f14',
          soft: '#0f1620',
        },
        card: {
          DEFAULT: '#131c28',
          soft: '#18222f',
        },
        border: {
          DEFAULT: '#1e2a3a',
          strong: '#2a3a4f',
        },
        content: {
          DEFAULT: '#e6edf5',
          soft: '#b8c4d4',
          muted: '#8393a7',
          faint: '#5f6f83',
        },
        accent: {
          DEFAULT: '#4ade80',
          soft: '#22d3ee',
        },
        state: {
          pos: '#4ade80',
          neg: '#f87171',
          warn: '#fbbf24',
          info: '#60a5fa',
          purple: '#a78bfa',
          pink: '#f472b6',
        },
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        lg: '1rem',
        xl: '1.125rem',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0,0,0,.35)',
        'card-lg': '0 20px 60px rgba(0,0,0,.5)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up .25s cubic-bezier(.4,0,.2,1)',
        'fade-in': 'fade-in .2s ease',
      },
    },
  },
  plugins: [],
} satisfies Config;