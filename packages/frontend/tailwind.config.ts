import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0b0f",
          card: "#12141c",
          elevated: "#1a1d2e",
        },
        accent: {
          purple: "#7c5cfc",
          "purple-hover": "#6a4be0",
          cyan: "#22d3ee",
          "cyan-hover": "#06b6d4",
        },
        surface: {
          DEFAULT: "#1e2030",
          hover: "#252840",
          border: "#2a2d45",
        },
        tier: {
          newcomer: "#6b7280",
          explorer: "#22d3ee",
          pathfinder: "#a855f7",
          architect: "#f59e0b",
          legend: "#ef4444",
          chainElder: "#7c5cfc",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(124, 92, 252, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(124, 92, 252, 0.6)" },
        },
        "progress-fill": {
          from: { width: "0%" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
