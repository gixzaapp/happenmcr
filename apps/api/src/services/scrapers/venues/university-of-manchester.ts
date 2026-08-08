import * as cheerio from "cheerio";
import type { RawEventInput } from "../../aggregator.js";
import type { ScraperDefinition } from "../types.js";
import {
  cleanText,
  combineLondonDateTime,
  fetchText,
  looksFree,
  stripXmlNamespaces,
  universityEvent,
} from "./_university-shared.js";

/**
 * University of Manchester public calendar (Columba XML).
 * https://events.manchester.ac.uk/
 */
const SOURCE = "scraper:university-of-manchester";
const CALML_LIST =
  "https://events.manchester.ac.uk/f3vf/calendar/view:list/p:q_details/calml.xml";
const CALML_MONTH =
  "https://events.manchester.ac.uk/f3vf/calendar/view:cmonth/date:{date}/calml.xml";
const EVENT_URL = "https://events.manchester.ac.uk/event/event:";
const MONTHS_AHEAD = 5;

const CAMPUS = {
  name: "University of Manchester",
  address: "Oxford Road, Manchester M13 9PL",
  lat: 53.4668,
  lon: -2.2339,
};

function eventIdToken(raw: string): string | null {
  const text = cleanText(raw);
  const match = text.match(/(?:even:|event:)?([a-z0-9-]+)$/i);
  return match?.[1] ?? null;
}

function localTimes($: cheerio.CheerioAPI, eventEl: any) {
  const local = $(eventEl)
    .find("times")
    .filter((_, node) => $(node).attr("type") === "local")
    .first();
  const node = local.length ? local : $(eventEl).find("times").first();
  return {
    startDate: cleanText(node.find("start date").first().text()),
    startTime: cleanText(node.find("start time").first().text()) || null,
    endDate: cleanText(node.find("end date").first().text()) || null,
    endTime: cleanText(node.find("end time").first().text()) || null,
  };
}

function locationBits($: cheerio.CheerioAPI, eventEl: any) {
  const location = $(eventEl).find("location").first();
  const building = cleanText(
    location.find("building name, buildingname, name").first().text(),
  );
  const city = cleanText(location.find("city name, city").first().text());
  // Always list under University of Manchester; keep building in the address.
  const venueAddress = [building, city || "Manchester", "United Kingdom"]
    .filter(Boolean)
    .join(", ");
  return {
    venueName: CAMPUS.name,
    venueAddress: venueAddress || CAMPUS.address,
  };
}

function mapColumbaXml(xml: string): RawEventInput[] {
  const $ = cheerio.load(stripXmlNamespaces(xml), { xml: true });
  const out: RawEventInput[] = [];

  $("event").each((_, el) => {
    const title = cleanText($(el).find("title").first().text());
    const idRaw = cleanText($(el).find("id").first().text());
    const token = eventIdToken(idRaw);
    if (!title || !token) return;

    const times = localTimes($, el);
    const startTime = combineLondonDateTime(times.startDate, times.startTime);
    if (!startTime) return;

    // Drop long-running series shells with no clock (months/years wide).
    if (!times.startTime && times.endDate && times.startDate) {
      const startMs = Date.parse(`${times.startDate}T00:00:00Z`);
      const endMs = Date.parse(`${times.endDate}T00:00:00Z`);
      if (
        Number.isFinite(startMs) &&
        Number.isFinite(endMs) &&
        endMs - startMs > 45 * 86_400_000
      ) {
        return;
      }
    }

    const description = cleanText($(el).find("description").first().text());
    const bookingHref =
      $(el).find("links link").first().attr("href") ||
      cleanText($(el).find("links link").first().text()) ||
      null;
    const { venueName, venueAddress } = locationBits($, el);
    const detailUrl = `${EVENT_URL}${token}`;
    const endTime =
      times.endDate && times.endTime
        ? combineLondonDateTime(times.endDate, times.endTime)
        : null;

    const typeName =
      cleanText($(el).find("eventType").attr("name") ?? "") ||
      cleanText($(el).find("type").first().text());

    out.push(
      universityEvent({
        title,
        description: description || null,
        startTime,
        endTime,
        venueName,
        venueAddress,
        lat: CAMPUS.lat,
        lon: CAMPUS.lon,
        source: SOURCE,
        sourceUrl: detailUrl,
        ticketUrl: bookingHref || detailUrl,
        isFree: looksFree(description, $(el).html() ?? ""),
        extraTags: ["university of manchester", "uom", typeName.toLowerCase()].filter(
          Boolean,
        ),
      }),
    );
  });

  return out;
}

function monthStarts(from = new Date(), count = MONTHS_AHEAD): string[] {
  const dates: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  for (let i = 0; i < count; i += 1) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    dates.push(`${y}-${m}-01`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return dates;
}

export async function scrapeUniversityOfManchesterEvents(): Promise<
  RawEventInput[]
> {
  const urls = [
    CALML_LIST,
    ...monthStarts().map((date) => CALML_MONTH.replace("{date}", date)),
  ];

  const batches = await Promise.allSettled(urls.map((url) => fetchText(url)));
  const byUrl = new Map<string, RawEventInput>();

  for (const [index, result] of batches.entries()) {
    if (result.status === "rejected") {
      console.error(
        `[scrapers] university-of-manchester feed failed (${urls[index]})`,
        result.reason,
      );
      continue;
    }
    for (const event of mapColumbaXml(result.value)) {
      const key = String(event.source_url);
      if (!byUrl.has(key)) byUrl.set(key, event);
    }
  }

  return [...byUrl.values()];
}

export const universityOfManchesterScraper: ScraperDefinition = {
  id: "university-of-manchester",
  source: SOURCE,
  scrape: scrapeUniversityOfManchesterEvents,
};

export { mapColumbaXml as mapUniversityOfManchesterCalml };
