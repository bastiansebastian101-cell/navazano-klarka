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
          DEFAULT: "#F582B3",
          hover: "#EF66A0",
          light: "#FFE9F3",
          dark: "#C94F87",
        },
        sage: {
          DEFAULT: "#6FC79A",
          light: "#E3F8EC",
          dark: "#4FA87C",
        },
        cream: "#FFF8FB",
        ink: {
          DEFAULT: "#4A3B45",
          light: "#8A7482",
          lighter: "#C9AFC0",
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
