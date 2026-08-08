import type { RawEventInput } from "../aggregator.js";

const EVENTBRITE_API_BASE = "https://www.eventbriteapi.com/v3";
const DEFAULT_LOCATION = "Manchester, UK";
const DEFAULT_WITHIN = "40km";
const MAX_PAGES = 5;


type EventbriteText = {
  text?: string | null;
  html?: string | null;
};

type EventbriteAddress = {
  localized_address_display?: string | null;
  address_1?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
};

type EventbriteVenue = {
  name?: string | null;
  address?: EventbriteAddress | null;
};

type EventbriteLogo = {
  url?: string | null;
  original?: { url?: string | null } | null;
};

type EventbriteCategory = {
  name?: string | null;
  short_name?: string | null;
};

type EventbriteEvent = {
  id?: string;
  name?: EventbriteText | null;
  description?: EventbriteText | null;
  summary?: string | null;
  start?: { utc?: string | null; local?: string | null } | null;
  end?: { utc?: string | null; local?: string | null } | null;
  url?: string | null;
  logo?: EventbriteLogo | null;
  is_free?: boolean;
  category?: EventbriteCategory | null;
  subcategory?: EventbriteCategory | null;
  venue?: EventbriteVenue | null;
  status?: string | null;
};

type EventbriteListResponse = {
  events?: EventbriteEvent[];
  pagination?: {
    page_number?: number;
    page_count?: number;
    has_more_items?: boolean;
  };
};

function getToken(): string | null {
  const token = process.env.EVENTBRITE_API_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

function buildVenueAddress(venue?: EventbriteVenue | null): string | null {
  const address = venue?.address;
  if (!address) return null;

  if (address.localized_address_display?.trim()) {
    return address.localized_address_display.trim();
  }

  const parts = [
    address.address_1,
    address.city,
    address.region,
    address.postal_code,
    address.country,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

/** Map an Eventbrite event payload onto the aggregator's loose RawEventInput. */
export function mapEventbriteEvent(event: EventbriteEvent): RawEventInput {
  const categoryLabel =
    event.category?.short_name ?? event.category?.name ?? null;
  const subcategoryLabel =
    event.subcategory?.short_name ?? event.subcategory?.name ?? null;

  const tags = [categoryLabel, subcategoryLabel].filter(
    (tag): tag is string => Boolean(tag),
  );

  const blob = `${categoryLabel ?? ""} ${subcategoryLabel ?? ""} ${event.name?.text ?? ""}`.toLowerCase();
  if (
    /\bcharity\b|\bcauses?\b|\bfundraiser\b|\bfundraising\b|\bvolunteer\b/.test(
      blob,
    )
  ) {
    tags.push("charity");
  }

  return {
    title: event.name?.text,
    description: event.description?.text ?? event.summary,
    start_time: event.start?.utc ?? event.start?.local,
    end_time: event.end?.utc ?? event.end?.local,
    venue_name: event.venue?.name,
    venue_address: buildVenueAddress(event.venue),
    lat: event.venue?.address?.latitude,
    lon: event.venue?.address?.longitude,
    category: categoryLabel,
    tags,
    source: "eventbrite",
    source_url: event.url,
    image_url: event.logo?.original?.url ?? event.logo?.url,
    ticket_url: event.url,
    is_free: event.is_free,
  };
}

async function eventbriteGet(
  path: string,
  token: string,
  params: Record<string, string>,
): Promise<EventbriteListResponse> {
  const url = new URL(`${EVENTBRITE_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Eventbrite ${path} failed (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  return (await response.json()) as EventbriteListResponse;
}

async function fetchSearchPages(token: string): Promise<EventbriteEvent[]> {
  const location = process.env.EVENTBRITE_LOCATION?.trim() || DEFAULT_LOCATION;
  const within = process.env.EVENTBRITE_WITHIN?.trim() || DEFAULT_WITHIN;
  const events: EventbriteEvent[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await eventbriteGet("/events/search/", token, {
      "location.address": location,
      "location.within": within,
      expand: "venue,category,subcategory",
      sort_by: "date",
      page: String(page),
    });

    events.push(...(data.events ?? []));

    const pageCount = data.pagination?.page_count ?? page;
    const hasMore = data.pagination?.has_more_items ?? page < pageCount;
    if (!hasMore) break;
  }

  return events;
}

async function fetchOrganizationPages(
  token: string,
  organizationId: string,
): Promise<EventbriteEvent[]> {
  const events: EventbriteEvent[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await eventbriteGet(
      `/organizations/${organizationId}/events/`,
      token,
      {
        status: "live",
        order_by: "start_asc",
        expand: "venue,category,subcategory",
        page: String(page),
      },
    );

    events.push(...(data.events ?? []));

    const pageCount = data.pagination?.page_count ?? page;
    const hasMore = data.pagination?.has_more_items ?? page < pageCount;
    if (!hasMore) break;
  }

  return events;
}

/**
 * Fetch Manchester (or configured) events from Eventbrite.
 * No-ops when EVENTBRITE_API_TOKEN is missing.
 * Note: MCR Buzz search filters these out client/API-side for a more local feel.
 */
export async function fetchEventbriteEvents(): Promise<RawEventInput[]> {
  const token = getToken();
  if (!token) {
    console.warn(
      "[eventbrite] EVENTBRITE_API_TOKEN not set — skipping Eventbrite fetch",
    );
    return [];
  }

  const organizationId = process.env.EVENTBRITE_ORG_ID?.trim();
  const events = organizationId
    ? await fetchOrganizationPages(token, organizationId)
    : await fetchSearchPages(token);

  return events
    .filter((event) => event.status !== "deleted" && event.status !== "canceled")
    .map(mapEventbriteEvent);
}
