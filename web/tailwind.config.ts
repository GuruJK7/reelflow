import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reelflow: {
          bg: "#0a0e17",
          surface: "#121826",
          border: "#1f2937",
          accent: "#22d3ee",
          accent2: "#6366f1",
          text: "#e5e7eb",
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
