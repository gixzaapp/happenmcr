import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import {
  GoogleAdSense,
  GoogleAnalytics,
  GoogleTagManager,
  GoogleTagManagerNoscript,
  UniqueVisitBeacon,
  getAdSenseClient,
} from "@/components/analytics";
import { Suspense } from "react";
import { getSiteUrl } from "@/lib/config";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  HOME_TITLE,
  SITE_NAME,
} from "@/lib/seo";
import "./globals.css";

const display = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
  preload: true,
  adjustFontFallback: true,
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600"],
  preload: true,
  adjustFontFallback: true,
});

const adsenseClient = getAdSenseClient();

/**
 * Site-wide defaults only. Per-page `buildPageMetadata` sets title, description,
 * OG/Twitter, and a self-referencing canonical — do not set alternates.canonical
 * here (it would risk collapsing every route onto `/`).
 */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/opengraph-image", alt: "HappenMCR" }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  // AdSense “Meta tag” verification — reliable with App Router (unlike next/script).
  ...(adsenseClient
    ? { other: { "google-adsense-account": adsenseClient } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <GoogleTagManager />
        <GoogleAnalytics />
        <GoogleAdSense />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <GoogleTagManagerNoscript />
        <Suspense fallback={null}>
          <UniqueVisitBeacon />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
