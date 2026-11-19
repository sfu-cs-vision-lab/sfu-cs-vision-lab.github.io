/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ground: "var(--ground)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        rule: "var(--rule)",
      },
      fontFamily: {
        archivo: ["var(--font-archivo)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [ require("@tailwindcss/typography") ],
};
