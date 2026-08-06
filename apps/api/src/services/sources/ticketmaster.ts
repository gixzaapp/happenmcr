import type { RawEventInput } from "../aggregator.js";

const TICKETMASTER_EVENTS_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";
const DEFAULT_LAT = "53.4808";
const DEFAULT_LON = "-2.2426";
const DEFAULT_RADIUS = "40";
const DEFAULT_UNIT = "km";
const PAGE_SIZE = 50;
const MAX_PAGES = 5;

type TicketmasterImage = {
  url?: string | null;
  ratio?: string | null;
  width?: number | null;
  height?: number | null;
  fallback?: boolean | null;
};

type TicketmasterVenue = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
  } | null;
  city?: { name?: string | null } | null;
  state?: { name?: string | null; stateCode?: string | null } | null;
  postalCode?: string | null;
  country?: { name?: string | null; countryCode?: string | null } | null;
  location?: {
    latitude?: string | null;
    longitude?: string | null;
  } | null;
};

type TicketmasterClassification = {
  segment?: { name?: string | null } | null;
  genre?: { name?: string | null } | null;
  subGenre?: { name?: string | null } | null;
};

type TicketmasterPriceRange = {
  type?: string | null;
  currency?: string | null;
  min?: number | null;
  max?: number | null;
};

type TicketmasterEvent = {
  id?: string;
  name?: string | null;
  url?: string | null;
  info?: string | null;
  pleaseNote?: string | null;
  dates?: {
    start?: {
      dateTime?: string | null;
      localDate?: string | null;
      localTime?: string | null;
    } | null;
    end?: {
      dateTime?: string | null;
      localDate?: string | null;
      localTime?: string | null;
    } | null;
  } | null;
  images?: TicketmasterImage[] | null;
  classifications?: TicketmasterClassification[] | null;
  priceRanges?: TicketmasterPriceRange[] | null;
  _embedded?: {
    venues?: TicketmasterVenue[] | null;
  } | null;
};

type TicketmasterEventsResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size?: number;
    totalElements?: number;
    totalPages?: number;
    number?: number;
  };
  faults?: Array<{ faultstring?: string }>;
  errors?: Array<{ detail?: string; code?: string }>;
};

function getApiKey(): string | null {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function buildVenueAddress(venue?: TicketmasterVenue | null): string | null {
  if (!venue) return null;

  const parts = [
    venue.address?.line1,
    venue.address?.line2,
    venue.city?.name,
    venue.state?.name ?? venue.state?.stateCode,
    venue.postalCode,
    venue.country?.name ?? venue.country?.countryCode,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

function pickImage(images?: TicketmasterImage[] | null): string | null {
  if (!images?.length) return null;

  const ranked = [...images].sort((a, b) => {
    const aScore = (a.width ?? 0) * (a.height ?? 0) + (a.fallback ? -1_000_000 : 0);
    const bScore = (b.width ?? 0) * (b.height ?? 0) + (b.fallback ? -1_000_000 : 0);
    return bScore - aScore;
  });

  return ranked[0]?.url ?? null;
}

function combineLocalDateTime(
  localDate?: string | null,
  localTime?: string | null,
): string | null {
  if (!localDate) return null;
  if (localTime) return `${localDate}T${localTime}`;
  return `${localDate}T00:00:00`;
}

function categoryFromEvent(event: TicketmasterEvent): string | null {
  const primary = event.classifications?.[0];
  return (
    primary?.genre?.name?.trim() ||
    primary?.segment?.name?.trim() ||
    primary?.subGenre?.name?.trim() ||
    null
  );
}

function tagsFromEvent(event: TicketmasterEvent): string[] {
  const tags = new Set<string>();

  for (const classification of event.classifications ?? []) {
    for (const value of [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name,
    ]) {
      if (value?.trim()) tags.add(value.trim());
    }
  }

  return [...tags];
}

function parseIsFree(event: TicketmasterEvent): boolean {
  const ranges = event.priceRanges ?? [];
  if (ranges.length === 0) return false;
  return ranges.some(
    (range) =>
      (range.min === 0 || range.min === null || range.min === undefined) &&
      (range.max === 0 || range.max === null || range.max === undefined || range.max === 0),
  ) || ranges.every((range) => (range.min ?? 0) === 0 && (range.max ?? 0) === 0);
}

/** Map a Ticketmaster Discovery event onto RawEventInput. */
export function mapTicketmasterEvent(event: TicketmasterEvent): RawEventInput {
  const venue = event._embedded?.venues?.[0];
  const start =
    event.dates?.start?.dateTime ??
    combineLocalDateTime(
      event.dates?.start?.localDate,
      event.dates?.start?.localTime,
    );
  const end =
    event.dates?.end?.dateTime ??
    combineLocalDateTime(
      event.dates?.end?.localDate,
      event.dates?.end?.localTime,
    );

  const minPrice = event.priceRanges
    ?.map((range) => range.min)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b)[0];

  return {
    title: event.name,
    description: event.info ?? event.pleaseNote,
    start_time: start,
    end_time: end,
    venue_name: venue?.name,
    venue_address: buildVenueAddress(venue),
    lat: venue?.location?.latitude,
    lon: venue?.location?.longitude,
    category: categoryFromEvent(event),
    tags: tagsFromEvent(event),
    source: "ticketmaster",
    source_url: event.url,
    image_url: pickImage(event.images),
    ticket_url: event.url,
    is_free: parseIsFree(event),
    price: minPrice,
  };
}

async function fetchEventsPage(
  apiKey: string,
  page: number,
): Promise<TicketmasterEventsResponse> {
  const lat = process.env.TICKETMASTER_LATITUDE?.trim() || DEFAULT_LAT;
  const lon = process.env.TICKETMASTER_LONGITUDE?.trim() || DEFAULT_LON;
  const radius = process.env.TICKETMASTER_RADIUS?.trim() || DEFAULT_RADIUS;
  const unit = process.env.TICKETMASTER_UNIT?.trim() || DEFAULT_UNIT;
  const city = process.env.TICKETMASTER_CITY?.trim() || "Manchester";
  const countryCode = process.env.TICKETMASTER_COUNTRY_CODE?.trim() || "GB";

  const url = new URL(TICKETMASTER_EVENTS_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("latlong", `${lat},${lon}`);
  url.searchParams.set("radius", radius);
  url.searchParams.set("unit", unit);
  url.searchParams.set("city", city);
  url.searchParams.set("countryCode", countryCode);
  url.searchParams.set("size", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "date,asc");

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Ticketmaster search failed (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  return (await response.json()) as TicketmasterEventsResponse;
}

/**
 * Fetch Manchester-area events from Ticketmaster Discovery.
 * No-ops when TICKETMASTER_API_KEY is missing.
 */
export async function fetchTicketmasterEvents(): Promise<RawEventInput[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(
      "[ticketmaster] TICKETMASTER_API_KEY not set — skipping Ticketmaster fetch",
    );
    return [];
  }

  const events: TicketmasterEvent[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await fetchEventsPage(apiKey, page);

    if (data.faults?.length || data.errors?.length) {
      const message =
        data.faults?.[0]?.faultstring ??
        data.errors?.[0]?.detail ??
        "Unknown Ticketmaster error";
      throw new Error(`Ticketmaster API error: ${message}`);
    }

    const batch = data._embedded?.events ?? [];
    events.push(...batch);

    const totalPages = data.page?.totalPages ?? page + 1;
    if (batch.length === 0 || page + 1 >= totalPages) {
      break;
    }
  }

  return events.map(mapTicketmasterEvent);
}
