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
        canvas: {
          50: '#FDFCFA',
          100: '#F7F5F0',
          200: '#EFEDE7',
          300: '#E5E2D9',
          400: '#D9D6CB',
        },
        brand: {
          50: '#EEF2FB',
          100: '#DDE4F6',
          200: '#BCC9EC',
          300: '#9BAEDF',
          400: '#7E93D9',
          500: '#6B81CF',
          600: '#5872C9',
          700: '#455CAB',
          800: '#364A88',
          900: '#283866',
        },
        ink: {
          900: '#1A2233',
          700: '#2E3A52',
          500: '#5A6478',
          400: '#8B93A5',
          300: '#B5BCC8',
        },
        state: {
          success: '#5A9F7E',
          alert: '#D9A85C',
          error: '#C97F7F',
          info: '#5872C9',
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
        card: '0 1px 3px rgba(26, 34, 51, 0.06), 0 4px 12px rgba(26, 34, 51, 0.04)',
        'card-lg': '0 8px 32px rgba(26, 34, 51, 0.08)',
        glow: '0 0 40px rgba(88, 114, 201, 0.15)',
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
