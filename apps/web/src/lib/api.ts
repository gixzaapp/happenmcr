import type {
  ApiResponse,
  CategoryEventsResponse,
  CategoryInfo,
  Event,
} from "@happenmcr/types";
import {
  getEventCategory,
  slugifyCategory,
  slugifyVenue,
} from "@happenmcr/types";
import { getApiBaseUrl, REVALIDATE_SECONDS } from "./config";

/** Minimum upcoming events before a curated category is sitemap'd / indexed. */
export const MIN_CATEGORY_EVENTS_FOR_INDEX = 3;

type FetchEventsOptions = {
  /** ISR window in seconds. Use `"no-store"` for SSR search (and similar). */
  cache?: number | "no-store";
};

async function fetchEvents(
  path: string,
  options: FetchEventsOptions = {},
): Promise<Event[]> {
  const url = `${getApiBaseUrl()}${path}`;
  const init: RequestInit =
    options.cache === "no-store"
      ? { cache: "no-store" }
      : { next: { revalidate: options.cache ?? REVALIDATE_SECONDS } };

  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      console.error(`[api] ${url} failed with ${response.status}`);
      return [];
    }

    const body = (await response.json()) as ApiResponse<Event[]>;
    return body.data ?? [];
  } catch (error) {
    console.error(`[api] ${url} request failed`, error);
    return [];
  }
}

export function getAllEvents(
  options: FetchEventsOptions = {},
): Promise<Event[]> {
  return fetchEvents("/events", options);
}

export function getTodayEvents(): Promise<Event[]> {
  return fetchEvents("/events/today");
}

export function getWeekendEvents(): Promise<Event[]> {
  return fetchEvents("/events/weekend");
}

export function getFreeEvents(): Promise<Event[]> {
  return fetchEvents("/events/free");
}

export function getEventsByDate(ymd: string): Promise<Event[]> {
  const date = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Promise.resolve([]);
  return fetchEvents(`/events/date/${encodeURIComponent(date)}`);
}

/** Search is SSR'd — never serve stale query results from the Data Cache. */
export function getSearchEvents(query: string): Promise<Event[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);
  return fetchEvents(`/events/search?q=${encodeURIComponent(q)}`, {
    cache: "no-store",
  });
}

export async function getEventById(
  id: string,
  options: FetchEventsOptions = {},
): Promise<Event | null> {
  const url = `${getApiBaseUrl()}/events/${encodeURIComponent(id)}`;
  const init: RequestInit =
    options.cache === "no-store"
      ? { cache: "no-store" }
      : { next: { revalidate: options.cache ?? REVALIDATE_SECONDS } };

  try {
    const response = await fetch(url, init);

    if (response.status === 404) return null;

    if (!response.ok) {
      console.error(`[api] ${url} failed with ${response.status}`);
      return null;
    }

    const body = (await response.json()) as ApiResponse<Event>;
    return body.data ?? null;
  } catch (error) {
    console.error(`[api] ${url} request failed`, error);
    return null;
  }
}

export type CategoryEventsResult = {
  category: CategoryInfo;
  events: Event[];
};

export async function getCategoryEvents(
  slug: string,
): Promise<CategoryEventsResult | null> {
  const url = `${getApiBaseUrl()}/events/category/${encodeURIComponent(slug)}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      console.error(`[api] ${url} failed with ${response.status}`);
      return null;
    }

    const body = (await response.json()) as CategoryEventsResponse;
    if (!body.category) return null;

    return {
      category: body.category,
      events: body.data ?? [],
    };
  } catch (error) {
    console.error(`[api] ${url} request failed`, error);
    return null;
  }
}

/** Unique categories from a list of events, sorted by name. */
export function listCategories(events: Event[]): CategoryInfo[] {
  const bySlug = new Map<string, CategoryInfo>();

  for (const event of events) {
    if (!event.category) continue;
    const slug = slugifyCategory(event.category);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, { slug, name: event.category });
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** True when the slug is one of HappenMCR's curated categories (not scraper tags). */
export function isCuratedCategorySlug(slug: string): boolean {
  const curated = getEventCategory(slug);
  return Boolean(curated && curated.id !== "other");
}

/**
 * Curated categories that currently have enough events to deserve indexing.
 * Stops the sitemap flooding Google with thin scraper tags (/category/blues, etc.).
 */
export function listIndexableCategories(events: Event[]): CategoryInfo[] {
  const counts = new Map<string, { info: CategoryInfo; count: number }>();

  for (const event of events) {
    if (!event.category) continue;
    const curated = getEventCategory(event.category);
    if (!curated || curated.id === "other") continue;

    const slug = curated.id;
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(slug, {
      info: { slug, name: curated.label },
      count: 1,
    });
  }

  return [...counts.values()]
    .filter((entry) => entry.count >= MIN_CATEGORY_EVENTS_FOR_INDEX)
    .map((entry) => entry.info)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Whether this category listing should be indexed (curated + enough events). */
export function isIndexableCategory(
  slug: string,
  eventCount: number,
): boolean {
  const curated = getEventCategory(slug);
  if (!curated || curated.id === "other") return false;
  return eventCount >= MIN_CATEGORY_EVENTS_FOR_INDEX;
}

/** Minimum events at a venue before the hub is sitemap'd / indexed. */
export const MIN_VENUE_EVENTS_FOR_INDEX = 2;

export type VenueInfo = {
  slug: string;
  name: string;
  count: number;
};

/** Venues with enough listings to earn an indexed hub page. */
export function listIndexableVenues(events: Event[]): VenueInfo[] {
  const bySlug = new Map<string, VenueInfo>();

  for (const event of events) {
    const name = event.venue_name?.trim();
    if (!name) continue;
    const slug = slugifyVenue(name);
    if (!slug) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += 1;
      continue;
    }
    bySlug.set(slug, { slug, name, count: 1 });
  }

  return [...bySlug.values()]
    .filter((venue) => venue.count >= MIN_VENUE_EVENTS_FOR_INDEX)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isIndexableVenue(eventCount: number): boolean {
  return eventCount >= MIN_VENUE_EVENTS_FOR_INDEX;
}

/** Soonest upcoming events within the next few days. */
export function pickTrending(
  events: Event[],
  {
    limit = 6,
    days = 5,
    now = new Date(),
  }: { limit?: number; days?: number; now?: Date } = {},
): Event[] {
  const start = now.getTime();
  const end = start + days * 24 * 60 * 60 * 1000;

  return events
    .filter((event) => {
      const time = new Date(event.start_time).getTime();
      return Number.isFinite(time) && time >= start && time <= end;
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )
    .slice(0, limit);
}
