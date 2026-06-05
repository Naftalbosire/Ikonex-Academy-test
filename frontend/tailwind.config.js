/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f0f4f8', 100: '#d9e4f0', 200: '#b3c9e1', 300: '#7fa4c9', 400: '#4d7fad', 500: '#2a5f90', 600: '#1a3c5e', 700: '#142f4a', 800: '#0d2236', 900: '#071522' },
        gold: { 400: '#f5c842', 500: '#e6b800', 600: '#c9a000' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
};
