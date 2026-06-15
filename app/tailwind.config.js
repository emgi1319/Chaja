/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B5E9B",
          dark: "#14497A",
          tint: "#E7EFF7",
        },
        accent: {
          DEFAULT: "#1FA971",
          dark: "#178A5B",
          tint: "#E6F5EE",
        },
        ink: {
          DEFAULT: "#1B2733",
          soft: "#3A4756",
          muted: "#76828F",
        },
        panel: "#102A43",
        surface: "#F2F5F8",
        line: "#E2E8EF",
        danger: "#C0392B",
        disabled: "#AAB3BC",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(20, 40, 35, 0.06), 0 1px 2px rgba(20, 40, 35, 0.04)",
        float: "0 8px 24px rgba(20, 40, 35, 0.10)",
      },
    },
  },
  plugins: [],
};
