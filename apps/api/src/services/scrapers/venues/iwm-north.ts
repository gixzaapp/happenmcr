import type { RawEventInput } from "../../aggregator.js";
import type { ScraperDefinition } from "../types.js";
import {
  absoluteUrl,
  cleanText,
  combineLondonDateTime,
  looksFree,
  parseEnglishDate,
  parseTimeFromText,
} from "./_university-shared.js";

/**
 * IWM North what's on via Drupal JSON:API (same source as the React listing widget).
 * https://www.iwm.org.uk/visits/iwm-north/whats-on
 */
const SOURCE = "scraper:iwm-north";
const SITE = "https://www.iwm.org.uk";
const API_URL = `${SITE}/jsonapi/events`;
const BRANCH_ID = "ea8419ac-5918-490b-b9e9-ca2b6d466042";
const PAGE_LIMIT = 12;
const MAX_PAGES = 10;

const VENUE = {
  name: "IWM North",
  address: "Trafford Wharf Road, Trafford Park, Manchester M17 1TZ",
  lat: 53.4697,
  lon: -2.2989,
};

const USER_AGENT =
  "happenMCRBot/0.1 (+https://happenmcr.com; venue-event-aggregator)";

type IwmDateRange = {
  value?: string;
  end_value?: string;
};

type IwmEvent = {
  type?: string;
  id?: string;
  title?: string;
  status?: boolean;
  path?: { alias?: string };
  field_display_date?: string | null;
  field_event_dates?: IwmDateRange[] | null;
  field_smart_date?: {
    value?: string;
    end_value?: string;
  } | null;
  field_time?: string | null;
  field_free_event?: boolean | null;
  field_permanent?: boolean | null;
  field_buy_tickets?: { uri?: string; resolvable_uri?: string } | null;
  field_additional_location_info?: string | null;
  field_event_type?: Array<{ name?: string }> | null;
  field_event_audience?: { name?: string } | null;
  field_teaser?: {
    field_teaser_summary?: { value?: string; processed?: string } | null;
    field_teaser_image?: {
      field_image?: {
        image_style_uri?: Record<string, string>;
        uri?: { url?: string };
      } | null;
    } | null;
  } | null;
};

type IwmResponse = {
  data?: IwmEvent[];
  meta?: { count?: number };
  links?: { next?: { href?: string } };
};

