import type { Config } from "tailwindcss";


const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Layered light surfaces — soft green-tinted paper to match the accent
        base: "#F4FAF6",             // page background
        surface: "#FFFFFF",          // cards / panels
        surfaceHover: "#EDF6F0",     // hover states
        raised: "#FFFFFF",           // elevated surfaces
        hairline: "rgba(0,0,0,0.10)",   // thin borders
        hairlineStrong: "rgba(0,0,0,0.18)", // hover borders

        // Accent — signal green (the stamp), used sparingly
        accent: "#16A34A",
        accentBright: "#22C55E",
        accentDim: "#15803D",

        // Console accent — mint/teal (gazijarin-inspired), for the CS template
        mint: "#0F766E",
        mintBright: "#115E59",
        mintSoft: "rgba(15,118,110,0.12)",

        // Text
        ink: "#17171B",
        inkDim: "#5B5B66",
        inkFaint: "#8A8A95",

        // Light-tuned semantic hues (darker shades for white backgrounds)
        leaf: "#16A34A",
        leafSoft: "rgba(22,163,74,0.12)",
        sky: "#0284C7",
        skySoft: "rgba(2,132,199,0.12)",
        sun: "#D97706",
        sunSoft: "rgba(217,119,6,0.12)",
        coral: "#DC2626",
        coralSoft: "rgba(220,38,38,0.12)",
        grape: "#7C3AED",
        grapeSoft: "rgba(124,58,237,0.12)",
        good: "#16A34A",
        bad: "#DC2626",

        // Compatibility aliases (dark-theme names remapped to light values)
        paper: "#F4FAF6",
        line: "rgba(0,0,0,0.10)",
        leafDark: "#16A34A",
        skyDark: "#0284C7",
        sunDark: "#D97706",
        grapeDark: "#7C3AED",
        leafLight: "#BBF7D0",
        skyLight: "#BAE6FD",
        sunLight: "#FDE68A",
        grapeLight: "#E9D5FF",
        signal: "#16A34A",
        signalDim: "#15803D",
        night: "#F4FAF6",
        nightRaised: "#FFFFFF",
        nightDeep: "#F4FAF6",
        nightLine: "rgba(0,0,0,0.10)",
        violet: "#16A34A",
        violetDark: "#15803D",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
