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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#1E88E5',
          600: '#1976D2',
          700: '#1565C0',
        },
      },
    },
  },
  plugins: [],
};
export default config;

