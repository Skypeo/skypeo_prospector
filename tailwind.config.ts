import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f7f4",
          100: "#b3e8e1",
          200: "#80d9ce",
          300: "#4dcabb",
          400: "#26bfae",
          500: "#00b49f",
          600: "#008f78",
          700: "#006b5a",
          800: "#004840",
          900: "#002520",
        },
      },
    },
  },
  plugins: [],
};

export default config;
