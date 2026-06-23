/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffaf5',
          100: '#fff6ec',
          200: '#fce7c8',
          500: '#D4AF37',
        },
        ink: '#111111',
        paper: '#F5F3EF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        card: '0 6px 30px rgba(16,16,16,0.08)',
      },
      transitionTimingFunction: {
        'in-out-quad': 'cubic-bezier(.4,0,.2,1)'
      },
      spacing: {
        '9/16': '56.25%'
      }
    }
  },
  plugins: [],
}
