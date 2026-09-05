/** HappenMCR Skiddle affiliate tracking tag. */
export const SKIDDLE_AFFILIATE_TAG = "15821";

/**
 * Append `sktag` to Skiddle ticket URLs for affiliate tracking.
 * Non-Skiddle and invalid URLs are returned unchanged (never throws).
 */
export function withSkiddleTag(url: string): string {
  if (!url || typeof url !== "string") return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname.toLowerCase();
  const isSkiddle =
    host === "skiddle.com" || host.endsWith(".skiddle.com");
  if (!isSkiddle) return url;

  parsed.searchParams.set("sktag", SKIDDLE_AFFILIATE_TAG);
  return parsed.toString();
}
