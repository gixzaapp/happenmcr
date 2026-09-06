import Script from "next/script";

/** Public AdSense publisher id, e.g. ca-pub-XXXXXXXX. Empty = AdSense off. */
export function getAdSenseClient(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
    "ca-pub-4393888257507260";
  if (!/^ca-pub-\d+$/i.test(raw)) {
    console.warn(
      `[adsense] NEXT_PUBLIC_ADSENSE_CLIENT looks invalid (“${raw}”). Expected ca-pub-XXXXXXXX.`,
    );
    return null;
  }
  return raw;
}

/** Google AdSense loader — sitewide verification + future ad units. */
export function GoogleAdSense() {
  const client = getAdSenseClient();
  if (!client) return null;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
      strategy="beforeInteractive"
    />
  );
}
