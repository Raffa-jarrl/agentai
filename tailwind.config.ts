import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        brand: { DEFAULT: "#185FA5", 50: "#EAF2FB", 500: "#185FA5", 600: "#134C84", 700: "#0F3D6B" },
        teal: { DEFAULT: "#1D9E75", 500: "#1D9E75", 600: "#167E5D" },
        hot: { DEFAULT: "#E05656", bg: "#FDECEC" },
        warm: { DEFAULT: "#D99534", bg: "#FDF3E3" },
        cold: { DEFAULT: "#6B7A90", bg: "#EEF1F5" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      },
      fontFamily: { sans: ["var(--font-heebo)", "system-ui", "sans-serif"] },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
