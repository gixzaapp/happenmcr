import type { RawEventInput } from "../../aggregator.js";

export const STUDENT_TAGS = [
  "student",
  "mcr-buzz:student",
  "university",
  "mcr-buzz",
] as const;

export function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function absoluteUrl(href: string | null | undefined, base: string): string | null {
  const raw = cleanText(href);
  if (!raw || raw.startsWith("#") || raw.toLowerCase().startsWith("javascript:")) {
    return null;
  }
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

export function looksFree(...parts: Array<string | null | undefined>): boolean {
  const hay = parts.filter(Boolean).join(" ");
  return /\bfree\b/i.test(hay) || /£\s*0\b/.test(hay) || /\bno booking required\b/i.test(hay);
}

/** Build a local-wall-clock ISO-ish start without timezone (normaliser accepts it). */
export function combineLondonDateTime(
  ymd: string,
  time?: string | null,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const clock = normalizeClock(time) ?? "12:00:00";
  return `${ymd}T${clock}`;
}

function normalizeClock(raw: string | null | undefined): string | null {
  const value = cleanText(raw);
  if (!value) return null;

  const twentyFour = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFour) {
    const h = Number(twentyFour[1]);
    const m = Number(twentyFour[2]);
    const s = Number(twentyFour[3] ?? "0");
    if (h > 23 || m > 59 || s > 59) return null;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  const twelve = value.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)$/i);
  if (twelve) {
    let h = Number(twelve[1]);
    const m = Number(twelve[2]);
    const meridiem = twelve[3]!.toLowerCase();
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    return `${pad(h)}:${pad(m)}:00`;
  }

  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/** Parse English dates like "Wed 02 Sep 2026", "4 October 2026", "12 Aug". */
export function parseEnglishDate(
  raw: string,
  options?: { assumeYear?: number; now?: Date },
): string | null {
  const text = cleanText(raw)
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .replace(/,/g, " ");
  if (!text) return null;

  // Range start: "20 Apr - 31 Oct 2026" (prefer start date).
  const range = text.match(
    /(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i,
  );
  if (range) {
    const day = Number(range[1]);
    const month = MONTHS[range[2]!.toLowerCase()];
    const year = Number(range[3] ?? range[6]);
    if (!month || day < 1 || day > 31) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const withYear = text.match(
    /(?:(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\s+)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i,
  );
  if (withYear) {
    const day = Number(withYear[1]);
    const month = MONTHS[withYear[2]!.toLowerCase()];
    const year = Number(withYear[3]);
    if (!month || day < 1 || day > 31) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const noYear = text.match(
    /(?:(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\s+)?(\d{1,2})\s+([A-Za-z]+)/i,
  );
  if (noYear) {
    const day = Number(noYear[1]);
    const month = MONTHS[noYear[2]!.toLowerCase()];
    if (!month || day < 1 || day > 31) return null;
    const now = options?.now ?? new Date();
    let year = options?.assumeYear ?? now.getFullYear();
    const candidate = new Date(year, month - 1, day, 12);
    // If the date already passed more than ~14 days ago, roll to next year.
    if (candidate.getTime() < now.getTime() - 14 * 86_400_000) {
      year += 1;
    }
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  return null;
}

/** Extract first HH:MM (optional range) from free text. */
export function parseTimeFromText(raw: string): {
  start: string | null;
  end: string | null;
} {
  const text = cleanText(raw);
  const range = text.match(
    /(\d{1,2}[:.]\d{2}\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}[:.]\d{2}\s*(?:am|pm)?)/i,
  );
  if (range) {
    return {
      start: normalizeClock(range[1]!.replace(".", ":")),
      end: normalizeClock(range[2]!.replace(".", ":")),
    };
  }
  const single = text.match(/\b(\d{1,2}[:.]\d{2}\s*(?:am|pm)?)\b/i);
  return {
    start: single ? normalizeClock(single[1]!.replace(".", ":")) : null,
    end: null,
  };
}

export function universityEvent(input: {
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  venueName: string;
  venueAddress?: string | null;
  lat?: number | null;
  lon?: number | null;
  source: string;
  sourceUrl: string;
  imageUrl?: string | null;
  ticketUrl?: string | null;
  isFree?: boolean | null;
  extraTags?: string[];
}): RawEventInput {
  return {
    title: input.title,
    description: input.description ?? null,
    start_time: input.startTime,
    end_time: input.endTime ?? null,
    venue_name: input.venueName,
    venue_address: input.venueAddress ?? null,
    lat: input.lat ?? null,
    lon: input.lon ?? null,
    category: "Student",
    tags: [...STUDENT_TAGS, ...(input.extraTags ?? [])],
    source: input.source,
    source_url: input.sourceUrl,
    image_url: input.imageUrl ?? null,
    ticket_url: input.ticketUrl ?? input.sourceUrl,
    is_free: input.isFree ?? null,
  };
}

export function stripXmlNamespaces(xml: string): string {
  return xml.replace(/<\/?[A-Za-z0-9]+:/g, (match) =>
    match.startsWith("</") ? "</" : "<",
  );
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "happenMCRBot/0.1 (+https://happenmcr.com; university-event-aggregator)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.text();
}
