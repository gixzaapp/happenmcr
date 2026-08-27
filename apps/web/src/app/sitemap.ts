import type { MetadataRoute } from "next";
import { buildEventPath, type Event } from "@happenmcr/types";
import { getAllEvents, listIndexableCategories, listIndexableVenues } from "@/lib/api";
import { getSiteUrl } from "@/lib/config";
import { londonDateHorizon, londonYmd } from "@/lib/format";
import { listMcrBuzzSections, mcrBuzzPath } from "@/lib/mcr-buzz";
import { MCR_ON_LENS_MAP_PATH, MCR_ON_LENS_PATH } from "@/lib/mcr-on-lens";
import { DATE_ISR_HORIZON_DAYS } from "@/lib/rendering";

/**
 * Regenerate sitemap hourly from live API data so <lastmod> tracks content
 * changes, not a one-off build timestamp.
 */
export const revalidate = 3_600;

function absoluteUrl(path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, getSiteUrl()).toString();
}

/** Latest event start among a set — used as listing-page lastmod signal. */
function latestEventDate(events: Event[], fallback: Date): Date {
  let latest = 0;
  for (const event of events) {
    const ms = new Date(event.start_time).getTime();
    if (Number.isFinite(ms) && ms > latest) latest = ms;
  }
  return latest > 0 ? new Date(latest) : fallback;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const events = await getAllEvents();
  const categories = listIndexableCategories(events);
  const venues = listIndexableVenues(events);
  const catalogLastMod = latestEventDate(events, generatedAt);

  const todayYmd = londonYmd();
  const todayEvents = events.filter((event) => {
    const start = new Date(event.start_time);
    if (Number.isNaN(start.getTime())) return false;
    return londonYmd(start) === todayYmd;
  });
  const freeEvents = events.filter((event) => event.is_free);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: catalogLastMod,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/events/today"),
      lastModified: latestEventDate(todayEvents, generatedAt),
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/events/weekend"),
      lastModified: catalogLastMod,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/events/free"),
      lastModified: latestEventDate(freeEvents, generatedAt),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/community"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    // /search is noindex (tool page) — omit from sitemap.
    {
      url: absoluteUrl("/submit-event"),
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/mcr-buzz"),
      lastModified: catalogLastMod,
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: absoluteUrl(MCR_ON_LENS_PATH),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: absoluteUrl(MCR_ON_LENS_MAP_PATH),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const mcrBuzzPages: MetadataRoute.Sitemap = listMcrBuzzSections().map(
    (section) => ({
      url: absoluteUrl(mcrBuzzPath(section.slug)),
      lastModified: catalogLastMod,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }),
  );

  // Prefer sitemap generation time when the event is still upcoming — reflects
  // re-ingest / listing presence rather than a stale one-off build stamp.
  const eventPages: MetadataRoute.Sitemap = events.map((event) => {
    const start = new Date(event.start_time);
    const startMs = start.getTime();
    const lastModified =
      Number.isFinite(startMs) && startMs > generatedAt.getTime()
        ? generatedAt
        : Number.isFinite(startMs)
          ? start
          : generatedAt;

    return {
      url: absoluteUrl(buildEventPath(event)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    };
  });

  const venuePages: MetadataRoute.Sitemap = venues.map((venue) => ({
    url: absoluteUrl(`/venue/${venue.slug}`),
    lastModified: catalogLastMod,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    lastModified: catalogLastMod,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const datePages: MetadataRoute.Sitemap = londonDateHorizon(
    DATE_ISR_HORIZON_DAYS,
  ).map((ymd) => ({
    url: absoluteUrl(`/events/date/${ymd}`),
    lastModified: ymd === todayYmd ? generatedAt : catalogLastMod,
    changeFrequency: "daily" as const,
    priority: ymd === todayYmd ? 0.85 : 0.55,
  }));

  // Ensure unique URLs (venue slug collisions collapse by path).
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [
    ...staticPages,
    ...mcrBuzzPages,
    ...eventPages,
    ...venuePages,
    ...categoryPages,
    ...datePages,
  ]) {
    byUrl.set(entry.url, entry);
  }

  return [...byUrl.values()];
}
