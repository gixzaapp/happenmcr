/**
 * Event image visibility.
 *
 * Scraped organiser images are shown by default. Add a source id to
 * BLOCKED_SCRAPED_IMAGE_SOURCES only if we must hide that venue again.
 */

/** Scraper sources whose organiser photos must stay hidden. */
const BLOCKED_SCRAPED_IMAGE_SOURCES = new Set<string>([
  // e.g. "scraper:some-venue"
]);

/**
 * Licensed / stock CDNs we control the choice of — always safe to show
 * (e.g. manual Pixabay / Unsplash overrides on scraped rows).
 */
const STOCK_IMAGE_HOSTS = new Set([
  "cdn.pixabay.com",
  "images.unsplash.com",
]);

/** True when the event came from a HappenMCR HTML/API scraper. */
export function isScrapedSource(source: string | null | undefined): boolean {
  return Boolean(source?.startsWith("scraper:"));
}

/** True when this scraper source must not display organiser photos. */
export function isScrapedImageBlocked(
  source: string | null | undefined,
): boolean {
  if (!source) return false;
  return BLOCKED_SCRAPED_IMAGE_SOURCES.has(source);
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
 * Use the dark title poster only when there is no image, or the scraper
 * source is explicitly blocked.
 */
export function shouldUseSymbolicEventImage(
  source: string | null | undefined,
  imageUrl?: string | null,
): boolean {
  if (!imageUrl) return true;
  if (isStockImageUrl(imageUrl)) return false;
  if (isScrapedSource(source) && isScrapedImageBlocked(source)) return true;
  return false;
}

/** Safe to expose image_url in UI / Open Graph / media proxy. */
export function canShowEventImage(
  source: string | null | undefined,
  imageUrl: string | null | undefined,
): boolean {
  if (!imageUrl) return false;
  if (isStockImageUrl(imageUrl)) return true;
  if (isScrapedSource(source) && isScrapedImageBlocked(source)) return false;
  return true;
}
