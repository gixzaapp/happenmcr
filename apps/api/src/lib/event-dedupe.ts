/**
 * Cross-source event fingerprinting.
 * Same show from Ticketmaster + a venue scraper should collapse to one row.
 */

const LONDON = "Europe/London";

export function londonYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Lowercase alphanumerics only — "Deep Purple!" → "deeppurple". */
export function normalizeEventText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * community > venue scrapers > ticket APIs.
 * Higher wins when two rows match.
 */
export function sourceRank(source: string | null | undefined): number {
  if (!source) return 0;
  if (source === "community") return 100;
  if (source.startsWith("scraper:")) return 50;
  return 10;
}

/** title|venue|YYYY-MM-DD (London). Empty venue still keys on title+day. */
export function eventFingerprint(
  title: string,
  venueName: string | null | undefined,
  startTime: Date,
): string {
  const day = londonYmd(startTime);
  const titleKey = normalizeEventText(title);
  const venueKey = normalizeEventText(venueName);
  return `${titleKey}|${venueKey}|${day}`;
}

export function fingerprintsMatch(
  a: { title: string; venueName?: string | null; startTime: Date },
  b: { title: string; venueName?: string | null; startTime: Date },
): boolean {
  const aTitle = normalizeEventText(a.title);
  const bTitle = normalizeEventText(b.title);
  if (!aTitle || !bTitle || aTitle !== bTitle) return false;
  if (londonYmd(a.startTime) !== londonYmd(b.startTime)) return false;

  const aVenue = normalizeEventText(a.venueName);
  const bVenue = normalizeEventText(b.venueName);
  // If either side has no venue, title+day is enough.
  if (!aVenue || !bVenue) return true;
  return aVenue === bVenue;
}
