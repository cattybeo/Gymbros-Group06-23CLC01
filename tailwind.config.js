/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFA500", // Orange
        background: "#121212", // Dark Black
        surface: "#1E1E1E", // Dark Grey Card
        text: "#FFFFFF",
        text_secondary: "#A0A0A0",
      },
    },
  },
  plugins: [],
};
