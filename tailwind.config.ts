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
        emerald: { DEFAULT: "#10b981", 50: "#F0FDF4", 500: "#10b981", 600: "#059669" },
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
      fontSize: {
        h1: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        sm: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        xs: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
        lg: "0 10px 24px rgba(0, 0, 0, 0.10)",
        "md-hover": "0 6px 20px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
