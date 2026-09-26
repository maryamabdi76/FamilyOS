import type { Config } from "tailwindcss";

// Visual direction (spec §35): calm, personal, trustworthy, minimal.
// Avoid heavy shadows/gradients by default — keep the palette restrained
// and let feature UI opt in to accents rather than starting loud.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        border: "var(--color-border)",
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
