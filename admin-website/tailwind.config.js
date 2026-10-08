/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8ee',
          100: '#faefd0',
          200: '#f4dba0',
          300: '#ecc165',
          400: '#e4a535',
          500: '#c9a96e',
          600: '#b8902a',
          700: '#9a7320',
          800: '#7e5e1d',
          900: '#674e1c',
        },
        dark: {
          700: '#2d2010',
          800: '#1a1108',
          900: '#0d0904',
          950: '#090603',
        },
        sidebar: '#111008',
        'sidebar-hover': '#1e1a0e',
        'card-bg': '#1a1610',
        cream: '#f5e6c8',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
