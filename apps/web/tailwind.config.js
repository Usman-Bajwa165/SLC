/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1A3C6E',
          'blue-light': '#2A5298',
          gold: '#C49A1A',
          'gold-light': '#F5C842',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
