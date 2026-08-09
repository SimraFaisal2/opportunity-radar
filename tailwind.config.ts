import type { Config } from "tailwindcss";

// Design direction: professional dark product (Leonardo AI / Linear / Vercel
// grade). Near-black layered surfaces (#0a0a0a base → #141414 cards →
// #1c1c1c hover), hairline borders instead of chunky outlines, ONE violet
// accent used sparingly (buttons, active states, focus), and dark-tuned
// semantic hues for status badges. Space Grotesk for display, Hanken Grotesk
// for body, JetBrains Mono for data readouts.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Layered dark surfaces
        base: "#0A0A0A",             // page background
        surface: "#141414",          // cards / panels
        surfaceHover: "#1C1C1C",     // hover states
        raised: "#1B1B1B",           // elevated surfaces
        hairline: "rgba(255,255,255,0.08)",   // thin borders
        hairlineStrong: "rgba(255,255,255,0.16)", // hover borders

        // Accent — violet, used sparingly
        accent: "#A78BFA",
        accentBright: "#C4B5FD",
        accentDim: "#7C5CF0",

        // Text
        ink: "#EDEDED",
        inkDim: "#A1A1AA",
        inkFaint: "#6E6E79",

        // Dark-tuned semantic hues
        leaf: "#4ADE80",
        leafSoft: "rgba(74,222,128,0.14)",
        sky: "#38BDF8",
        skySoft: "rgba(56,189,248,0.14)",
        sun: "#FBBF24",
        sunSoft: "rgba(251,191,36,0.14)",
        coral: "#F87171",
        coralSoft: "rgba(248,113,113,0.14)",
        grape: "#C084FC",
        grapeSoft: "rgba(192,132,252,0.14)",
        good: "#4ADE80",
        bad: "#F87171",

        // Compatibility aliases (light-theme names remapped to dark values)
        paper: "#141414",
        line: "rgba(255,255,255,0.08)",
        leafDark: "#86EFAC",
        skyDark: "#7DD3FC",
        sunDark: "#FCD34D",
        grapeDark: "#D8B4FE",
        leafLight: "#D1FAE5",
        skyLight: "#E0F2FE",
        sunLight: "#FEF3C7",
        grapeLight: "#F3E8FF",
        signal: "#A78BFA",
        signalDim: "#7C5CF0",
        night: "#0A0A0A",
        nightRaised: "#141414",
        nightDeep: "#0E0E0E",
        nightLine: "rgba(255,255,255,0.08)",
        violet: "#A78BFA",
        violetDark: "#7C5CF0",
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
