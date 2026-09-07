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
} from "./_university-shared.js";

/**
 * MediaCityUK events listing.
 * https://www.mediacityuk.co.uk/events/
 */
const SOURCE = "scraper:media-city-uk";
const LIST_URL = "https://www.mediacityuk.co.uk/events/";
const MAX_PAGES = 8;

const VENUE = {
  name: "MediaCityUK",
  address: "MediaCityUK, Salford Quays, Salford M50 2EQ",
  lat: 53.4722,
  lon: -2.2977,
};

function parseDateRange(raw: string): { start: string | null; end: string | null } {
  const text = cleanText(raw)
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .replace(/,/g, " ");

  const range = text.match(
    /(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i,
  );
  if (range) {
    const startYmd = parseEnglishDate(
      range[3]
        ? `${range[1]} ${range[2]} ${range[3]}`
        : `${range[1]} ${range[2]} ${range[6]}`,
    );
    const endYmd = parseEnglishDate(`${range[4]} ${range[5]} ${range[6]}`);
    return { start: startYmd, end: endYmd };
  }

  return { start: parseEnglishDate(text), end: null };
}

function categoryLabel($el: any): string | null {
  const clone = $el.find(".c-card-grid-item__category").first().clone();
  clone.find("svg").remove();
  const label = cleanText(clone.text());
  return label || null;
}

function imageUrl($el: any, pageUrl: string): string | null {
  const img = $el.find(".c-card-grid-item__image img").first();
  return (
    absoluteUrl(img.attr("data-src"), pageUrl) ||
    absoluteUrl(img.attr("src"), pageUrl)
  );
}

export function parseMediaCityUkHtml(
  html: string,
  pageUrl = LIST_URL,
  now = new Date(),
): RawEventInput[] {
  const $ = cheerio.load(html);
  const events: RawEventInput[] = [];

  $("article.c-card-grid-item--event").each((_, node) => {
    const $el = $(node);
    const titleLink = $el.find("h3.c-card-grid-item__title a").first();
    const title = cleanText(titleLink.text());
    const href =
      absoluteUrl(titleLink.attr("href"), pageUrl) ||
      absoluteUrl($el.find("a.c-card-grid-item__image").attr("href"), pageUrl);
    if (!title || !href) return;

    const dateRaw = cleanText(
      $el.find(".c-card-grid-item__details > p").first().text(),
    );
    const { start, end } = parseDateRange(dateRaw);
    if (!start) return;

    // Skip fully past ranges when we know an end date.
    if (end) {
      const endMs = Date.parse(`${end}T23:59:59`);
      if (!Number.isNaN(endMs) && endMs < now.getTime() - 12 * 60 * 60 * 1000) {
        return;
      }
    }

    const description = cleanText(
      $el.find(".c-card-grid-item__details > div > p").first().text(),
    );
    const category = categoryLabel($el) ?? "Event";
    const free = looksFree(title, description, category, dateRaw);

    events.push({
      title,
      description: description || null,
      start_time: combineLondonDateTime(start, "12:00:00")!,
      end_time: end && end !== start ? combineLondonDateTime(end, "23:59:00") : null,
      venue_name: VENUE.name,
      venue_address: VENUE.address,
      lat: VENUE.lat,
      lon: VENUE.lon,
      category,
      tags: ["media-city-uk", "mediacity", "salford-quays", "mcr-buzz", category],
      source: SOURCE,
      source_url: href,
      image_url: imageUrl($el, pageUrl),
      ticket_url: href,
      is_free: free,
    });
  });

  return events;
}

export async function scrapeMediaCityUkEvents(): Promise<RawEventInput[]> {
  const byKey = new Map<string, RawEventInput>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = page === 1 ? LIST_URL : `${LIST_URL}page/${page}/`;
    let html: string;
    try {
      html = await fetchText(url);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }

    const batch = parseMediaCityUkHtml(html, url);
    if (batch.length === 0) break;

    for (const event of batch) {
      const key = `${event.source_url}|${event.start_time}`;
      if (!byKey.has(key)) byKey.set(key, event);
    }
  }

  return [...byKey.values()];
}

export const mediaCityUkScraper: ScraperDefinition = {
  id: "media-city-uk",
  source: SOURCE,
  scrape: scrapeMediaCityUkEvents,
};
