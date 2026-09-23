import localFont from "next/font/local";

/** Self-hosted so production builds do not download Google Fonts. */

export const display = localFont({
  src: [
    { path: "./montserrat-600.woff2", weight: "600", style: "normal" },
    { path: "./montserrat-700.woff2", weight: "700", style: "normal" },
    { path: "./montserrat-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const sans = localFont({
  src: [
    { path: "./inter-400.woff2", weight: "400", style: "normal" },
    { path: "./inter-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
