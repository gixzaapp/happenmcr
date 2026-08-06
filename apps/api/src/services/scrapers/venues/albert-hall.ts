import type { RawEventInput } from "../../aggregator.js";
import type { ScraperDefinition } from "../types.js";

const SOURCE = "scraper:albert-hall";
const API_URL = "https://alberthallmanchester.com/wp-json/albert-hall/v1/whats-on/";

const VENUE = {
  name: "Albert Hall Manchester",
  address: "27 Peter Street, Manchester M2 5QR",
  lat: 53.4785,
  lon: -2.2478,
};

type AlbertHallTerm = {
  term_id?: number;
  name?: string;
  slug?: string;
};

type AlbertHallEvent = {
  ID?: number;
  post_title?: string;
  post_excerpt?: string;
  post_thumbnail?: string;
  permalink?: string;
  event_excerpt?: string;
  event_start?: string;
  event_start_date?: string;
  event_start_time?: string;
  event_buy_link?: string | null;
  event_buy_text?: string | null;
  event_availability?: string | null;
  event_is_sold_out?: boolean;
  event_type?: AlbertHallTerm[];
  event_image_sizes?: Record<string, string>;
};

type AlbertHallResponse = {
  data?: AlbertHallEvent[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

function text(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Parse times like "6.00PM" / "7.30PM". */
function parseAlbertHallTime(raw: string | undefined | null): string | null {
  const value = text(raw);
  const match = value.match(/^(\d{1,2})[.:](\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function combineStart(event: AlbertHallEvent): string | null {
  if (event.event_start && event.event_start.includes("T")) {
    // Prefer explicit ISO start from API when present.
    const iso = new Date(event.event_start);
    if (!Number.isNaN(iso.getTime())) {
      // Keep local wall-clock from API string if it looks local (no Z).
      if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(event.event_start)) {
        return event.event_start.length === 16
          ? `${event.event_start}:00`
          : event.event_start;
      }
    }
  }

  const day = text(event.event_start).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const clock = parseAlbertHallTime(event.event_start_time) ?? "00:00:00";
  return `${day}T${clock}`;
}

export function mapAlbertHallEvent(event: AlbertHallEvent): RawEventInput | null {
  const title = text(event.post_title);
  const startTime = combineStart(event);
  if (!title || !startTime) return null;

  const types = (event.event_type ?? [])
    .map((term) => text(term.name))
    .filter(Boolean);

  const detailUrl = event.permalink
    ? new URL(event.permalink, "https://alberthallmanchester.com").toString()
    : "https://alberthallmanchester.com/whats-on/";

  const ticketUrl = event.event_buy_link
    ? new URL(event.event_buy_link, "https://alberthallmanchester.com").toString()
    : detailUrl;

  const image =
    event.event_image_sizes?.["1x"] ??
    event.post_thumbnail ??
    null;

  const freeFromCopy = /\bfree entry\b|\bfree admission\b|\bfree show\b/i.test(
    `${event.post_excerpt ?? ""} ${event.event_excerpt ?? ""} ${event.event_buy_text ?? ""}`,
  );

  return {
    title,
    description: text(event.event_excerpt ?? event.post_excerpt) || null,
    start_time: startTime,
    end_time: null,
    venue_name: VENUE.name,
    venue_address: VENUE.address,
    lat: VENUE.lat,
    lon: VENUE.lon,
    category: types[0] ?? "Live music",
    tags: ["albert-hall", "manchester", ...types],
    source: SOURCE,
    source_url: detailUrl,
    image_url: image,
    ticket_url: ticketUrl,
    is_free: freeFromCopy,
  };
}

async function scrapeAlbertHallEvents(): Promise<RawEventInput[]> {
  const response = await fetch(API_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "happenMCRBot/0.1 (+https://github.com/happenMCR; venue-event-aggregator)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Albert Hall API failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as AlbertHallResponse;
  const documents = payload.data ?? [];
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  for (const document of documents) {
    const mapped = mapAlbertHallEvent(document);
    if (!mapped) continue;
    const key = String(mapped.source_url);
    if (seen.has(key)) continue;
    seen.add(key);
    events.push(mapped);
  }

  console.log(`[scraper:albert-hall] scraped ${events.length} event(s)`);
  return events;
}

export const albertHallScraper: ScraperDefinition = {
  id: "albert-hall",
  source: SOURCE,
  scrape: scrapeAlbertHallEvents,
};
