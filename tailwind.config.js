/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "physio-teal": "#138A8A",
        "physio-teal-dark": "#087F83",
        "physio-navy": "#0B2545",
        "physio-aqua": "#E6F4F4",
        "physio-muted-teal": "#5FA7A7",
        "physio-cream": "#F6ECDD",
        "physio-gray": "#D9DDE3",
        "physio-slate": "#707588",
      },
    },
  },
  plugins: [],
};
