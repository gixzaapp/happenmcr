/**
 * Notify Google that sitemap.xml changed (rate-limited).
 * Search Console still does the real discovery; this is a nudge after ingest.
 */

const DEFAULT_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let lastPingAt = 0;
let lastPingUrl: string | null = null;

function siteUrl(): string {
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com"
  );
}

function minIntervalMs(): number {
  const raw = process.env.SITEMAP_PING_MIN_INTERVAL_MS?.trim();
  if (!raw) return DEFAULT_MIN_INTERVAL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MIN_INTERVAL_MS;
}

function isPingEnabled(): boolean {
  if (process.env.SITEMAP_PING_ENABLED === "false") return false;
  // Default on in production-like SITE_URL; off for localhost.
  if (process.env.SITEMAP_PING_ENABLED === "true") return true;
  const site = siteUrl();
  return /^https:\/\//i.test(site) && !/localhost|127\.0\.0\.1/i.test(site);
}

/**
 * Ping Google's sitemap endpoint. No-ops when disabled, rate-limited, or offline.
 * Never throws — safe to call from the ingestion cron finally path.
 */
export async function pingGoogleSitemap(options?: {
  force?: boolean;
}): Promise<{ pinged: boolean; reason: string; sitemapUrl?: string }> {
  if (!isPingEnabled()) {
    return { pinged: false, reason: "disabled" };
  }

  const sitemapUrl = `${siteUrl()}/sitemap.xml`;
  const now = Date.now();
  const elapsed = now - lastPingAt;

  if (!options?.force && elapsed < minIntervalMs()) {
    return {
      pinged: false,
      reason: `rate_limited_${Math.round((minIntervalMs() - elapsed) / 60_000)}m`,
      sitemapUrl,
    };
  }

  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "HappenMCR-SitemapPing/1.0" },
    });
    lastPingAt = now;
    lastPingUrl = sitemapUrl;
    if (!res.ok) {
      console.warn(
        `[sitemap] Google ping HTTP ${res.status} for ${sitemapUrl}`,
      );
      return { pinged: false, reason: `http_${res.status}`, sitemapUrl };
    }
    console.log(`[sitemap] pinged Google: ${sitemapUrl}`);
    return { pinged: true, reason: "ok", sitemapUrl };
  } catch (error) {
    console.warn("[sitemap] Google ping failed", error);
    return {
      pinged: false,
      reason: error instanceof Error ? error.message : "error",
      sitemapUrl: lastPingUrl ?? sitemapUrl,
    };
  }
}
