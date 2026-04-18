import type { Config } from "tailwindcss"

/**
 * SentinelIQ surface tokens (mirrors globals.css). Tailwind v4 still reads this
 * for tooling; content paths ensure class scanning in all environments.
 */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: "#0a0e1a",
          card: "#0f1424",
          border: "#1e2a44",
          brand: "#4a9eff",
          critical: "#ef4444",
          warning: "#f59e0b",
          safe: "#22c55e",
          info: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono-sentinel)", "ui-monospace", "monospace"],
      },
    },
  },
} satisfies Config
