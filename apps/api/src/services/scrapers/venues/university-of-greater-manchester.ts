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
 * University of Greater Manchester (formerly University of Bolton) events.
 * https://greatermanchester.ac.uk/visit-us/events
 */
const SOURCE = "scraper:university-of-greater-manchester";
const LIST_URL = "https://greatermanchester.ac.uk/visit-us/events";

const CAMPUS = {
  name: "University of Greater Manchester",
  address: "Deane Road, Bolton BL3 5AB",
  lat: 53.5735,
  lon: -2.4362,
};

export function parseGreaterManchesterEventsHtml(
  html: string,
  pageUrl = LIST_URL,
): RawEventInput[] {
  const $ = cheerio.load(html);
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  const previousHeading = $("h2")
    .filter((_, el) => /previous events/i.test($(el).text()))
    .first();
  const previousOffset = previousHeading.length
    ? html.indexOf($.html(previousHeading) ?? "___none___")
    : Number.POSITIVE_INFINITY;

  $(".event-tile").each((_, el) => {
    const tileHtml = $.html(el) ?? "";
    const offset = html.indexOf(tileHtml);
    if (offset >= previousOffset) return;

    const $el = $(el);
    const title = cleanText($el.find("h4, h3, .content h4").first().text());
    if (!title) return;

    const dateText = cleanText($el.find(".dateformtd").text());
    const ymd = parseEnglishDate(dateText);
    if (!ymd) return;

    const blob = cleanText($el.text());
    const { start, end } = parseTimeFromText(blob);
    const startTime = combineLondonDateTime(ymd, start);
    if (!startTime) return;

    const href =
      absoluteUrl(
        $el
          .find(
            "a[href*='ticket'], a[href*='event'], a[href*='book'], a[href]",
          )
          .first()
          .attr("href"),
        pageUrl,
      ) || `${pageUrl}#${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    const dedupeKey = `${href}|${title}|${ymd}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const imageStyle = $el.find(".img-container").attr("style") ?? "";
    const imageMatch = imageStyle.match(/url\(['"]?([^'")]+)['"]?\)/i);
    const imageUrl = absoluteUrl(imageMatch?.[1] ?? null, pageUrl);

    const description =
      cleanText($el.find(".aboutdescrt, .content p").first().text()) ||
      blob.replace(title, "").replace(dateText, "").trim().slice(0, 500) ||
      null;

    events.push(
      universityEvent({
        title,
        description,
        startTime,
        endTime: end ? combineLondonDateTime(ymd, end) : null,
        venueName: CAMPUS.name,
        venueAddress: CAMPUS.address,
        lat: CAMPUS.lat,
        lon: CAMPUS.lon,
        source: SOURCE,
        sourceUrl: href,
        imageUrl,
        isFree: looksFree(blob),
        extraTags: [
          "bolton",
          "university of bolton",
          "university of greater manchester",
          "ugm",
        ],
      }),
    );
  });

  return events;
}

export async function scrapeUniversityOfGreaterManchesterEvents(): Promise<
  RawEventInput[]
> {
  const html = await fetchText(LIST_URL);
  return parseGreaterManchesterEventsHtml(html);
}

export const universityOfGreaterManchesterScraper: ScraperDefinition = {
  id: "university-of-greater-manchester",
  source: SOURCE,
  scrape: scrapeUniversityOfGreaterManchesterEvents,
};
