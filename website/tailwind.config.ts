import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00a897",
          50:  "#e6faf8",
          100: "#b3ede9",
          400: "#00c4b0",
          500: "#00a897",
          600: "#008a7c",
          700: "#006b60",
        },
        navy: {
          DEFAULT: "#0f1b2d",
          50:  "#e8edf5",
          100: "#c5d0e0",
          500: "#1a2f4a",
          600: "#152540",
          700: "#0f1b2d",
          800: "#090f18",
          900: "#040810",
        },
        gold: { DEFAULT: "#c9a84c", 400: "#e0c06a", 600: "#b09030" },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        display: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
      boxShadow: {
        card:    "0 4px 24px rgba(0,0,0,0.08)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.16)",
        glow:    "0 0 40px rgba(0,168,151,0.25)",
        "glow-lg": "0 0 80px rgba(0,168,151,0.35)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-overlay": "linear-gradient(to bottom, rgba(9,15,24,0.55) 0%, rgba(9,15,24,0.75) 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:  { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        float:   { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
    },
  },
  plugins: [],
};
export default config;
