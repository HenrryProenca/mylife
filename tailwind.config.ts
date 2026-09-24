import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f3f9',
          100: '#dbe3f0',
          200: '#b8c6e0',
          300: '#8d9fc4',
          400: '#5d6f96',
          500: '#3a4a6b',
          600: '#1f2d4a',
          700: '#131e35',
          800: '#0c1428',
          900: '#081224',
        },
        brand: {
          50: '#e8effe',
          100: '#c9d8fc',
          200: '#a8c0fa',
          300: '#8aa9f8',
          400: '#76a4ff',
          500: '#4f7ff5',
          600: '#2f63f2',
          700: '#2551cc',
          800: '#1d3fa0',
          900: '#152d75',
        },
        content: {
          primary: '#f4f7fb',
          secondary: '#aab7cc',
          muted: '#7a87a1',
          faint: '#4d5871',
        },
        state: {
          success: '#35b779',
          alert: '#f2b84b',
          error: '#e86a6a',
          info: '#76a4ff',
        },
      },
      fontSize: {
        display: ['48px', { lineHeight: '56px', letterSpacing: '-0.02em' }],
        h1: ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
        h2: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        h3: ['18px', { lineHeight: '24px', letterSpacing: '0' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        lg: '1rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0,0,0,.35)',
        'card-lg': '0 20px 60px rgba(0,0,0,.5)',
        glow: '0 0 40px rgba(47, 99, 242, 0.25)',
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