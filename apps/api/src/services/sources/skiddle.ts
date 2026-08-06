import type { RawEventInput } from "../aggregator.js";

const SKIDDLE_API_BASE = "https://www.skiddle.com/api/v1";
const DEFAULT_LAT = "53.4808";
const DEFAULT_LON = "-2.2426";
const DEFAULT_RADIUS_MILES = "15";
const PAGE_SIZE = 50;
const MAX_PAGES = 5;

const EVENT_CODE_LABELS: Record<string, string> = {
  FEST: "Festivals",
  LIVE: "Live music",
  CLUB: "Clubbing",
  DATE: "Dating",
  THEATRE: "Theatre",
  COMEDY: "Comedy",
  EXHIB: "Exhibitions",
  KIDS: "Kids",
  BARPUB: "Bar/Pub",
  LGB: "LGBTQ+",
  SPORT: "Sport",
  ARTS: "Arts",
};

type SkiddleVenue = {
  name?: string | null;
  address?: string | null;
  town?: string | null;
  postcode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type SkiddleGenre = {
  name?: string | null;
};

type SkiddleArtist = {
  name?: string | null;
};

type SkiddleEvent = {
  id?: string | number;
  eventname?: string | null;
  description?: string | null;
  date?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  link?: string | null;
  imageurl?: string | null;
  largeimageurl?: string | null;
  entryprice?: string | null;
  EventCode?: string | null;
  eventcode?: string | null;
  venue?: SkiddleVenue | null;
  genres?: SkiddleGenre[] | null;
  artists?: SkiddleArtist[] | null;
  openingtimes?: {
    doorsopen?: string | null;
    doorsclose?: string | null;
  } | null;
};

type SkiddleSearchResponse = {
  error?: number | string;
  errormessage?: string;
  totalcount?: number | string;
  pagecount?: number | string;
  results?: SkiddleEvent[];
};

function getApiKey(): string | null {
  const key = process.env.SKIDDLE_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function buildVenueAddress(venue?: SkiddleVenue | null): string | null {
  if (!venue) return null;

  const parts = [venue.address, venue.town, venue.postcode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

function parseIsFree(entryprice?: string | null): boolean {
  if (!entryprice) return false;
  const normalised = entryprice.trim().toLowerCase();
  if (!normalised) return false;
  return (
    normalised === "0" ||
    normalised === "0.00" ||
    normalised.includes("free") ||
    normalised === "n/a"
  );
}

function combineDateAndTime(date?: string | null, time?: string | null): string | null {
  if (!date) return null;
  const day = date.trim();
  if (!day) return null;

  // Already a full datetime
  if (day.includes("T")) return day;

  const clock = time?.trim();
  if (clock && /^\d{1,2}:\d{2}/.test(clock)) {
    const [hours, minutes] = clock.split(":");
    const hh = hours.padStart(2, "0");
    const mm = minutes.padStart(2, "0");
    // Skiddle times are UK local; append Z would be wrong — use offset-less local
    // and let Date parse as local, or append Europe/London via +00:00/+01:00.
    // Prefer ISO local without Z; normaliseEvent/Date will treat as local runtime TZ.
    return `${day}T${hh}:${mm}:00`;
  }

  return `${day}T00:00:00`;
}

function categoryFromEvent(event: SkiddleEvent): string | null {
  const code = (event.EventCode ?? event.eventcode)?.toUpperCase();
  if (code && EVENT_CODE_LABELS[code]) return EVENT_CODE_LABELS[code];
  if (code) return code;

  const genre = event.genres?.find((item) => item.name?.trim())?.name;
  return genre?.trim() || null;
}

function tagsFromEvent(event: SkiddleEvent): string[] {
  const tags = new Set<string>();
  const code = (event.EventCode ?? event.eventcode)?.toUpperCase();
  if (code) tags.add(EVENT_CODE_LABELS[code] ?? code);

  for (const genre of event.genres ?? []) {
    if (genre.name?.trim()) tags.add(genre.name.trim());
  }

  for (const artist of event.artists ?? []) {
    if (artist.name?.trim()) tags.add(artist.name.trim());
  }

  return [...tags];
}

/** Map a Skiddle event payload onto the aggregator's loose RawEventInput. */
export function mapSkiddleEvent(event: SkiddleEvent): RawEventInput {
  const start =
    combineDateAndTime(event.startdate ?? event.date, event.openingtimes?.doorsopen) ??
    event.date;
  const end =
    combineDateAndTime(event.enddate ?? event.date, event.openingtimes?.doorsclose) ??
    null;

  return {
    title: event.eventname,
    description: event.description,
    start_time: start,
    end_time: end,
    venue_name: event.venue?.name,
    venue_address: buildVenueAddress(event.venue),
    lat: event.venue?.latitude,
    lon: event.venue?.longitude,
    category: categoryFromEvent(event),
    tags: tagsFromEvent(event),
    source: "skiddle",
    source_url: event.link,
    image_url: event.largeimageurl ?? event.imageurl,
    ticket_url: event.link,
    is_free: parseIsFree(event.entryprice),
    price: event.entryprice,
  };
}

async function fetchSearchPage(
  apiKey: string,
  offset: number,
): Promise<SkiddleSearchResponse> {
  const latitude = process.env.SKIDDLE_LATITUDE?.trim() || DEFAULT_LAT;
  const longitude = process.env.SKIDDLE_LONGITUDE?.trim() || DEFAULT_LON;
  const radius = process.env.SKIDDLE_RADIUS?.trim() || DEFAULT_RADIUS_MILES;

  const url = new URL(`${SKIDDLE_API_BASE}/events/search/`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("radius", radius);
  url.searchParams.set("order", "date");
  url.searchParams.set("description", "1");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("country", "GB");

  const minDate = process.env.SKIDDLE_MIN_DATE?.trim();
  if (minDate) {
    url.searchParams.set("minDate", minDate);
  } else {
    url.searchParams.set("minDate", new Date().toISOString().slice(0, 10));
  }

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Skiddle search failed (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  return (await response.json()) as SkiddleSearchResponse;
}

/**
 * Fetch Manchester-area events from Skiddle.
 * No-ops when SKIDDLE_API_KEY is missing.
 */
export async function fetchSkiddleEvents(): Promise<RawEventInput[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[skiddle] SKIDDLE_API_KEY not set — skipping Skiddle fetch");
    return [];
  }

  const events: SkiddleEvent[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const offset = page * PAGE_SIZE;
    const data = await fetchSearchPage(apiKey, offset);

    if (Number(data.error) !== 0) {
      throw new Error(
        `Skiddle API error: ${data.errormessage ?? `code ${data.error}`}`,
      );
    }

    const batch = data.results ?? [];
    events.push(...batch);

    const total = Number(data.totalcount ?? events.length);
    if (batch.length < PAGE_SIZE || events.length >= total) {
      break;
    }
  }

  return events.map(mapSkiddleEvent);
}
