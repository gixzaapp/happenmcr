import type { Event } from "@happenmcr/types";

/**
 * Registry entry for an MCR Buzz child page.
 * Add a new child by appending one object — nav, hub, sitemap, and
 * `/mcr-buzz/[slug]` all derive from this list.
 */
export type McrBuzzSection = {
  /** Stable section id (also used for `mcr-buzz:{id}` event tags). */
  id: string;
  /** URL segment under `/mcr-buzz/`. Defaults to `id` when omitted. */
  slug?: string;
  label: string;
  description: string;
  /** Match local events via title/description/category/tags. */
  keywords: string[];
  /** Show in the MCR Buzz nav dropdown. Default true. */
  showInNav?: boolean;
  /** Sort order ascending. Default: registry order. */
  order?: number;
};

/** Pure-local feeds allowed on MCR Buzz pages. */
const LOCAL_SOURCES = new Set([
  "community",
  "scraper:manchester-city-council",
  "scraper:university-of-manchester",
  "scraper:manchester-met",
  "scraper:university-of-salford",
  "scraper:university-of-greater-manchester",
  "scraper:rncm",
]);

/**
 * Single source of truth for MCR Buzz children.
 * To add a page: append an entry — redeploy regenerates routes/nav/sitemap.
 */
const MCR_BUZZ_SECTION_DEFS: McrBuzzSection[] = [
  {
    id: "sports",
    label: "Sports",
    description:
      "Local sport, fitness and active days from Manchester organisers and the city calendar.",
    keywords: [
      "sport",
      "sports",
      "fitness",
      "football",
      "rugby",
      "cricket",
      "running",
      "parkrun",
      "athletics",
      "match",
      "tournament",
      "swim",
      "cycling",
      "leisure",
    ],
  },
  {
    id: "charity",
    label: "Charity",
    description:
      "Homegrown charity, fundraising and volunteering events around Greater Manchester.",
    keywords: [
      "charity",
      "charities",
      "fundraiser",
      "fundraising",
      "fund raising",
      "cause",
      "nonprofit",
      "non-profit",
      "volunteer",
      "volunteering",
      "donation",
      "benefit",
    ],
  },
  {
    id: "student",
    label: "Student",
    description:
      "Campus, societies and university calendar events across Manchester — including UoM, MMU, Salford, Greater Manchester and RNCM.",
    keywords: [
      "student",
      "students",
      "university",
      "uni",
      "campus",
      "freshers",
      "students' union",
      "students union",
      "society",
      "societies",
    ],
  },
  {
    id: "food-drink",
    label: "Food & Drink",
    description:
      "Local tastings, pop-ups, food markets and hospitality happenings from Manchester organisers and the city calendar.",
    keywords: [
      "food",
      "drink",
      "food & drink",
      "food and drink",
      "dining",
      "restaurant",
      "brunch",
      "supper",
      "tasting",
      "tastings",
      "culinary",
      "street food",
      "food market",
      "farmers market",
      "pop-up",
      "popup",
      "brewery",
      "cocktail",
      "wine",
      "beer",
      "coffee",
      "hospitality",
    ],
  },
];

export type ResolvedMcrBuzzSection = McrBuzzSection & {
  slug: string;
};

function resolveSection(section: McrBuzzSection, index: number): ResolvedMcrBuzzSection {
  const slug = (section.slug ?? section.id).trim().toLowerCase();
  return {
    ...section,
    id: section.id.trim().toLowerCase(),
    slug,
    showInNav: section.showInNav !== false,
    order: section.order ?? index,
  };
}

function sortSections(sections: ResolvedMcrBuzzSection[]): ResolvedMcrBuzzSection[] {
  return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** All registered sections, sorted. */
export const MCR_BUZZ_SECTIONS: ResolvedMcrBuzzSection[] = sortSections(
  MCR_BUZZ_SECTION_DEFS.map(resolveSection),
);

const sectionsBySlug = new Map(
  MCR_BUZZ_SECTIONS.map((section) => [section.slug, section]),
);
const sectionsById = new Map(
  MCR_BUZZ_SECTIONS.map((section) => [section.id, section]),
);

export function listMcrBuzzSections(): ResolvedMcrBuzzSection[] {
  return MCR_BUZZ_SECTIONS;
}

/** Sections shown in the header/mobile dropdown. */
export function listMcrBuzzNavSections(): ResolvedMcrBuzzSection[] {
  return MCR_BUZZ_SECTIONS.filter((section) => section.showInNav !== false);
}

export function getMcrBuzzSection(slugOrId: string): ResolvedMcrBuzzSection | null {
  const key = slugOrId.trim().toLowerCase();
  return sectionsBySlug.get(key) ?? sectionsById.get(key) ?? null;
}

export function isMcrBuzzSlug(slug: string): boolean {
  return sectionsBySlug.has(slug.trim().toLowerCase());
}

export function mcrBuzzPath(slugOrId: string): string {
  const section = getMcrBuzzSection(slugOrId);
  return `/mcr-buzz/${section?.slug ?? slugOrId.trim().toLowerCase()}`;
}

export function mcrBuzzSiblingLinks(
  currentId: string,
  options?: { includeHub?: boolean },
): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  if (options?.includeHub !== false) {
    links.push({ href: "/mcr-buzz", label: "All MCR Buzz" });
  }
  for (const section of MCR_BUZZ_SECTIONS) {
    if (section.id === currentId) continue;
    links.push({ href: mcrBuzzPath(section.slug), label: section.label });
  }
  return links;
}

/** Short list of labels for hub copy, e.g. "sports, charity and student". */
export function mcrBuzzLabelList(): string {
  const labels = MCR_BUZZ_SECTIONS.map((section) => section.label.toLowerCase());
  if (labels.length === 0) return "local";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

export function isLocalMcrBuzzSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return LOCAL_SOURCES.has(source);
}

function eventHaystack(event: Event): string {
  return [
    event.title,
    event.description ?? "",
    event.category ?? "",
    event.venue_name ?? "",
    ...event.tags,
  ]
    .join("\n")
    .toLowerCase();
}

export function eventMatchesMcrBuzzSection(
  event: Event,
  section: ResolvedMcrBuzzSection,
): boolean {
  if (!isLocalMcrBuzzSource(event.source)) return false;

  // Explicit section markers from ingest / organisers
  const tags = event.tags.map((tag) => tag.toLowerCase());
  if (
    tags.includes(`mcr-buzz:${section.id}`) ||
    tags.includes(section.id) ||
    tags.includes(section.slug) ||
    tags.includes(section.label.toLowerCase())
  ) {
    return true;
  }

  const haystack = eventHaystack(event);
  return section.keywords.some((keyword) => haystack.includes(keyword));
}

/** Upcoming local events for a Buzz section, chronological. */
export function filterMcrBuzzEvents(
  events: Event[],
  section: ResolvedMcrBuzzSection,
  now = new Date(),
): Event[] {
  return events
    .filter((event) => {
      if (!eventMatchesMcrBuzzSection(event, section)) return false;
      const start = new Date(event.start_time);
      return (
        !Number.isNaN(start.getTime()) &&
        start.getTime() >= now.getTime() - 3_600_000
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
}
