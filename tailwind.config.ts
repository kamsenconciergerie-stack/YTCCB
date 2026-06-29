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
        // Palette Mor Talla Sandaga
        mts: {
          noir:     "#1A1A1A",
          blanc:    "#FFFFFF",
          or:       "#C4956A",
          "or-dark":"#A87B52",
          gris:     "#F5F5F5",
          "gris-2": "#E8E8E8",
          "gris-3": "#9CA3AF",
          wa:       "#25D366", // WhatsApp green
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "DM Sans", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "Bebas Neue", "Impact", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "marquee": "marquee 25s linear infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
      },
      keyframes: {
        marquee: {
          "0%":   { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
