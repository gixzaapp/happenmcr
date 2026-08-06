/** Shared alt-text helpers for SEO / a11y. */

/** Descriptive alt for a standalone event photo (e.g. detail hero). */
export function eventImageAlt(
  title: string,
  venue?: string | null,
): string {
  const trimmed = title.trim() || "Event";
  const place = venue?.trim();
  return place ? `${trimmed} at ${place}` : trimmed;
}
