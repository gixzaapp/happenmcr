import type { MetadataRoute } from "next";
import { buildEventPath, getEventCategory, type Event } from "@happenmcr/types";
import { getAllEvents, listIndexableCategories, listIndexableVenues } from "@/lib/api";
import { getSiteUrl } from "@/lib/config";
import { londonDateHorizon, londonYmd } from "@/lib/format";
import { getLensPhotos } from "@/lib/lens-photos";
import { listMcrBuzzSections, mcrBuzzPath } from "@/lib/mcr-buzz";
import { MCR_HISTORY_PATH, MCR_HISTORY_PUBLISHED } from "@/lib/mcr-history";
import {
  latestLensPhotoDate,
  MCR_ON_LENS_MAP_PATH,
  MCR_ON_LENS_PATH,
} from "@/lib/mcr-on-lens";
import { DATE_ISR_HORIZON_DAYS } from "@/lib/rendering";
import { WHATS_ON_MANCHESTER_PATH } from "@/lib/seo";

/**
 * Regenerate sitemap hourly from live API data so <lastmod> tracks content
 * changes, not a one-off build timestamp.
 */
export const revalidate = 3_600;

/**
 * Intentionally omitted (noindex / utility — do not add):
 * - /search
 * - /login
 * - /mcr-buzz/mcr-on-lens/upload
 * - /getmethevisitorcount
 * - /auth/*
 */
const EVENTS_TODAY_PATH = "/events/today";
const EVENTS_WEEKEND_PATH = "/events/weekend";
const EVENTS_FREE_PATH = "/events/free";
const COMMUNITY_PATH = "/community";
const SUBMIT_EVENT_PATH = "/submit-event";
const MCR_BUZZ_HUB_PATH = "/mcr-buzz";
const PRIVACY_PATH = "/privacy";

function absoluteUrl(path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, getSiteUrl()).toString();
}

/** Latest event start among a set — used for category/venue/date lastmod. */
function latestEventDate(events: Event[], fallback: Date): Date {
  let latest = 0;
  for (const event of events) {
    const ms = new Date(event.start_time).getTime();
    if (Number.isFinite(ms) && ms > latest) latest = ms;
  }
  return latest > 0 ? new Date(latest) : fallback;
}

function historyLastModified(fallback: Date): Date {
  const published = new Date(`${MCR_HISTORY_PUBLISHED}T00:00:00.000Z`);
  return Number.isNaN(published.getTime()) ? fallback : published;
}

/** Group upcoming events by curated category id (live-music, nightlife, …). */
function eventsByCuratedCategory(events: Event[]): Map<string, Event[]> {
  const bySlug = new Map<string, Event[]>();
  for (const event of events) {
    if (!event.category) continue;
    const curated = getEventCategory(event.category);
    if (!curated || curated.id === "other") continue;
    const list = bySlug.get(curated.id);
    if (list) list.push(event);
    else bySlug.set(curated.id, [event]);
  }
  return bySlug;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const [events, lensPhotos] = await Promise.all([
    getAllEvents({ cache: "no-store" }),
    getLensPhotos(),
  ]);
  const lensLastMod = latestLensPhotoDate(lensPhotos) ?? generatedAt;
  const categories = listIndexableCategories(events);
  const venues = listIndexableVenues(events);
  const catalogLastMod = latestEventDate(events, generatedAt);
  const historyLastMod = historyLastModified(generatedAt);
  const categoryEventMap = eventsByCuratedCategory(events);

  const todayYmd = londonYmd();

  /**
   * Hub / browse pages use sitemap generation time as lastmod.
   * Avoid event start times here — they can surface as stale “X days ago”
   * signals in Google SERPs for evergreen listing URLs.
   */
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl(WHATS_ON_MANCHESTER_PATH),
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl(EVENTS_TODAY_PATH),
      lastModified: generatedAt,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: absoluteUrl(EVENTS_WEEKEND_PATH),
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl(EVENTS_FREE_PATH),
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl(COMMUNITY_PATH),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl(SUBMIT_EVENT_PATH),
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl(MCR_BUZZ_HUB_PATH),
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: absoluteUrl(MCR_HISTORY_PATH),
      lastModified: historyLastMod,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: absoluteUrl(MCR_ON_LENS_PATH),
      lastModified: lensLastMod,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: absoluteUrl(MCR_ON_LENS_MAP_PATH),
      lastModified: lensLastMod,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: absoluteUrl(PRIVACY_PATH),
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const mcrBuzzPages: MetadataRoute.Sitemap = listMcrBuzzSections().map(
    (section) => ({
      url: absoluteUrl(mcrBuzzPath(section.slug)),
      lastModified: generatedAt,
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
    lastModified: latestEventDate(
      categoryEventMap.get(category.slug) ?? [],
      generatedAt,
    ),
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
