import type { Event } from "@happenmcr/types";

/** MCR Buzz nav shortcuts — prefer local listings over marketplaces. */
const MCR_BUZZ_QUERIES = new Set(["charity", "sports", "student"]);

/**
 * Extra tokens that should match when a nav/search shorthand is used
 * (e.g. MCR Buzz → Charity → ?q=charity).
 */
const QUERY_SYNONYMS: Record<string, string[]> = {
  charity: [
    "charity",
    "charities",
    "fundraiser",
    "fundraising",
    "fund raising",
    "cause",
    "causes",
    "nonprofit",
    "non-profit",
    "non profit",
    "volunteer",
    "volunteering",
    "donation",
    "donations",
    "benefit",
  ],
  sports: [
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
  ],
  student: [
    "student",
    "students",
    "university",
    "uni",
    "campus",
    "freshers",
    "students' union",
    "students union",
  ],
  festival: ["festival", "festivals", "fest"],
};

function needlesForQuery(query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const synonyms = QUERY_SYNONYMS[needle];
  if (synonyms) return synonyms;

  for (const group of Object.values(QUERY_SYNONYMS)) {
    if (group.includes(needle)) return group;
  }

  return [needle];
}

/** True for MCR Buzz dropdown queries (Sports / Charity / Student). */
export function isMcrBuzzQuery(query: string): boolean {
  return MCR_BUZZ_QUERIES.has(query.trim().toLowerCase());
}

/** Exclude marketplace feeds from MCR Buzz so results feel more local. */
export function isExcludedFromMcrBuzz(event: Event): boolean {
  const source = (event.source ?? "").toLowerCase();
  return source === "eventbrite";
}

/** Case-insensitive match across common event text fields (+ synonym groups). */
export function eventMatchesQuery(event: Event, query: string): boolean {
  const needles = needlesForQuery(query);
  if (needles.length === 0) return false;

  const haystack = [
    event.title,
    event.description ?? "",
    event.venue_name ?? "",
    event.venue_address ?? "",
    event.category ?? "",
    event.source ?? "",
    ...event.tags,
  ]
    .join("\n")
    .toLowerCase();

  return needles.some((token) => haystack.includes(token));
}
