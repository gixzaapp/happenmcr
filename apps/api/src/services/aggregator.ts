import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { resolveCampusVenueFromLinks } from "../lib/campus-venue.js";
import { getDayRange } from "../lib/dates.js";
import {
  eventFingerprint,
  fingerprintsMatch,
  londonYmd,
  sourceRank,
} from "../lib/event-dedupe.js";
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
  /** Same source+url updates + new creates. */
  upserted: number;
  /** Dropped because another source already has the same title/day/venue. */
  duplicatesSkipped: number;
  /** Extra copies removed from the database after ingest. */
  duplicatesPurged: number;
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

  const sourceUrl = firstString(raw.source_url, raw.sourceUrl, raw.url);
  const ticketUrl = firstString(raw.ticket_url, raw.ticketUrl, raw.tickets);
  let venueName = firstString(raw.venue_name, raw.venueName, raw.venue);
  let venueAddress = firstString(
    raw.venue_address,
    raw.venueAddress,
    raw.address,
  );

  const campus = resolveCampusVenueFromLinks(
    { sourceUrl, ticketUrl, url: sourceUrl },
    venueAddress,
  );
  if (campus) {
    venueName = campus.venueName;
    venueAddress = campus.venueAddress;
  }

  return {
    title,
    description: firstString(raw.description),
    startTime,
    endTime: firstDate(raw.end_time, raw.endTime, raw.end),
    venueName,
    venueAddress,
    lat: firstNumber(raw.lat, raw.latitude),
    lon: firstNumber(raw.lon, raw.lng, raw.longitude),
    category: firstString(raw.category),
    tags: asStringArray(raw.tags),
    source,
    sourceUrl,
    imageUrl: firstString(raw.image_url, raw.imageUrl, raw.image),
    ticketUrl,
    isFree,
  };
}

type UpsertOutcome = "upserted" | "duplicate";

async function applyPreservedFields(
  existing: {
    imageUrl: string | null;
    status: string;
    customIntro?: string | null;
    localTip?: string | null;
  },
  event: NormalisedEvent,
): Promise<Prisma.EventUpdateInput> {
  const data: Prisma.EventUpdateInput = {
    ...event,
    status: existing.status,
    // Manual editorial fields must survive re-ingest.
    customIntro: existing.customIntro ?? null,
    localTip: existing.localTip ?? null,
  };
  if (existing.imageUrl && isStockImageUrl(existing.imageUrl)) {
    data.imageUrl = existing.imageUrl;
  }
  return data;
}

async function findCrossSourceDuplicate(
  event: NormalisedEvent,
): Promise<{
  id: string;
  imageUrl: string | null;
  status: string;
  source: string | null;
  sourceUrl: string | null;
  ticketUrl: string | null;
  description: string | null;
  customIntro: string | null;
  localTip: string | null;
} | null> {
  const startTime =
    event.startTime instanceof Date
      ? event.startTime
      : new Date(String(event.startTime));
  if (Number.isNaN(startTime.getTime())) return null;

  const range = getDayRange(londonYmd(startTime));
  if (!range) return null;

  const title = asString(event.title);
  if (!title) return null;

  const candidates = await prisma.event.findMany({
    where: { startTime: { gte: range.start, lte: range.end } },
    select: {
      id: true,
      title: true,
      venueName: true,
      startTime: true,
      source: true,
      sourceUrl: true,
      imageUrl: true,
      status: true,
      ticketUrl: true,
      description: true,
      customIntro: true,
      localTip: true,
    },
  });

  const source = asString(event.source);
  const sourceUrl = asString(event.sourceUrl);
  const venueName = asString(event.venueName);

  return (
    candidates.find((candidate) => {
      if (
        source &&
        sourceUrl &&
        candidate.source === source &&
        candidate.sourceUrl === sourceUrl
      ) {
        return false;
      }
      return fingerprintsMatch(
        { title, venueName, startTime },
        {
          title: candidate.title,
          venueName: candidate.venueName,
          startTime: candidate.startTime,
        },
      );
    }) ?? null
  );
}

/**
 * Fill empty fields on an existing cross-source match from the incoming row.
 * Does not change source identity or status.
 */
async function mergeIntoExisting(
  existing: {
    id: string;
    imageUrl: string | null;
    status: string;
    ticketUrl: string | null;
    description: string | null;
  },
  event: NormalisedEvent,
): Promise<void> {
  const incomingImage = asString(event.imageUrl);
  const incomingTicket = asString(event.ticketUrl);
  const incomingDescription = asString(event.description);

  const data: Prisma.EventUpdateInput = {};
  if (!existing.imageUrl && incomingImage) data.imageUrl = incomingImage;
  if (!existing.ticketUrl && incomingTicket) data.ticketUrl = incomingTicket;
  if (!existing.description && incomingDescription) {
    data.description = incomingDescription;
  }

  if (Object.keys(data).length === 0) return;

  await prisma.event.update({ where: { id: existing.id }, data });
}

