import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#eaeaea',
        text: '#000000',
        blue: '#002B7F',
        yellow: '#FCD116',
        red: '#CE1126',
        backgroundSlight: '#fffcee',

      },
    },
  },
  plugins: [],
} satisfies Config;
