/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: "#1e3a8a",
            light: "#3b82f6",
            dark: "#172554",
          },
          gold: {
            DEFAULT: "#b45309",
            light: "#f59e0b",
            dark: "#78350f",
          },
        },
        surface: {
          DEFAULT: "#f8fafc",
          card: "#ffffff",
          muted: "#f1f5f9",
          glass: "rgba(255, 255, 255, 0.7)",
        },
      },
      boxShadow: {
        premium:
          "0 10px 30px -10px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
        "premium-hover":
          "0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)",
        "gold-gradient": "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