async function upsertNormalisedEvent(
  event: NormalisedEvent,
): Promise<UpsertOutcome> {
  const source = asString(event.source);
  const sourceUrl = asString(event.sourceUrl);

  if (source && sourceUrl) {
    const existing = await prisma.event.findFirst({
      where: { source, sourceUrl },
      select: {
        id: true,
        imageUrl: true,
        status: true,
        customIntro: true,
        localTip: true,
      },
    });

    if (existing) {
      const data = await applyPreservedFields(existing, event);
      await prisma.event.update({
        where: { id: existing.id },
        data,
      });
      return "upserted";
    }
  }

  const cross = await findCrossSourceDuplicate(event);
  if (cross) {
    // Prefer the higher-ranked source; never create a second row.
    if (sourceRank(source) > sourceRank(cross.source)) {
      const data = await applyPreservedFields(cross, event);
      await prisma.event.update({
        where: { id: cross.id },
        data: {
          ...data,
          // Take over identity so future scrapes of this source update this row.
          source: source ?? cross.source,
          sourceUrl: sourceUrl ?? cross.sourceUrl,
        },
      });
      return "upserted";
    }

    await mergeIntoExisting(cross, event);
    return "duplicate";
  }

  await prisma.event.create({ data: event });
  return "upserted";
}

/**
 * Remove older lower-priority copies that already share a fingerprint.
 * Keeps community / scraper rows over API duplicates.
 */
export async function purgeDuplicateEvents(): Promise<number> {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      venueName: true,
      startTime: true,
      source: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const bestByFingerprint = new Map<
    string,
    { id: string; rank: number; createdAt: Date }
  >();
  const toDelete: string[] = [];

  for (const event of events) {
    const key = eventFingerprint(event.title, event.venueName, event.startTime);
    const rank = sourceRank(event.source);
    const current = bestByFingerprint.get(key);
    if (!current) {
      bestByFingerprint.set(key, {
        id: event.id,
        rank,
        createdAt: event.createdAt,
      });
      continue;
    }

    const incomingBetter =
      rank > current.rank ||
      (rank === current.rank && event.createdAt < current.createdAt);

    if (incomingBetter) {
      toDelete.push(current.id);
      bestByFingerprint.set(key, {
        id: event.id,
        rank,
        createdAt: event.createdAt,
      });
    } else {
      toDelete.push(event.id);
    }
  }

  if (toDelete.length === 0) return 0;

  const result = await prisma.event.deleteMany({
    where: { id: { in: toDelete } },
  });
  return result.count;
}

/** Manual stock CDN hosts — preserve these image_url values on upsert. */
function isStockImageUrl(imageUrl: string): boolean {
  try {
    const host = new URL(imageUrl).hostname.toLowerCase();
    return host === "cdn.pixabay.com" || host === "images.unsplash.com";
  } catch {
    return false;
  }
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
  let duplicatesSkipped = 0;

  const normalised: NormalisedEvent[] = [];
  for (const raw of rawEvents) {
    const event = normaliseEvent(raw);
    if (!event) {
      skipped += 1;
      continue;
    }
    normalisedCount += 1;
    normalised.push(event);
  }

  // Higher-ranked sources first so community/scrapers claim the fingerprint.
  normalised.sort(
    (a, b) => sourceRank(asString(b.source)) - sourceRank(asString(a.source)),
  );

  const seenInBatch = new Set<string>();
  for (const event of normalised) {
    const title = asString(event.title) ?? "";
    const startTime =
      event.startTime instanceof Date
        ? event.startTime
        : new Date(String(event.startTime));
    const key = eventFingerprint(title, asString(event.venueName), startTime);
    if (seenInBatch.has(key)) {
      duplicatesSkipped += 1;
      continue;
    }

    const outcome = await upsertNormalisedEvent(event);
    if (outcome === "duplicate") {
      duplicatesSkipped += 1;
      continue;
    }

    seenInBatch.add(key);
    upserted += 1;
  }

  const duplicatesPurged = await purgeDuplicateEvents();
  if (duplicatesPurged > 0) {
    console.log(`[aggregator] purged ${duplicatesPurged} duplicate event(s)`);
  }

  return {
    fetchedFromApis: apiEvents.length,
    fetchedFromScrapers: scrapedEvents.length,
    normalised: normalisedCount,
    skipped,
    upserted,
    duplicatesSkipped,
    duplicatesPurged,
  };
}
