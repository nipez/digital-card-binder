import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        archive: {
          ink: "#221d1a",
          paper: "#f7efe0",
          brass: "#b58a43",
          oxblood: "#6e2f2b",
          field: "#2f6b4f",
          sleeve: "rgba(255,255,255,0.42)"
        }
      },
      boxShadow: {
        sleeve: "inset 0 0 22px rgba(255,255,255,0.45), inset 0 0 1px rgba(255,255,255,0.9), 0 12px 28px rgba(37,27,20,0.15)",
        card: "0 18px 36px rgba(25,18,13,0.23)"
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
