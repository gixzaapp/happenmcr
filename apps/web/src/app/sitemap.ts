import type { MetadataRoute } from "next";
import { buildEventPath, buildVenuePath } from "@happenmcr/types";
import { getAllEvents, listCategories } from "@/lib/api";
import { getSiteUrl } from "@/lib/config";
import { londonDateHorizon, londonYmd } from "@/lib/format";
import { DATE_ISR_HORIZON_DAYS } from "@/lib/rendering";

/** Regenerate the sitemap once per day. */
export const revalidate = 86_400;

function absoluteUrl(path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, getSiteUrl()).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const events = await getAllEvents();
  const categories = listCategories(events);

  const venueNames = new Set<string>();
  for (const event of events) {
    if (!event.venue_name?.trim()) continue;
    venueNames.add(event.venue_name.trim());
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/events/today"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/events/weekend"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/events/free"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/community"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/search"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: absoluteUrl(buildEventPath(event)),
    lastModified: new Date(event.start_time),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const venuePages: MetadataRoute.Sitemap = [...venueNames]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      url: absoluteUrl(buildVenuePath(name)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const datePages: MetadataRoute.Sitemap = londonDateHorizon(
    DATE_ISR_HORIZON_DAYS,
  ).map((ymd) => ({
    url: absoluteUrl(`/events/date/${ymd}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: ymd === londonYmd() ? 0.85 : 0.55,
  }));

  // Ensure unique URLs (venue slug collisions collapse by path).
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [
    ...staticPages,
    ...eventPages,
    ...venuePages,
    ...categoryPages,
    ...datePages,
  ]) {
    byUrl.set(entry.url, entry);
  }

  return [...byUrl.values()];
}
