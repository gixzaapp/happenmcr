import type { Event } from "@happenmcr/types";
import {
  buildCategoryPath,
  buildVenuePath,
  slugifyCategory,
  slugifyVenue,
} from "@happenmcr/types";
import type { ExploreMoreLink } from "./ExploreMoreLinks";

const WHEN_LINKS: ExploreMoreLink[] = [
  { href: "/events/today", label: "Events today" },
  { href: "/events/weekend", label: "Events this weekend" },
];

/** Unique category links from a set of events. */
export function categoryLinksFromEvents(
  events: Event[],
  { limit = 12 }: { limit?: number } = {},
): ExploreMoreLink[] {
  const bySlug = new Map<string, ExploreMoreLink>();

  for (const event of events) {
    if (!event.category) continue;
    const slug = slugifyCategory(event.category);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      href: buildCategoryPath(event.category),
      label: event.category,
    });
    if (bySlug.size >= limit) break;
  }

  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Unique venue links from a set of events. */
export function venueLinksFromEvents(
  events: Event[],
  { limit = 16 }: { limit?: number } = {},
): ExploreMoreLink[] {
  const bySlug = new Map<string, ExploreMoreLink>();

  for (const event of events) {
    if (!event.venue_name?.trim()) continue;
    const slug = slugifyVenue(event.venue_name);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      href: buildVenuePath(event.venue_name),
      label: event.venue_name,
    });
    if (bySlug.size >= limit) break;
  }

  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function eventExploreLinks(event: Event): ExploreMoreLink[] {
  const links: ExploreMoreLink[] = [...WHEN_LINKS];

  if (event.venue_name) {
    links.unshift({
      href: buildVenuePath(event.venue_name),
      label: event.venue_name,
    });
  }

  if (event.category) {
    links.splice(event.venue_name ? 1 : 0, 0, {
      href: buildCategoryPath(event.category),
      label: `${event.category} events`,
    });
  }

  return links;
}

export function venueExploreLinks(
  venueName: string,
  venueEvents: Event[],
): ExploreMoreLink[] {
  return [
    ...WHEN_LINKS,
    ...categoryLinksFromEvents(venueEvents),
    {
      href: `${buildVenuePath(venueName)}#events`,
      label: `All events at ${venueName}`,
    },
  ];
}

export function categoryExploreLinks(
  categoryName: string,
  categoryEvents: Event[],
): ExploreMoreLink[] {
  return [
    ...WHEN_LINKS,
    {
      href: buildCategoryPath(categoryName),
      label: `All ${categoryName} events`,
    },
    ...venueLinksFromEvents(categoryEvents),
  ];
}
