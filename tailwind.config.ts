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
        // Identité visuelle CCB — bleu #1D5BB0 / orange corail #F47551
        ccb: {
          green: {
            DEFAULT: "#1D5BB0",
            50:  "#EFF4FB",
            100: "#D5E4F5",
            200: "#ABCAEB",
            300: "#81AFE0",
            400: "#5795D6",
            500: "#2D7ACC",
            600: "#1D5BB0",
            700: "#15428A",
            800: "#0D2A5E",
            900: "#061532",
          },
          gold: {
            DEFAULT: "#F47551",
            50:  "#FEF2EE",
            100: "#FDDDD5",
            200: "#FBBCAC",
            300: "#F89A82",
            400: "#F67968",
            500: "#F47551",
            600: "#E05A37",
            700: "#B84428",
            800: "#902F1A",
            900: "#68200C",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
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
