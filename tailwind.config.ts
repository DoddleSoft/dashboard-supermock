// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        radeil: ["var(--font-radeil)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
