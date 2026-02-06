/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: 'var(--gold-50)',
          100: 'var(--gold-100)',
          200: 'var(--gold-200)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: '#9A7209',
          700: '#7C5C07',
          800: '#5E4505',
          900: '#3F2E03',
        },
        vault: {
          base: 'var(--vault-base)',
          card: 'var(--vault-card)',
          cardHover: 'var(--vault-card-hover)',
          modal: 'var(--vault-modal)',
          border: 'var(--vault-border)',
        },
      },
      backgroundImage: {
        'gold-gradient': 'var(--gold-gradient)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, var(--shimmer-color) 50%, transparent 100%)',
        'vault-gradient': 'linear-gradient(180deg, var(--vault-base) 0%, var(--vault-card) 100%)',
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
