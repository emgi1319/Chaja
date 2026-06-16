/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#24613C",
          dark: "#1A4A2D",
          tint: "#E8F0EB",
        },
        accent: {
          DEFAULT: "#2E8B57",
          dark: "#216B42",
          tint: "#E6F2EB",
        },
        amber: "#C8861E",
        ink: {
          DEFAULT: "#1E2A22",
          soft: "#3C4A40",
          muted: "#79857D",
        },
        panel: "#173A26",
        surface: "#F2F5F2",
        line: "#E4EAE5",
        danger: "#C0392B",
        disabled: "#AAB3AC",
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
