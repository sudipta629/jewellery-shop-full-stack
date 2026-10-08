/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary gold palette — inspired by the design reference
        gold: {
          50:  '#fdf8ee',
          100: '#faefd0',
          200: '#f4dba0',
          300: '#ecc165',
          400: '#e4a535',
          500: '#c9a96e',   // brand gold
          600: '#b8902a',
          700: '#9a7320',
          800: '#7e5e1d',
          900: '#674e1c',
        },
        // Dark luxury backgrounds
        dark: {
          50:  '#f5f0e8',
          100: '#e8ddc8',
          200: '#c9b898',
          300: '#a89068',
          400: '#8a7048',
          500: '#6b5530',
          600: '#4a3820',
          700: '#2d2010',
          800: '#1a1108',   // deepest bg
          900: '#0d0904',
        },
        cream: '#f5e6c8',
        parchment: '#faf3e0',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a96e 0%, #e4c87a 50%, #c9a96e 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1a1108 0%, #2d2010 100%)',
        'hero-overlay': 'linear-gradient(90deg, rgba(26,17,8,0.85) 0%, rgba(26,17,8,0.4) 60%, transparent 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'gold': '0 4px 20px rgba(201, 169, 110, 0.3)',
        'gold-lg': '0 8px 40px rgba(201, 169, 110, 0.4)',
        'dark': '0 4px 20px rgba(0,0,0,0.4)',
        'card': '0 2px 12px rgba(0,0,0,0.12)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
