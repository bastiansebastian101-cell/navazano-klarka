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
          DEFAULT: "#B8567A",
          hover: "#9E4568",
          light: "#FBEEF1",
          dark: "#7A3450",
        },
        sage: {
          DEFAULT: "#8A9A7E",
          light: "#EEF2EA",
        },
        cream: "#FDFBF7",
        ink: {
          DEFAULT: "#3A3532",
          light: "#6B655F",
          lighter: "#A29B93",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(58,53,50,0.08)",
        "card-hover": "0 8px 24px 0 rgba(58,53,50,0.14)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
