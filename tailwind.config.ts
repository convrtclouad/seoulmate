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
        // SeoulMate brand palette
        primary: {
          50:  "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",  // main pink/coral
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        secondary: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",  // accent green
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        korean: {
          red:    "#CD2E3A",  // Taegukgi red
          blue:   "#0047A0",  // Taegukgi blue
          gold:   "#F0A500",
          cream:  "#FFF8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "slide-up":   "slideUp 0.3s ease-out",
        "fade-in":    "fadeIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":  "spin 3s linear infinite",
      },
      keyframes: {
        slideUp: {
          "0%":   { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
      },
      backgroundImage: {
        "korean-gradient": "linear-gradient(135deg, #CD2E3A 0%, #ec4899 50%, #0047A0 100%)",
        "card-gradient":   "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,248,240,0.8) 100%)",
      },
      boxShadow: {
        card:   "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        glow:   "0 0 20px rgba(236,72,153,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
