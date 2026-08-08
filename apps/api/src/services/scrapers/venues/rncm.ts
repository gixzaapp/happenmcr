import * as cheerio from "cheerio";
import type { RawEventInput } from "../../aggregator.js";
import type { ScraperDefinition } from "../types.js";
import {
  absoluteUrl,
  cleanText,
  combineLondonDateTime,
  fetchText,
  looksFree,
  parseEnglishDate,
  universityEvent,
} from "./_university-shared.js";

/**
 * Royal Northern College of Music what's on.
 * https://www.rncm.ac.uk/whats-on/events/
 */
const SOURCE = "scraper:rncm";
const LIST_URL = "https://www.rncm.ac.uk/whats-on/events/";
const MAX_PAGES = 8;

const VENUE = {
  name: "Royal Northern College of Music",
  address: "124 Oxford Road, Manchester M13 9RD",
  lat: 53.4691,
  lon: -2.2365,
};

export function parseRncmEventsHtml(
  html: string,
  pageUrl = LIST_URL,
  now = new Date(),
): RawEventInput[] {
  const $ = cheerio.load(html);
  const events: RawEventInput[] = [];

  $("#tablet-events-page .event, .whats-on-event-list .event").each((_, el) => {
    const $el = $(el);
    const title = cleanText($el.find("h2").first().text());
    const href =
      absoluteUrl(
        $el.find("a[href*='/performance/']").first().attr("href"),
        pageUrl,
      ) || absoluteUrl($el.find("a[href]").first().attr("href"), pageUrl);
    if (!title || !href) return;

    const dateLabel = cleanText($el.find(".event-date").first().text());
    // Labels look like "Sep 18th" — reorder to day-month for the shared parser.
    const reordered = dateLabel.replace(
      /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i,
      "$2 $1",
    );
    const ymd = parseEnglishDate(reordered, { now });
    if (!ymd) return;

    const subtitle = cleanText($el.find(".title span").first().text());
    const bookHref =
      absoluteUrl($el.find("a[href*='basket'], a[href*='book']").first().attr("href"), pageUrl) ||
      href;

    const bg = $el.find(".event-picture").attr("style") ?? "";
    const imageMatch = bg.match(/url\(([^)]+)\)/i);
    const imageUrl = absoluteUrl(
      imageMatch?.[1]?.replace(/^['"]|['"]$/g, "") ?? null,
      pageUrl,
    );

    const free = looksFree(title, subtitle, $el.text());
    const defaultClock = /lunch/i.test(`${title} ${subtitle}`)
      ? "13:00:00"
      : "19:30:00";

    events.push(
      universityEvent({
        title,
        description: subtitle || null,
        startTime: combineLondonDateTime(ymd, defaultClock)!,
        venueName: VENUE.name,
        venueAddress: VENUE.address,
        lat: VENUE.lat,
        lon: VENUE.lon,
        source: SOURCE,
        sourceUrl: href,
        ticketUrl: bookHref,
        imageUrl,
        isFree: free,
        extraTags: ["rncm", "royal northern college of music", "music"],
      }),
    );
  });

  return events;
}

export async function scrapeRncmEvents(): Promise<RawEventInput[]> {
  const byUrl = new Map<string, RawEventInput>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url =
      page === 1 ? LIST_URL : `${LIST_URL}page/${page}/`;
    let html: string;
    try {
      html = await fetchText(url);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }

    const batch = parseRncmEventsHtml(html, url);
    if (batch.length === 0) break;

    for (const event of batch) {
      const key = `${event.source_url}|${event.start_time}`;
      if (!byUrl.has(key)) byUrl.set(key, event);
    }
  }

  return [...byUrl.values()];
}

export const rncmScraper: ScraperDefinition = {
  id: "rncm",
  source: SOURCE,
  scrape: scrapeRncmEvents,
};
