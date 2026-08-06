const DEFAULT_API_URL = "http://localhost:4000";
const DEFAULT_SITE_URL = "https://happenmcr.com";

/** ISR / fetch cache window — 10 minutes (matches ingestion cron). */
export const REVALIDATE_SECONDS = 600;

export function getApiBaseUrl(): string {
  return (
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    DEFAULT_API_URL
  );
}

/** Public site origin used for canonical + Open Graph URLs. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    DEFAULT_SITE_URL
  );
}
