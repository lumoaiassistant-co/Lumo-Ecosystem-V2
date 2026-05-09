/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#F5F0FA',
          100: '#EBE0F5',
          200: '#D7C1EB',
          300: '#C9A7EB',
          400: '#B88DE0',
          500: '#A873D5',
          600: '#8E5AC0',
          700: '#7448A0',
          800: '#5A3780',
          900: '#402660',
        },
        babyblue: {
          50: '#F0F9FD',
          100: '#E1F3FB',
          200: '#C3E7F7',
          300: '#A7D8F0',
          400: '#8BC9E9',
          500: '#6FBAE2',
          600: '#4FA2D1',
          700: '#3A7EA8',
          800: '#2C607F',
          900: '#1E4256',
        },
        blush: {
          50: '#FEF9FB',
          100: '#FDF3F7',
          200: '#FBE7EF',
          300: '#F8C8DC',
          400: '#F5A9C9',
          500: '#F28AB6',
          600: '#E95E96',
          700: '#D23E76',
          800: '#A63060',
          900: '#7A2347',
        },
        cream: {
          50: '#FFF9F9',
          100: '#FFF5F5',
          200: '#FFEBEB',
          300: '#FFE0E0',
          400: '#FFD6D6',
          500: '#FFCCCC',
          600: '#FFB8B8',
          700: '#FF9999',
          800: '#FF7A7A',
          900: '#FF5C5C',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'gradient-purple-pink': 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #C9A7EB 0%, #A7D8F0 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(169, 124, 235, 0.15)',
        'soft-lg': '0 8px 30px rgba(169, 124, 235, 0.2)',
        'glow': '0 0 20px rgba(193, 167, 235, 0.5)',
      },
    },
  },
  plugins: [],
};
