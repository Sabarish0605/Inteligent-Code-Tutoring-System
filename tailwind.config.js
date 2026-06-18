/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spellBg: "#020204",
        spellGreen: "#00ff66",
        spellCyan: "#00E5FF",
        spellAmber: "#ffb300",
      },
    },
  },
  plugins: [],
}
