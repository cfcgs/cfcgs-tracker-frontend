/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita o tema dark baseado em uma classe no HTML
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0D1117',
        'dark-card': '#161B22',
        'dark-border': '#30363D',
        'dark-text': '#C9D1D9',
        'dark-text-secondary': '#8B949E',
        'accent-blue': '#58A6FF',
      }
    },
  },
  plugins: [],
}