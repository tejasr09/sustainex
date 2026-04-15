/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        loop: {
          50: "#f6f2ff",
          100: "#efe7ff",
          200: "#d8c7ff",
          300: "#b79aff",
          400: "#8b72ff",
          500: "#5f66ff",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#312e81",
          900: "#1f1b4d",
        },
        neon: {
          50: "#fff1ff",
          100: "#ffe1ff",
          200: "#ffc2ff",
          300: "#ff9bff",
          400: "#ff64f0",
          500: "#ff2ed1",
          600: "#ea1fb1",
          700: "#c71891",
          800: "#8d1268",
          900: "#5f0d46",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      boxShadow: {
        glass: "0 14px 44px rgba(20, 10, 45, 0.45)",
        card: "0 14px 32px rgba(9, 13, 38, 0.5)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(95, 102, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 46, 209, 0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
    },
  },
  plugins: [],
};
