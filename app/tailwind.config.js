/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#16BE78",
          dark: "#12A668",
          tint: "#E7F5EE",
        },
        ink: {
          DEFAULT: "#222B2B",
          soft: "#3A4444",
          muted: "#7C8784",
        },
        panel: "#1E2A28",
        surface: "#F1F5F3",
        line: "#E4EAE7",
        accent: "#1E63B8",
        danger: "#C0392B",
        disabled: "#A9AFAD",
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
