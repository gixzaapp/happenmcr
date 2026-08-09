/**
 * Scraped organiser images stay hidden until permission is confirmed.
 * Add a scraper source id here after written/verbal clearance, e.g.:
 *   "scraper:band-on-the-wall"
 *   "scraper:ao-arena"
 *   "scraper:coop-live"
 *   "scraper:o2-ritz"
 *   "scraper:albert-hall"
 */
const ALLOWED_SCRAPED_IMAGE_SOURCES = new Set<string>([
  // Add allowed sources one by one after organiser permission.
]);

/**
 * Licensed / stock CDNs we control the choice of — safe to show even when the
 * event row still has a scraped `source` (e.g. after a manual image override).
 */
const STOCK_IMAGE_HOSTS = new Set([
  "cdn.pixabay.com",
  "images.unsplash.com",
]);

/** True when the event came from a HappenMCR HTML/API scraper. */
export function isScrapedSource(source: string | null | undefined): boolean {
  return Boolean(source?.startsWith("scraper:"));
}

/** True when this scraper source may display organiser photos. */
export function hasScrapedImagePermission(
  source: string | null | undefined,
): boolean {
  if (!source) return false;
  return ALLOWED_SCRAPED_IMAGE_SOURCES.has(source);
}

/** Manual / stock image URLs we chose ourselves (not organiser page scrapes). */
export function isStockImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  try {
    const host = new URL(imageUrl).hostname.toLowerCase();
    return STOCK_IMAGE_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * Use the dark title poster instead of a scraped photo until permission
 * is on the allowlist above — unless image_url is a stock CDN override.
 */
export function shouldUseSymbolicEventImage(
  source: string | null | undefined,
  imageUrl?: string | null,
): boolean {
  if (isStockImageUrl(imageUrl)) return false;
  return isScrapedSource(source) && !hasScrapedImagePermission(source);
}

/** Safe to expose image_url in UI / Open Graph (non-scraped, permitted, or stock). */
export function canShowEventImage(
  source: string | null | undefined,
  imageUrl: string | null | undefined,
): boolean {
  if (!imageUrl) return false;
  if (isStockImageUrl(imageUrl)) return true;
  if (!isScrapedSource(source)) return true;
  return hasScrapedImagePermission(source);
}
