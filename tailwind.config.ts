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
        // ── Core Palette: Organic Minimalism ──────────────────────────────
        cream:   "#F9F8F4",  // main background
        surface: "#FFFFFF",  // card surface

        // Sage (gray-green) — primary actions
        sage: {
          50:  "#F2F6F2",
          100: "#E0EBE0",
          200: "#C0D6C1",
          300: "#95BB97",
          400: "#6B9970",
          500: "#4E7A55",
          600: "#3A5D40",
          700: "#2C4731",
          DEFAULT: "#5B8862",
        },

        // Ginger (warm yellow) — dates, bookings, countdown
        ginger: {
          50:  "#FEF9EE",
          100: "#FDF1D0",
          200: "#FAE29F",
          300: "#F7CF6B",
          400: "#F0B429",
          500: "#D99E1A",
          DEFAULT: "#E8A800",
        },

        // Lavender (powder purple) — journal, notes
        lavender: {
          50:  "#F5F3FA",
          100: "#EAE6F4",
          200: "#D5CCE9",
          300: "#B9AED9",
          400: "#9E90C8",
          DEFAULT: "#8B7AB8",
        },

        // Petal (soft rose) — expenses, important
        petal: {
          50:  "#FEF5F3",
          100: "#FDEAE5",
          200: "#F9D4CB",
          300: "#F4B5A5",
          400: "#EE9080",
          DEFAULT: "#E87060",
        },

        // Mist (blue-green) — members, social
        mist: {
          50:  "#F0F7F6",
          100: "#DAEEED",
          200: "#B4DCD9",
          300: "#85C4C0",
          400: "#5BACA8",
          DEFAULT: "#4A9592",
        },

        // Ink (text)
        ink: {
          DEFAULT: "#2A2826",
          mid:     "#5C5A58",
          muted:   "#9A9895",
          faint:   "#CECDCB",
        },
      },

      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },

      letterSpacing: {
        relaxed: "0.03em",
        airy:    "0.06em",
      },

      borderRadius: {
        "2xl":  "16px",
        "3xl":  "24px",
        "4xl":  "32px",
        "5xl":  "40px",
      },

      boxShadow: {
        // Organic Minimalism — ultra-soft
        card:       "0 4px 20px rgba(0,0,0,0.05)",
        "card-lift":"0 8px 32px rgba(0,0,0,0.09)",
        float:      "0 12px 40px rgba(0,0,0,0.10)",
        input:      "0 2px 8px rgba(0,0,0,0.04)",
        inset:      "inset 0 1px 4px rgba(0,0,0,0.04)",
      },

      animation: {
        "slide-up":  "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        "fade-in":   "fadeIn 0.3s ease-out",
        "scale-in":  "scaleIn 0.25s ease-out",
        "plane-bob": "planeBob 2s ease-in-out infinite",
        "pulse-soft":"pulseSoft 2s ease-in-out infinite",
      },

      keyframes: {
        slideUp:   { "0%": { transform:"translateY(20px)", opacity:"0" }, "100%": { transform:"translateY(0)", opacity:"1" } },
        fadeIn:    { "0%": { opacity:"0" }, "100%": { opacity:"1" } },
        scaleIn:   { "0%": { transform:"scale(0.94)", opacity:"0" }, "100%": { transform:"scale(1)", opacity:"1" } },
        planeBob:  { "0%,100%": { transform:"translateY(0) rotate(-4deg)" }, "50%": { transform:"translateY(-12px) rotate(2deg)" } },
        pulseSoft: { "0%,100%": { opacity:"1" }, "50%": { opacity:"0.6" } },
      },
    },
  },
  plugins: [],
};
export default config;
