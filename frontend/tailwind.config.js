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
  plugins: [daisyui],
}
