// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        regular: "Your-Regular-Font",
        medium: "Your-Medium-Font",
        light: "Your-Light-Font",
        bold: "Your-Bold-Font",
      },
    },
  },
  plugins: [],
}
