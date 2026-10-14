export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F3EA",
        ink: "#101E2C",
        reactor: {
          50: "#FFF7E8",
          100: "#FEEFC7",
          500: "#F5A301",
          600: "#D98700",
          700: "#A86400",
        },
        moss: {
          100: "#DDF3DF",
          600: "#1E7E34",
          700: "#166429",
        },
        alarm: {
          100: "#FDE2E2",
          600: "#C81E1E",
          700: "#A31616",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          "system-ui",
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
        song: ['"Songti SC"', '"Noto Serif SC"', "serif"],
      },
    },
  },
  plugins: [],
};
