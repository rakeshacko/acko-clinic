/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Slack aubergine sidebar palette
        slack: {
          sidebar: "#19171D",
          sidebarHover: "#27242C",
          sidebarActive: "#1164A3",
          sidebarText: "#BCABBC",
          sidebarTextActive: "#FFFFFF",
          panel: "#FFFFFF",
          border: "#E4E4E4",
          divider: "#EBEAEB",
          textPrimary: "#1D1C1D",
          textSecondary: "#616061",
          link: "#1264A3",
          mention: "#1264A3",
          unread: "#E01E5A",
        },
        // ACKO clinic accent
        acko: {
          sage: "#7BA694",
          sageDark: "#5E8B79",
          sageLight: "#E6EFEA",
          warm: "#FAF6F1",
          warmDark: "#F2EBE1",
        },
        // Alert / source bar colors
        bar: {
          navy: "#1D4E89",
          ochre: "#C68E17",
          red: "#D72638",
        },
      },
      fontFamily: {
        sans: [
          "Lato",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ["Menlo", "Consolas", "Monaco", "monospace"],
      },
      fontSize: {
        msg: ["15px", { lineHeight: "1.46668" }],
      },
    },
  },
  plugins: [],
};
