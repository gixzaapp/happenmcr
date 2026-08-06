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

/**
 * Use the dark title poster instead of a scraped photo until permission
 * is on the allowlist above.
 */
export function shouldUseSymbolicEventImage(
  source: string | null | undefined,
): boolean {
  return isScrapedSource(source) && !hasScrapedImagePermission(source);
}

/** Safe to expose image_url in UI / Open Graph (non-scraped, or permitted). */
export function canShowEventImage(
  source: string | null | undefined,
  imageUrl: string | null | undefined,
): boolean {
  if (!imageUrl) return false;
  if (!isScrapedSource(source)) return true;
  return hasScrapedImagePermission(source);
}
