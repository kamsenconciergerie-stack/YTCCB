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
        // Identité visuelle CCB
        ccb: {
          green: {
            DEFAULT: "#1B3B2F",
            50:  "#E8F0ED",
            100: "#C6D9CF",
            200: "#9EBFB0",
            300: "#76A591",
            400: "#4E8B72",
            500: "#2E6650",
            600: "#1B3B2F", // primary
            700: "#142D23",
            800: "#0D1F18",
            900: "#07110D",
          },
          gold: {
            DEFAULT: "#9C7A3C",
            50:  "#F5EFE3",
            100: "#E8D9BC",
            200: "#D6BE8C",
            300: "#C4A35C",
            400: "#B28B3C",
            500: "#9C7A3C", // secondary
            600: "#7E6230",
            700: "#5F4A24",
            800: "#413218",
            900: "#231A0C",
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
