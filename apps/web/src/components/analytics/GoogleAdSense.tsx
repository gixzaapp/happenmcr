/**
 * HappenMCR AdSense publisher id — matches the Google AdSense dashboard snippet.
 * Optional override: NEXT_PUBLIC_ADSENSE_CLIENT
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
  "ca-pub-4393888257507260";

export function getAdSenseClient(): string | null {
  if (!/^ca-pub-\d+$/i.test(ADSENSE_CLIENT)) {
    console.warn(
      `[adsense] Invalid publisher id (“${ADSENSE_CLIENT}”). Expected ca-pub-XXXXXXXX.`,
    );
    return null;
  }
  return ADSENSE_CLIENT;
}

/**
 * Exact AdSense head snippet Google provides for site verification.
 * Do NOT use next/script here — it rewrites to __next_s.push(...) and
 * AdSense’s crawler will not accept that as the verification script.
 */
export function GoogleAdSense() {
  const client = getAdSenseClient();
  if (!client) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
