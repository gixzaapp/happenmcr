import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "canvas-white": "#FFFFFF",
        "industrial-black": "#1A1A1A",
        "bee-yellow": "#FFCC00",
        "event-teal": "#0D9488",
        "event-purple": "#9333EA",
        background: "#f9f9f9",
        surface: "#f9f9f9",
        "surface-container-low": "#f3f3f3",
        "surface-container": "#eeeeee",
        secondary: "#5f5e5e",
        "secondary-fixed-dim": "#c8c6c6",
        "on-background": "#1a1c1c",
        primary: "#745b00",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      maxWidth: {
        site: "1440px",
      },
      spacing: {
        "grid-margin": "2rem",
        gutter: "1.5rem",
        "stack-sm": "0.5rem",
        "stack-md": "1.5rem",
        "stack-lg": "4rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        "label-md": [
          "14px",
          { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "headline-sm": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "headline-md": ["32px", { lineHeight: "1.3", fontWeight: "700" }],
        "headline-lg": [
          "48px",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "headline-xl": [
          "64px",
          { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "800" },
        ],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
      },
      boxShadow: {
        hard: "4px 4px 0px 0px #FFCC00",
      },
    },
  },
  plugins: [],
};

export default config;
