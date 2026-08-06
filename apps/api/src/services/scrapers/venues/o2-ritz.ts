import type { RawEventInput } from "../../aggregator.js";
import type { ScraperDefinition } from "../types.js";

const SOURCE = "scraper:o2-ritz";
const VENUE_ID = 4038;
const PAGE_SIZE = 50;
const API_BASE = "https://www.academymusicgroup.com/api/search/events";
const SITE_EVENTS_PATH = "/o2ritzmanchester/events";

const VENUE = {
  name: "O2 Ritz Manchester",
  address: "Whitworth St West, Manchester M1 5NQ",
  lat: 53.4743,
  lon: -2.243,
};

type AmgGenre = { key?: string; name?: string };
type AmgLineup = { id?: string; name?: string; isPrimary?: boolean };
type AmgTicket = {
  ticketUrl?: string;
  isVisible?: boolean;
  priceFrom?: number;
  priceTo?: number;
  ticketStatus?: number;
};
type AmgLocalization = {
  name?: string;
  description?: string;
  url?: string;
  listingsText?: string;
  cultureName?: string;
};
type AmgVenue = {
  name?: string;
  address?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
};
type AmgEvent = {
  id?: string;
  name?: string;
  encodedName?: string;
  eventDate?: string;
  eventDateUtc?: string;
  eventDateToUtc?: string;
  eventSortDateUtc?: string;
  doorTime?: string;
  showTime?: string;
  curfewTime?: string;
  image?: string;
  isDeleted?: boolean;
  genres?: AmgGenre[];
  lineup?: AmgLineup[];
  tickets?: AmgTicket[];
  localizations?: AmgLocalization[];
  venue?: AmgVenue;
  description?: string;
};

type AmgSearchResponse = {
  total?: number;
  hasError?: boolean;
  documents?: AmgEvent[];
};

function text(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(value: string | undefined | null): string | null {
  const raw = text(value);
  if (!raw) return null;
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim() || null;
}

function combineDateAndClock(dateIso: string, clock: string | undefined): string {
  const day = dateIso.slice(0, 10);
  const match = text(clock).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return `${day}T00:00:00`;
  return `${day}T${match[1].padStart(2, "0")}:${match[2]}:00`;
}

function buildDetailUrl(event: AmgEvent): string {
  const localizationUrl = event.localizations?.find((item) => item.url)?.url;
  if (localizationUrl) return localizationUrl;

  const primary =
    event.lineup?.find((item) => item.isPrimary)?.id ?? event.lineup?.[0]?.id;
  if (event.encodedName && primary) {
    return `https://www.academymusicgroup.com${SITE_EVENTS_PATH}/${event.encodedName}-tickets-ae${primary}`;
  }

  return `https://www.academymusicgroup.com${SITE_EVENTS_PATH}`;
}

function pickTicketUrl(event: AmgEvent): string | null {
  const visible = event.tickets?.find(
    (ticket) => ticket.isVisible && ticket.ticketUrl,
  );
  if (visible?.ticketUrl) return visible.ticketUrl;

  const any = event.tickets?.find((ticket) => ticket.ticketUrl);
  return any?.ticketUrl ?? null;
}

function parseIsFree(event: AmgEvent): boolean {
  // AMG often leaves priceFrom/priceTo at 0 even for paid shows.
  const blob = [
    event.name,
    event.description,
    ...(event.localizations ?? []).flatMap((item) => [
      item.name,
      item.description,
      item.listingsText,
    ]),
  ]
    .map((value) => text(value).toLowerCase())
    .join(" ");

  return /\bfree entry\b|\bfree admission\b|\bfree show\b/.test(blob);
}

export function mapO2RitzEvent(event: AmgEvent): RawEventInput | null {
  if (event.isDeleted) return null;

  const localization =
    event.localizations?.find((item) => item.cultureName === "en-GB") ??
    event.localizations?.[0];

  const title = text(localization?.name ?? event.name);
  if (!title) return null;

  const dateIso =
    event.eventSortDateUtc ??
    event.eventDateUtc ??
    event.eventDate ??
    null;
  if (!dateIso) return null;

  const startClock = event.showTime || event.doorTime || undefined;
  const startTime = combineDateAndClock(dateIso, startClock);
  const endTime = event.curfewTime
    ? combineDateAndClock(dateIso, event.curfewTime)
    : event.eventDateToUtc ?? null;

  const venue = event.venue;
  const genres = (event.genres ?? [])
    .map((genre) => text(genre.name))
    .filter(Boolean);
  const detailUrl = buildDetailUrl(event);
  const ticketUrl = pickTicketUrl(event) ?? detailUrl;
  const description =
    stripHtml(localization?.description) ??
    stripHtml(localization?.listingsText) ??
    stripHtml(event.description);

  return {
    title,
    description,
    start_time: startTime,
    end_time: endTime,
    venue_name: text(venue?.name) || VENUE.name,
    venue_address: text(
      [venue?.address, venue?.zipCode].filter(Boolean).join(", "),
    ) || VENUE.address,
    lat: venue?.latitude ?? VENUE.lat,
    lon: venue?.longitude ?? VENUE.lon,
    category: genres[0] ?? "Live music",
    tags: ["o2-ritz", "manchester", ...genres],
    source: SOURCE,
    source_url: detailUrl,
    image_url: event.image ?? null,
    ticket_url: ticketUrl,
    is_free: parseIsFree(event),
  };
}

async function fetchO2RitzPage(page: number): Promise<AmgSearchResponse> {
  const url = new URL(API_BASE);
  url.searchParams.set("VenueIds", String(VENUE_ID));
  url.searchParams.set("IncludePostponed", "true");
  url.searchParams.set("IncludeCancelled", "false");
  url.searchParams.set("Url", SITE_EVENTS_PATH);
  url.searchParams.set("PageSize", String(PAGE_SIZE));
  url.searchParams.set("Page", String(page));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "happenMCRBot/0.1 (+https://github.com/happenMCR; venue-event-aggregator)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `O2 Ritz API failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }

  return (await response.json()) as AmgSearchResponse;
}

async function scrapeO2RitzEvents(): Promise<RawEventInput[]> {
  const events: RawEventInput[] = [];
  const seen = new Set<string>();
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while ((page - 1) * PAGE_SIZE < total) {
    const payload = await fetchO2RitzPage(page);
    if (payload.hasError) {
      throw new Error("O2 Ritz API returned hasError=true");
    }

    total = Number(payload.total ?? 0);
    const documents = payload.documents ?? [];
    if (documents.length === 0) break;

    for (const document of documents) {
      const mapped = mapO2RitzEvent(document);
      if (!mapped) continue;
      const key = String(mapped.source_url);
      if (seen.has(key)) continue;
      seen.add(key);
      events.push(mapped);
    }

    page += 1;
    if (page > 20) break;
  }

  console.log(`[scraper:o2-ritz] scraped ${events.length} event(s)`);
  return events;
}

export const o2RitzScraper: ScraperDefinition = {
  id: "o2-ritz",
  source: SOURCE,
  scrape: scrapeO2RitzEvents,
};
