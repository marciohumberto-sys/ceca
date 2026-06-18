/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#F5F6F8',
          card: '#FFFFFF',
          hover: '#ECEEF2',
        },
        brand: {
          50:  '#EDFAF3',
          100: '#D2F4E4',
          200: '#A6E8C9',
          300: '#6FD9A8',
          400: '#38C985',
          DEFAULT: '#1DB86E',
          600: '#159654',
          700: '#107540',
          800: '#0C562F',
          900: '#083A20',
        },
        graphite: {
          50:  '#F7F8FA',
          100: '#ECEEF2',
          200: '#D8DCE4',
          300: '#B8BFCC',
          400: '#8E98AC',
          500: '#64718A',
          600: '#4A5568',
          700: '#344055',
          800: '#1E2A3A',
          900: '#0F1623',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#F5E6B8',
        },
        purple: {
          DEFAULT: '#7C5CBF',
          light: '#EDE8F8',
        },
        danger: {
          DEFAULT: '#E05252',
          light: '#FEECEC',
        },
        warning: {
          DEFAULT: '#E08C2D',
          light: '#FEF3E2',
        },
        success: {
          DEFAULT: '#1DB86E',
          light: '#EDFAF3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 8px 28px rgba(0,0,0,0.07)',
        sidebar: '2px 0 20px rgba(0,0,0,0.06)',
        'bottom-nav': '0 -2px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
