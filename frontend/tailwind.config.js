/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        caribbean: '#04D486',
        tufts: '#3E84DC',
        alice: '#EAF7FF',
        white: '#FFFFFF',
        black: '#000000',
      },
    },
  },
  animation: {
    shimmer: "shimmer 1.6s infinite linear",
  },
  keyframes: {
    shimmer: {
      "0%": { backgroundPosition: "-400px 0" },
      "100%": { backgroundPosition: "400px 0" },
    },
  },

  plugins: [daisyui],
}
