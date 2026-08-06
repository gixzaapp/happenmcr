import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { fetchEventbriteEvents } from "./sources/eventbrite.js";
import { fetchMeetupEvents } from "./sources/meetup.js";
import { fetchSkiddleEvents } from "./sources/skiddle.js";
import { fetchTicketmasterEvents } from "./sources/ticketmaster.js";
import { runVenueScrapers } from "./scrapers/index.js";

/** Loose payload from any upstream API or scraper before normalisation. */
export type RawEventInput = {
  title?: unknown;
  name?: unknown;
  description?: unknown;
  start_time?: unknown;
  startTime?: unknown;
  start?: unknown;
  end_time?: unknown;
  endTime?: unknown;
  end?: unknown;
  venue_name?: unknown;
  venueName?: unknown;
  venue?: unknown;
  venue_address?: unknown;
  venueAddress?: unknown;
  address?: unknown;
  lat?: unknown;
  latitude?: unknown;
  lon?: unknown;
  lng?: unknown;
  longitude?: unknown;
  category?: unknown;
  tags?: unknown;
  source: string;
  source_url?: unknown;
  sourceUrl?: unknown;
  url?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  image?: unknown;
  ticket_url?: unknown;
  ticketUrl?: unknown;
  tickets?: unknown;
  is_free?: unknown;
  isFree?: unknown;
  free?: unknown;
  price?: unknown;
};

export type NormalisedEvent = Prisma.EventCreateInput;

export type AggregationResult = {
  fetchedFromApis: number;
  fetchedFromScrapers: number;
  normalised: number;
  skipped: number;
  upserted: number;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (["true", "1", "yes", "free"].includes(normalised)) return true;
    if (["false", "0", "no", "paid"].includes(normalised)) return false;
  }
  if (typeof value === "number") {
    if (value === 0) return true;
    if (value > 0) return false;
  }
  return null;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item): item is string => item !== null);
  }

  const single = asString(value);
  if (!single) return [];

  return single
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = asString(value);
    if (parsed) return parsed;
  }
  return null;
}

function firstDate(...values: unknown[]): Date | null {
  for (const value of values) {
    const parsed = asDate(value);
    if (parsed) return parsed;
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

/**
 * Pull events from configured third-party APIs.
 * Source adapters register here as they are added.
 */
export async function fetchFromAPIs(): Promise<RawEventInput[]> {
  const fetchers: Array<() => Promise<RawEventInput[]>> = [
    fetchEventbriteEvents,
    fetchSkiddleEvents,
    fetchMeetupEvents,
    fetchTicketmasterEvents,
  ];

  const batches = await Promise.allSettled(fetchers.map((fetch) => fetch()));

  return batches.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`[aggregator] API source ${index} failed`, result.reason);
    return [];
  });
}

/**
 * Pull events from HTML / feed scrapers.
 * Scraper adapters register here as they are added.
 */
export async function fetchFromScrapers(): Promise<RawEventInput[]> {
  return runVenueScrapers();
}

/**
 * Map a raw upstream payload onto the unified Event shape.
 * Returns null when required fields (title, start time) are missing.
 */
export function normaliseEvent(raw: RawEventInput): NormalisedEvent | null {
  const title = firstString(raw.title, raw.name);
  const startTime = firstDate(raw.start_time, raw.startTime, raw.start);

  if (!title || !startTime) {
    return null;
  }

  const source = asString(raw.source) ?? "unknown";
  const isFree =
    asBoolean(raw.is_free) ??
    asBoolean(raw.isFree) ??
    asBoolean(raw.free) ??
    (asNumber(raw.price) === 0 ? true : false);

  return {
    title,
    description: firstString(raw.description),
    startTime,
    endTime: firstDate(raw.end_time, raw.endTime, raw.end),
    venueName: firstString(raw.venue_name, raw.venueName, raw.venue),
    venueAddress: firstString(raw.venue_address, raw.venueAddress, raw.address),
    lat: firstNumber(raw.lat, raw.latitude),
    lon: firstNumber(raw.lon, raw.lng, raw.longitude),
    category: firstString(raw.category),
    tags: asStringArray(raw.tags),
    source,
    sourceUrl: firstString(raw.source_url, raw.sourceUrl, raw.url),
    imageUrl: firstString(raw.image_url, raw.imageUrl, raw.image),
    ticketUrl: firstString(raw.ticket_url, raw.ticketUrl, raw.tickets),
    isFree,
  };
}

async function upsertNormalisedEvent(event: NormalisedEvent): Promise<void> {
  const source = asString(event.source);
  const sourceUrl = asString(event.sourceUrl);

  if (source && sourceUrl) {
    const existing = await prisma.event.findFirst({
      where: { source, sourceUrl },
      select: { id: true },
    });

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: event,
      });
      return;
    }
  }

  await prisma.event.create({ data: event });
}

/** Run the full ingestion pipeline: fetch → normalise → upsert. */
export async function runAggregation(): Promise<AggregationResult> {
  const [apiEvents, scrapedEvents] = await Promise.all([
    fetchFromAPIs(),
    fetchFromScrapers(),
  ]);

  const rawEvents = [...apiEvents, ...scrapedEvents];
  let normalisedCount = 0;
  let skipped = 0;
  let upserted = 0;

  for (const raw of rawEvents) {
    const normalised = normaliseEvent(raw);
    if (!normalised) {
      skipped += 1;
      continue;
    }

    normalisedCount += 1;
    await upsertNormalisedEvent(normalised);
    upserted += 1;
  }

  return {
    fetchedFromApis: apiEvents.length,
    fetchedFromScrapers: scrapedEvents.length,
    normalised: normalisedCount,
    skipped,
    upserted,
  };
}
