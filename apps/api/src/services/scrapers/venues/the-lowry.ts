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
 * The Lowry what's on.
 * https://www.thelowry.com/whats-on
 */
const SOURCE = "scraper:the-lowry";
const LIST_URL = "https://www.thelowry.com/whats-on";
const MAX_PAGES = 20;

const VENUE = {
  name: "The Lowry",
  address: "Pier 8, Salford Quays, Salford M50 3AZ",
  lat: 53.4714,
  lon: -2.2962,
};

export function parseTheLowryHtml(
  html: string,
  pageUrl = LIST_URL,
): RawEventInput[] {
  const $ = cheerio.load(html);
  const events: RawEventInput[] = [];

  $(".eventCard").each((_, node) => {
    const $el = $(node);
    const titleLink = $el.find("a.desc").first();
    const title = cleanText($el.find("h3.title").first().text());
    const href =
      absoluteUrl(titleLink.attr("href"), pageUrl) ||
      absoluteUrl($el.find("a.image").attr("href"), pageUrl) ||
      absoluteUrl($el.find("a.btn").attr("href"), pageUrl);
    if (!title || !href) return;

    const startRaw = cleanText($el.find(".top-date .start").first().text());
    const endRaw = cleanText($el.find(".top-date .end").first().text());
    const startYmd = parseEnglishDate(startRaw);
    if (!startYmd) return;
    const endYmd = endRaw ? parseEnglishDate(endRaw) : null;

    const room = cleanText($el.find(".venue").first().text());
    const subtitle = cleanText($el.find(".subtitle").first().text());
    const genres = $el
      .find(".genres__link")
      .map((_, g) => cleanText($(g).text()))
      .get()
      .filter(Boolean);
    const category = genres[0] || "Arts";
    const image =
      absoluteUrl($el.find(".thumb img").attr("src"), pageUrl) ||
      absoluteUrl($el.find("img").first().attr("src"), pageUrl);

    const free = looksFree(title, subtitle, ...genres);
    const venueName = room ? `${VENUE.name} — ${room}` : VENUE.name;

    events.push({
      title,
      description: subtitle || null,
      start_time: combineLondonDateTime(startYmd, "19:30:00")!,
      end_time:
        endYmd && endYmd !== startYmd
          ? combineLondonDateTime(endYmd, "23:00:00")
          : null,
      venue_name: venueName,
      venue_address: VENUE.address,
      lat: VENUE.lat,
      lon: VENUE.lon,
      category,
      tags: [
        "the-lowry",
        "lowry",
        "salford-quays",
        "mcr-buzz",
        ...genres,
        ...(room ? [room] : []),
      ],
      source: SOURCE,
      source_url: href,
      image_url: image,
      ticket_url: href,
      is_free: free,
    });
  });

  return events;
}

function maxPageFromHtml(html: string): number {
  const $ = cheerio.load(html);
  const values = $("#pagination-select option")
    .map((_, el) => Number($(el).attr("value") || $(el).text()))
    .get()
    .filter((n) => Number.isFinite(n) && n > 0);
  return values.length ? Math.max(...values) : 1;
}

export async function scrapeTheLowryEvents(): Promise<RawEventInput[]> {
  const byKey = new Map<string, RawEventInput>();
  let maxPage = MAX_PAGES;

  for (let page = 1; page <= maxPage && page <= MAX_PAGES; page += 1) {
    const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
    let html: string;
    try {
      html = await fetchText(url);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }

    if (page === 1) {
      maxPage = Math.min(MAX_PAGES, maxPageFromHtml(html));
    }

    const batch = parseTheLowryHtml(html, url);
    if (batch.length === 0) break;

    for (const event of batch) {
      const key = `${event.source_url}|${event.start_time}`;
      if (!byKey.has(key)) byKey.set(key, event);
    }
  }

  return [...byKey.values()];
}

export const theLowryScraper: ScraperDefinition = {
  id: "the-lowry",
  source: SOURCE,
  scrape: scrapeTheLowryEvents,
};
