import localFont from "next/font/local";

/** Serif and sans used only on History and Poet's Corner. Kept separate so they do not replace the site fonts. */

export const historySerif = localFont({
  src: "./newsreader-latin.woff2",
  weight: "400 800",
  variable: "--font-history-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const historySans = localFont({
  src: "./public-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-history-sans",
  display: "swap",
});
