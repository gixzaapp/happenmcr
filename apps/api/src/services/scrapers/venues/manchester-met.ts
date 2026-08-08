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
  parseTimeFromText,
  universityEvent,
} from "./_university-shared.js";

/**
 * Manchester Metropolitan University public events listing.
 * https://www.mmu.ac.uk/news-and-events/events
 */
const SOURCE = "scraper:manchester-met";
const LIST_URL = "https://www.mmu.ac.uk/news-and-events/events";

const CAMPUS = {
  name: "Manchester Metropolitan University",
  address: "All Saints Campus, Manchester M15 6BH",
  lat: 53.4705,
  lon: -2.2394,
};

export function parseMmuEventsHtml(html: string, pageUrl = LIST_URL): RawEventInput[] {
  const $ = cheerio.load(html);
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  $(".event-item").each((_, el) => {
    const $el = $(el);
    const title = cleanText($el.find(".event-title, h3").first().text());
    const href =
      absoluteUrl(
        $el.find("a[href*='/events/detail/']").first().attr("href"),
        pageUrl,
      ) ||
      absoluteUrl($el.find("a[href]").first().attr("href"), pageUrl);
    if (!title || !href || seen.has(href)) return;
    seen.add(href);

    const blob = cleanText($el.text());
    const ymd =
      parseEnglishDate(blob) ||
      parseEnglishDate(
        cleanText($el.find(".event-info").text()) ||
          cleanText($el.find("time").attr("datetime") || $el.find("time").text()),
      );
    if (!ymd) return;

    const { start, end } = parseTimeFromText(blob);
    const startTime = combineLondonDateTime(ymd, start);
    if (!startTime) return;

    // Venue is usually the last non-button line with a postcode / Manchester.
    const venueLine =
      blob
        .split(/(?<=\d{4})\s+(?=[A-Z])/)
        .map((part) => part.trim())
        .find((part) => /M\d{1,2}\s*\d[A-Z]{2}|Manchester|Online/i.test(part)) ||
      null;

    const description = blob
      .replace(title, "")
      .replace(/Find out more/gi, "")
      .trim()
      .slice(0, 500);

    events.push(
      universityEvent({
        title,
        description: description || null,
        startTime,
        endTime: end ? combineLondonDateTime(ymd, end) : null,
        venueName: /Online/i.test(venueLine ?? "") ? "Online" : CAMPUS.name,
        venueAddress:
          venueLine && !/Online/i.test(venueLine) ? venueLine : CAMPUS.address,
        lat: CAMPUS.lat,
        lon: CAMPUS.lon,
        source: SOURCE,
        sourceUrl: href,
        isFree: looksFree(blob),
        extraTags: ["mmu", "manchester metropolitan"],
      }),
    );
  });

  return events;
}

export async function scrapeManchesterMetEvents(): Promise<RawEventInput[]> {
  const html = await fetchText(LIST_URL);
  return parseMmuEventsHtml(html);
}

export const manchesterMetScraper: ScraperDefinition = {
  id: "manchester-met",
  source: SOURCE,
  scrape: scrapeManchesterMetEvents,
};
