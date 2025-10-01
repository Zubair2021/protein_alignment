import { fontFamily } from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f8ff',
          100: '#e6edff',
          200: '#c4d7ff',
          300: '#9ebeff',
          400: '#6e99ff',
          500: '#3d6dff',
          600: '#1c46f2',
          700: '#1332b8',
          800: '#0c2390',
          900: '#08186a',
        },
        accent: '#00d3a7',
        background: '#0a1024',
        panel: '#111835',
      },
      fontFamily: {
        sans: ['"Inter Variable"', ...fontFamily.sans],
        mono: ['"JetBrains Mono"', ...fontFamily.mono],
      },
      boxShadow: {
        panel: '0 20px 45px rgba(4, 12, 45, 0.35)',
      },
      animation: {
        pulseLoop: 'pulseLoop 24s ease-in-out infinite',
      },
      keyframes: {
        pulseLoop: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
