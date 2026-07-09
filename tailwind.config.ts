import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFDF7",
        surface: "#FFFFFF",
        deep: "#102033",
        muted: "#64748B",
        solar: "#F6B73C",
        energy: "#20C997",
        sky: "#38BDF8",
        soft: "#E5E7EB",
        paleSolar: "#FFF3D1",
        paleGreen: "#E8FFF6",
      },
      boxShadow: {
        soft: "0 20px 80px rgba(16, 32, 51, 0.08)",
        glow: "0 24px 70px rgba(246, 183, 60, 0.24)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
