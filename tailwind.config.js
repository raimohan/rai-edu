/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /bg-(blue|red|gray|green|yellow|purple|pink)-(100|200|500|600|900)/,
    },
    {
      pattern: /text-(blue|red|gray|green|yellow|purple|pink)-(600|800)/,
    },
    {
      pattern: /from-(blue|red|gray|green|yellow|purple|pink)-50/,
    },
    {
      pattern: /ring-(blue|red|gray|green|yellow|purple|pink)-(100|400|500)/,
    },
    {
      pattern: /peer-checked:bg-(blue|red|gray|green|yellow|purple|pink)-500/,
    },
    {
        pattern: /peer-checked:ring-(blue|red|gray|green|yellow|purple|pink)-400/,
    },
    'bg-gray-800', 
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        lobster: ['Lobster', 'cursive'], // <-- Naya font add kiya gaya
        'dancing-script': ['"Dancing Script"', 'cursive'], // <-- Naya font add kiya gaya
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}
