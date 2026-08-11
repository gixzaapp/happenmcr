/** Common English stopwords removed from SEO slugs. */
import { getEventCategory } from "./categories";

export const SLUG_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "nor",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "into",
  "over",
  "under",
  "about",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "via",
  "vs",
  "versus",
  "feat",
  "ft",
  "etc",
  "de",
  "la",
  "le",
  "el",
]);

/** Prisma CUID-style ids used in Happening event URLs. */
export const EVENT_ID_PATTERN = /^c[a-z0-9]{20,32}$/i;

export type SlugifyOptions = {
  /** Strip stopwords (default true). */
  removeStopwords?: boolean;
  /** Max slug length (default 80). */
  maxLength?: number;
};

/**
 * SEO-friendly slug: lowercase, hyphens, no special chars, optional stopword removal.
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
  const removeStopwords = options.removeStopwords !== false;
  const maxLength = options.maxLength ?? 80;

  let text = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  text = text.toLowerCase();
  text = text.replace(/&/g, " and ");
  text = text.replace(/[''`]/g, "");
  text = text.replace(/[^a-z0-9]+/g, " ");

  let tokens = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (removeStopwords) {
    const filtered = tokens.filter((token) => !SLUG_STOPWORDS.has(token));
    if (filtered.length > 0) tokens = filtered;
  }

  let slug = tokens.join("-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(/-+$/g, "");
  }

  return slug || "item";
}

/** Category labels → URL slug (e.g. "Live music" → "live-music"). */
export function slugifyCategory(category: string): string {
  return slugify(category);
}

/** Venue names → URL slug (e.g. "O2 Ritz Manchester" → "o2-ritz-manchester"). */
export function slugifyVenue(venueName: string): string {
  return slugify(venueName);
}

/** Event titles → SEO slug segment (without the id). */
export function slugifyEvent(title: string, venueName?: string | null): string {
  const titleSlug = slugify(title);
  if (!venueName?.trim()) return titleSlug;

  // Append venue when the title alone is very short / generic.
  if (titleSlug.length >= 16) return titleSlug;

  const withVenue = slugify(`${title} ${venueName}`);
  return withVenue || titleSlug;
}

/** Canonical event path: `/events/{slug}-{id}`. */
export function buildEventPath(
  event: { id: string; title: string; venue_name?: string | null },
): string {
  const slug = slugifyEvent(event.title, event.venue_name);
  return `/events/${slug}-${event.id}`;
}

/** Canonical venue path: `/venue/{slug}`. */
export function buildVenuePath(venueName: string): string {
  return `/venue/${slugifyVenue(venueName)}`;
}

/** Canonical category path: `/category/{slug}`. */
export function buildCategoryPath(category: string): string {
  return `/category/${slugifyCategory(category)}`;
}

/**
 * Parse `/events/{slug}-{id}` (or legacy bare `{id}`) segments.
 */
export function parseEventPathSegment(
  segment: string,
): { id: string; slug: string } | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;

  if (EVENT_ID_PATTERN.test(trimmed)) {
    return { id: trimmed, slug: "" };
  }

  const match = trimmed.match(/^(.*?)-+(c[a-z0-9]{20,32})$/i);
  if (!match?.[1] || !match[2]) return null;

  return { slug: match[1], id: match[2] };
}

/**
 * True when a category label matches a URL slug (current, alias, or legacy form).
 */
export function categoryMatchesSlug(category: string, slug: string): boolean {
  const needle = slug.trim().toLowerCase();
  if (!needle) return false;
  if (slugifyCategory(category) === needle) return true;
  if (slugify(category, { removeStopwords: false }) === needle) return true;

  // Curated aliases: /category/electronic should match Nightlife events, etc.
  const curated = getEventCategory(needle) ?? getEventCategory(category);
  if (!curated) return false;
  if (curated.id === needle) return true;
  if (curated.aliases.includes(needle)) return true;
  return slugifyCategory(curated.label) === needle;
}
