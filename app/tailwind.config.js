/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta clínica SOPsi — azul calmo (marca) + teal sutil (acento)
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#599fff",
          500: "#337bf6",
          600: "#1f5ee0",
          700: "#1a4abc",
          800: "#1b4099",
          900: "#1c3a79",
          950: "#15244a",
        },
        // Acento teal — usado com parcimônia (camada longitudinal, destaques calmos)
        accent: {
          50: "#eefdfb",
          100: "#d2f8f2",
          200: "#aaefe8",
          300: "#71e0d8",
          400: "#37c7bf",
          500: "#16aaa4",
          600: "#0d8884",
          700: "#106c6a",
          800: "#125657",
          900: "#134849",
          950: "#042b2e",
        },
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      // Sombras suaves e em camadas — profundidade discreta, tom clínico
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.05)",
        "card-hover":
          "0 8px 20px -8px rgb(15 23 42 / 0.14), 0 3px 8px -3px rgb(15 23 42 / 0.08)",
        pop: "0 18px 44px -14px rgb(15 23 42 / 0.30), 0 6px 14px -6px rgb(15 23 42 / 0.14)",
        focus: "0 0 0 3px rgb(51 123 246 / 0.30)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.20s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.26s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
