import type { RawEventInput } from "../aggregator.js";

const MEETUP_GQL_URL = "https://api.meetup.com/gql-ext";
const DEFAULT_LAT = 53.4808;
const DEFAULT_LON = -2.2426;
const DEFAULT_RADIUS_MILES = 25;
const DEFAULT_QUERY = "Manchester";
const PAGE_SIZE = 50;
const MAX_PAGES = 3;

type MeetupVenue = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  lon?: number | null;
};

type MeetupGroup = {
  name?: string | null;
  urlname?: string | null;
};

type MeetupFeeSettings = {
  amount?: number | null;
  currency?: string | null;
};

type MeetupEvent = {
  id?: string;
  title?: string | null;
  description?: string | null;
  dateTime?: string | null;
  endTime?: string | null;
  eventUrl?: string | null;
  shortUrl?: string | null;
  imageUrl?: string | null;
  isOnline?: boolean | null;
  eventType?: string | null;
  venue?: MeetupVenue | null;
  group?: MeetupGroup | null;
  feeSettings?: MeetupFeeSettings | null;
  featuredEventPhoto?: { highResUrl?: string | null; baseUrl?: string | null } | null;
};

type MeetupSearchEdge = {
  cursor?: string;
  node?: {
    id?: string;
    result?: MeetupEvent | null;
  } | null;
};

type MeetupKeywordSearchResponse = {
  data?: {
    keywordSearch?: {
      count?: number;
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
      edges?: MeetupSearchEdge[];
    };
  };
  errors?: Array<{ message?: string }>;
};

const KEYWORD_SEARCH_QUERY = `
query KeywordSearch($filter: SearchConnectionFilter!, $input: ConnectionInput) {
  keywordSearch(filter: $filter, input: $input) {
    count
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        result {
          ... on Event {
            id
            title
            description
            dateTime
            endTime
            eventUrl
            shortUrl
            imageUrl
            isOnline
            eventType
            venue {
              name
              address
              city
              state
              postalCode
              country
              lat
              lng
            }
            group {
              name
              urlname
            }
            feeSettings {
              amount
              currency
            }
          }
        }
      }
    }
  }
}
`;

function getAccessToken(): string | null {
  const token = process.env.MEETUP_ACCESS_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

function buildVenueAddress(venue?: MeetupVenue | null): string | null {
  if (!venue) return null;

  const parts = [
    venue.address,
    venue.city,
    venue.state,
    venue.postalCode,
    venue.country,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

function parseIsFree(event: MeetupEvent): boolean {
  const amount = event.feeSettings?.amount;
  if (amount === null || amount === undefined) return true;
  return amount === 0;
}

/** Map a Meetup Event fragment onto the aggregator's loose RawEventInput. */
export function mapMeetupEvent(event: MeetupEvent): RawEventInput {
  const tags = [
    event.group?.name,
    event.eventType,
    event.isOnline ? "online" : "in-person",
  ].filter((tag): tag is string => Boolean(tag));

  return {
    title: event.title,
    description: event.description,
    start_time: event.dateTime,
    end_time: event.endTime,
    venue_name: event.venue?.name ?? (event.isOnline ? "Online" : null),
    venue_address: buildVenueAddress(event.venue),
    lat: event.venue?.lat,
    lon: event.venue?.lng ?? event.venue?.lon,
    category: event.group?.name ?? event.eventType ?? "Meetup",
    tags,
    source: "meetup",
    source_url: event.eventUrl ?? event.shortUrl,
    image_url:
      event.featuredEventPhoto?.highResUrl ??
      event.imageUrl ??
      event.featuredEventPhoto?.baseUrl,
    ticket_url: event.eventUrl ?? event.shortUrl,
    is_free: parseIsFree(event),
    price: event.feeSettings?.amount,
  };
}

async function meetupGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const endpoint = process.env.MEETUP_GQL_URL?.trim() || MEETUP_GQL_URL;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Meetup GraphQL failed (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Fetch Manchester-area Meetup events via GraphQL keywordSearch.
 * No-ops when MEETUP_ACCESS_TOKEN is missing.
 */
export async function fetchMeetupEvents(): Promise<RawEventInput[]> {
  const token = getAccessToken();
  if (!token) {
    console.warn(
      "[meetup] MEETUP_ACCESS_TOKEN not set — skipping Meetup fetch",
    );
    return [];
  }

  const lat = Number(process.env.MEETUP_LATITUDE ?? DEFAULT_LAT);
  const lon = Number(process.env.MEETUP_LONGITUDE ?? DEFAULT_LON);
  const radius = Number(process.env.MEETUP_RADIUS ?? DEFAULT_RADIUS_MILES);
  const queryText = process.env.MEETUP_QUERY?.trim() || DEFAULT_QUERY;

  const events: MeetupEvent[] = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const payload = await meetupGraphql<MeetupKeywordSearchResponse>(
      token,
      KEYWORD_SEARCH_QUERY,
      {
        filter: {
          query: queryText,
          lat,
          lon,
          radius,
          source: "EVENTS",
          city: process.env.MEETUP_CITY?.trim() || "Manchester",
          country: process.env.MEETUP_COUNTRY?.trim() || "gb",
        },
        input: {
          first: PAGE_SIZE,
          ...(after ? { after } : {}),
        },
      },
    );

    if (payload.errors?.length) {
      throw new Error(
        `Meetup GraphQL errors: ${payload.errors
          .map((error) => error.message)
          .filter(Boolean)
          .join("; ")}`,
      );
    }

    const connection = payload.data?.keywordSearch;
    const edges = connection?.edges ?? [];

    for (const edge of edges) {
      const event = edge.node?.result;
      if (event?.title && event.dateTime) {
        events.push(event);
      }
    }

    if (!connection?.pageInfo?.hasNextPage || !connection.pageInfo.endCursor) {
      break;
    }

    after = connection.pageInfo.endCursor;
  }

  return events.map(mapMeetupEvent);
}
