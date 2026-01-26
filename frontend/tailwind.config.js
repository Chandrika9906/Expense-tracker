/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    },
  },
  plugins: [],
}