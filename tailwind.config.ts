import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean forest green palette (reference image)
        primary: {
          50:  "#f0faf4",
          100: "#dcf3e6",
          200: "#b8e7ce",
          300: "#85d3ae",
          400: "#4db887",
          500: "#2d9b6a",
          600: "#1f7d54",
          700: "#1b6344",
          800: "#194f38",
          900: "#16412f",
          950: "#0b2419",
        },
        forest: {
          DEFAULT: "#1B4332",
          light:   "#2D6A4F",
          mid:     "#40916C",
          soft:    "#74C69D",
          pale:    "#B7E4C7",
          mist:    "#D8F3DC",
        },
        neutral: {
          50:  "#F8FAF9",
          100: "#F1F5F2",
          200: "#E4EBE6",
          300: "#C9D6CC",
          400: "#9DB4A2",
          500: "#6B8F72",
          600: "#4A6B50",
          700: "#334D38",
          800: "#1F3023",
          900: "#111A13",
        },
        surface: "#FFFFFF",
        bg:      "#F4F7F5",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "2xl":  "16px",
        "3xl":  "24px",
        "4xl":  "32px",
      },
      boxShadow: {
        card:   "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 28px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        float:  "0 16px 48px rgba(27,67,50,0.16)",
        inner:  "inset 0 1px 3px rgba(0,0,0,0.06)",
      },
      animation: {
        "slide-up":   "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "fade-in":    "fadeIn 0.25s ease-out",
        "scale-in":   "scaleIn 0.2s ease-out",
        "bounce-sm":  "bounceSm 0.4s ease-out",
      },
      keyframes: {
        slideUp:  { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        fadeIn:   { "0%": { opacity: "0" },  "100%": { opacity: "1" } },
        scaleIn:  { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        bounceSm: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.06)" } },
      },
    },
  },
  plugins: [],
};
export default config;