function stripHtml(value: string | null | undefined): string {
  return cleanText(
    (value ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&rsquo;/gi, "'")
      .replace(/&#039;/gi, "'"),
  );
}

function todayYmd(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function isPastYmd(ymd: string, now: Date): boolean {
  const endMs = Date.parse(`${ymd}T23:59:59`);
  return !Number.isNaN(endMs) && endMs < now.getTime() - 6 * 60 * 60 * 1000;
}

/** Parse "10am", "10am to 12pm", "3pm". */
function parseIwmClock(raw: string | null | undefined): {
  start: string | null;
  end: string | null;
} {
  const text = cleanText(raw);
  if (!text) return { start: null, end: null };

  const fromShared = parseTimeFromText(text);
  if (fromShared.start) return fromShared;

  const match = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s*(?:to|-|–|—)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i,
  );
  if (!match) return { start: null, end: null };

  const toClock = (
    hourRaw: string,
    minuteRaw: string | undefined,
    meridiemRaw: string | undefined,
    inheritMeridiem?: string | null,
  ): string | null => {
    let hour = Number(hourRaw);
    const minute = Number(minuteRaw ?? "0");
    const meridiem = (meridiemRaw ?? inheritMeridiem ?? "").toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    if (hour > 23 || minute > 59) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  };

  const endMeridiem = match[6] ?? match[3] ?? null;
  const start = toClock(match[1]!, match[2], match[3], endMeridiem);
  const end = match[4]
    ? toClock(match[4], match[5], match[6], endMeridiem)
    : null;
  return { start, end };
}

function eventPath(event: IwmEvent): string {
  const alias = event.path?.alias;
  if (alias) return `${SITE}${alias.startsWith("/") ? alias : `/${alias}`}`;
  return `${SITE}/visits/iwm-north/whats-on`;
}

function imageUrl(event: IwmEvent): string | null {
  const styles = event.field_teaser?.field_teaser_image?.field_image?.image_style_uri;
  const styled =
    styles?.teaser_desktop_1x ||
    styles?.teaser_mobile_2x ||
    Object.values(styles ?? {})[0];
  if (styled) return styled;
  const path = event.field_teaser?.field_teaser_image?.field_image?.uri?.url;
  return absoluteUrl(path, SITE);
}

function buildApiUrl(offset: number, now: Date): string {
  const params = new URLSearchParams({
    include: [
      "field_branch",
      "field_event_type",
      "field_event_status",
      "field_teaser.field_teaser_image.field_image",
      "field_event_audience",
      "field_topic",
    ].join(","),
    "page[limit]": String(PAGE_LIMIT),
    "page[offset]": String(offset),
    "filter[status]": "1",
    "filter[field_permanent]": "0",
    "sort[sort_order_level][path]": "field_order_level",
    "sort[sort_order_level][direction]": "DESC",
    "sort[sort_end_date][path]": "field_event_dates.end_value",
    "filter[past_dates_filter][condition][operator]": ">",
    "filter[past_dates_filter][condition][path]":
      "field_event_dates.end_value",
    "filter[past_dates_filter][condition][value]": todayYmd(now),
    "filter[field_branch_filter][condition][path]": "field_branch.id",
    "filter[field_branch_filter][condition][operator]": "IN",
    "filter[field_branch_filter][condition][value][0]": BRANCH_ID,
  });
  return `${API_URL}?${params}`;
}

export function mapIwmNorthEvent(
  event: IwmEvent,
  now = new Date(),
): RawEventInput[] {
  const title = cleanText(event.title);
  if (!title || event.status === false) return [];

  const sourceUrl = eventPath(event);
  const ticketUrl =
    event.field_buy_tickets?.resolvable_uri ||
    event.field_buy_tickets?.uri ||
    sourceUrl;
  const types = (event.field_event_type ?? [])
    .map((t) => cleanText(t.name))
    .filter(Boolean);
  const audience = cleanText(event.field_event_audience?.name);
  const description = stripHtml(
    event.field_teaser?.field_teaser_summary?.processed ||
      event.field_teaser?.field_teaser_summary?.value,
  );
  const room = cleanText(event.field_additional_location_info);
  const venueName = room ? `${VENUE.name} — ${room}` : VENUE.name;
  const category = types[0] || "Museum";
  const free =
    event.field_free_event === true ||
    looksFree(title, description, event.field_display_date);
  const clocks = parseIwmClock(event.field_time);
  const defaultStart = clocks.start ?? "10:00:00";
  const image = imageUrl(event);

  const ranges = (event.field_event_dates ?? []).filter(
    (r): r is IwmDateRange => Boolean(r?.value),
  );

  const occurrences: Array<{ start: string; end: string | null }> = [];

  if (ranges.length > 0) {
    for (const range of ranges) {
      const startYmd = parseEnglishDate(range.value!);
      const endYmd = parseEnglishDate(range.end_value || range.value!);
      if (!startYmd || !endYmd) continue;
      if (isPastYmd(endYmd, now)) continue;

      if (startYmd === endYmd) {
        occurrences.push({
          start: combineLondonDateTime(startYmd, defaultStart)!,
          end: clocks.end
            ? combineLondonDateTime(startYmd, clocks.end)
            : null,
        });
      } else {
        // Ongoing exhibition / activity window — one listing for the run.
        const effectiveStart = isPastYmd(startYmd, now)
          ? todayYmd(now)
          : startYmd;
        occurrences.push({
          start: combineLondonDateTime(effectiveStart, defaultStart)!,
          end: combineLondonDateTime(endYmd, clocks.end ?? "23:59:00"),
        });
      }
    }
  } else if (event.field_smart_date?.value) {
    const startIso = event.field_smart_date.value;
    const endIso = event.field_smart_date.end_value ?? null;
    const startYmd = startIso.slice(0, 10);
    if (!isPastYmd(endIso?.slice(0, 10) || startYmd, now)) {
      occurrences.push({
        start: combineLondonDateTime(startYmd, defaultStart)!,
        end: endIso
          ? combineLondonDateTime(endIso.slice(0, 10), clocks.end ?? "23:59:00")
          : null,
      });
    }
  }

  // Deduplicate identical occurrence windows for the same event.
  const seen = new Set<string>();
  const out: RawEventInput[] = [];
  for (const occ of occurrences) {
    const key = `${sourceUrl}|${occ.start}|${occ.end ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      title,
      description: description || null,
      start_time: occ.start,
      end_time: occ.end,
      venue_name: venueName,
      venue_address: VENUE.address,
      lat: VENUE.lat,
      lon: VENUE.lon,
      category,
      tags: [
        "iwm-north",
        "imperial-war-museum",
        "salford-quays",
        "mcr-buzz",
        ...types,
        ...(audience ? [audience] : []),
        ...(room ? [room] : []),
      ],
      source: SOURCE,
      source_url: sourceUrl,
      image_url: image,
      ticket_url: ticketUrl,
      is_free: free,
    });
  }

  return out;
}

async function fetchIwmPage(offset: number, now: Date): Promise<IwmResponse> {
  const response = await fetch(buildApiUrl(offset, now), {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.api+json, application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `IWM North API failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
  return (await response.json()) as IwmResponse;
}

export async function scrapeIwmNorthEvents(
  now = new Date(),
): Promise<RawEventInput[]> {
  const byKey = new Map<string, RawEventInput>();
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const payload = await fetchIwmPage(offset, now);
    const documents = payload.data ?? [];
    if (documents.length === 0) break;

    for (const document of documents) {
      for (const event of mapIwmNorthEvent(document, now)) {
        const key = `${event.source_url}|${event.start_time}|${event.end_time ?? ""}`;
        if (!byKey.has(key)) byKey.set(key, event);
      }
    }

    const total = payload.meta?.count ?? documents.length;
    offset += PAGE_LIMIT;
    if (offset >= total || !payload.links?.next) break;
  }

  return [...byKey.values()];
}

export const iwmNorthScraper: ScraperDefinition = {
  id: "iwm-north",
  source: SOURCE,
  scrape: scrapeIwmNorthEvents,
};
