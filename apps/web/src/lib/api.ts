import type {
  ApiResponse,
  CategoryEventsResponse,
  CategoryInfo,
  Event,
} from "@happenmcr/types";
import { slugifyCategory } from "@happenmcr/types";
import { getApiBaseUrl, REVALIDATE_SECONDS } from "./config";

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
