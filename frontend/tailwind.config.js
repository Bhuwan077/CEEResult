/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cee: {
          navy: '#0f2942',
          primary: '#163b5f',
          light: '#f1f5f9',
          accent: '#2563eb',
          gold: '#d97706',
          success: '#10b981',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
