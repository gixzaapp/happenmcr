/**
 * Next.js rendering policy for SEO-critical pages.
 *
 * - Event / venue / category / date / timing browse → ISR (HTML at build or
 *   first request, regenerated every REVALIDATE_SECONDS).
 * - Search results → SSR (force-dynamic) so query HTML is always fresh for crawlers.
 */
export { REVALIDATE_SECONDS } from "./config";

/** Calendar dates pre-rendered for `/events/date/[ymd]` (matches sitemap). */
export const DATE_ISR_HORIZON_DAYS = 90;
