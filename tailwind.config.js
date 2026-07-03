/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#101010",
        surface: "#181818",
        card: "#1C1C1C",
        surface2: "#222222",
        border: "#3A3A3A",
        text: "#E7E7E7",
        "text-secondary": "#9B9B9B",
        "text-muted": "#6D6D6D",
        purple: "#B18BFF",
        green: "#B7D64B",
        blue: "#2B84D8",
        pink: "#A94AAE",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};
