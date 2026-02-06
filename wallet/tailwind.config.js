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
          50: '#FDF8E8',
          100: '#F5E6B8',
          200: '#E8C65D',
          300: '#D4A843',
          400: '#C5963B',
          500: '#B8860B',
          600: '#9A7209',
          700: '#7C5C07',
          800: '#5E4505',
          900: '#3F2E03',
        },
        vault: {
          base: '#0A0A0F',
          card: '#13131A',
          cardHover: '#1A1A24',
          modal: '#0D0D14',
          border: 'rgba(212,168,67,0.15)',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C5963B 0%, #E8C65D 50%, #D4A843 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(232,198,93,0.15) 50%, transparent 100%)',
        'vault-gradient': 'linear-gradient(180deg, #0A0A0F 0%, #13131A 100%)',
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
