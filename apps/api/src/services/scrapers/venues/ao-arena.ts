import type { CheerioAPI } from "cheerio";
import { chromium } from "playwright";
import type { RawEventInput } from "../../aggregator.js";
import { loadDocument } from "../engine.js";
import type { ScraperDefinition } from "../types.js";

const EVENTS_URL = "https://www.ao-arena.com/events";
const SOURCE = "scraper:ao-arena";
const MAX_LOAD_MORE_CLICKS = 40;

const VENUE = {
  name: "AO Arena",
  address: "Victoria Station, Manchester M3 1AR",
  lat: 53.4881,
  lon: -2.2439,
};

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

function text(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseMonth(raw: string): number | null {
  const key = text(raw).replace(",", "").toLowerCase();
  return MONTHS[key] ?? null;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseListingDate($el: ReturnType<CheerioAPI>): {
  startDate: string | null;
  endDate: string | null;
} {
  const dateRoot = $el.find(".date").first();

  const singleDay = Number(text(dateRoot.find(".m-date__singleDate .m-date__day").text()));
  const singleMonth = parseMonth(dateRoot.find(".m-date__singleDate .m-date__month").text());
  const singleYear = Number(
    text(dateRoot.find(".m-date__singleDate .m-date__year").text()).replace(",", ""),
  );

  if (singleDay && singleMonth && singleYear) {
    const iso = toIsoDate(singleYear, singleMonth, singleDay);
    return { startDate: iso, endDate: null };
  }

  const rangeStartDay = Number(text(dateRoot.find(".m-date__rangeFirst .m-date__day").text()));
  const rangeEndDay = Number(text(dateRoot.find(".m-date__rangeLast .m-date__day").text()));
  const rangeMonth =
    parseMonth(dateRoot.find(".m-date__rangeLast .m-date__month").text()) ??
    parseMonth(dateRoot.find(".m-date__rangeFirst .m-date__month").text());
  const rangeYear = Number(
    text(dateRoot.find(".m-date__rangeLast .m-date__year").text()).replace(",", "") ||
      text(dateRoot.find(".m-date__rangeFirst .m-date__year").text()).replace(",", ""),
  );

  if (rangeStartDay && rangeEndDay && rangeMonth && rangeYear) {
    return {
      startDate: toIsoDate(rangeYear, rangeMonth, rangeStartDay),
      endDate: toIsoDate(rangeYear, rangeMonth, rangeEndDay),
    };
  }

  return { startDate: null, endDate: null };
}

function parseStartTime($el: ReturnType<CheerioAPI>): string | null {
  const raw = text($el.find(".m-eventItem__start").first().text());
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function combineDateTime(date: string, time: string | null): string {
  return `${date}T${time ?? "00:00:00"}`;
}

export function parseAoArenaHtml(html: string, pageUrl = EVENTS_URL): RawEventInput[] {
  const $ = loadDocument(html);
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  $(".eventItem.entry").each((_, node) => {
    const el = $(node);
    const titleLink = el.find("h3.title a, h3.m-eventItem__title a").first();
    const title = text(titleLink.text());
    if (!title) return;

    const { startDate, endDate } = parseListingDate(el);
    if (!startDate) return;

    const detailUrl = titleLink.attr("href")
      ? new URL(titleLink.attr("href")!, pageUrl).toString()
      : pageUrl;

    const dedupeKey = `${title}|${startDate}|${detailUrl}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const ticketHref =
      el.find("a.tickets").attr("href") ?? el.find(".buttons a.tickets").attr("href");
    const imageSrc =
      el.find(".thumb img").attr("src") ??
      el.find("img").first().attr("src") ??
      el.find("img").first().attr("data-src");

    const tagline = text(el.find("h4.tagline, h4.m-eventItem__tagline").first().text());
    const startTime = parseStartTime(el);

    events.push({
      title,
      description: tagline || null,
      start_time: combineDateTime(startDate, startTime),
      end_time: endDate ? combineDateTime(endDate, null) : null,
      venue_name: VENUE.name,
      venue_address: VENUE.address,
      lat: VENUE.lat,
      lon: VENUE.lon,
      category: "Arena",
      tags: ["ao-arena", "manchester", ...(tagline ? [tagline] : [])],
      source: SOURCE,
      source_url: detailUrl,
      image_url: imageSrc ? new URL(imageSrc, pageUrl).toString() : null,
      ticket_url: ticketHref ? new URL(ticketHref, pageUrl).toString() : detailUrl,
      is_free: false,
    });
  });

  return events;
}

async function scrapeAoArenaEvents(): Promise<RawEventInput[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "happenMCRBot/0.1 (+https://github.com/happenMCR; venue-event-aggregator)",
  });

  try {
    await page.goto(EVENTS_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(".eventItem.entry", { timeout: 30_000 });

    for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i += 1) {
      const button = page.locator("#loadMoreEvents");
      if ((await button.count()) === 0) break;

      const visible = await button.isVisible().catch(() => false);
      if (!visible) break;

      const before = await page.locator(".eventItem.entry").count();
      await button.click({ timeout: 10_000 }).catch(() => undefined);
      await page.waitForTimeout(1200);

      const after = await page.locator(".eventItem.entry").count();
      if (after <= before) {
        // Give AJAX a little more time once, then stop if still unchanged.
        await page.waitForTimeout(1500);
        const retryCount = await page.locator(".eventItem.entry").count();
        if (retryCount <= before) break;
      }
    }

    const html = await page.content();
    const events = parseAoArenaHtml(html, EVENTS_URL);
    console.log(`[scraper:ao-arena] scraped ${events.length} event(s)`);
    return events;
  } finally {
    await page.close();
    await browser.close();
  }
}

export const aoArenaScraper: ScraperDefinition = {
  id: "ao-arena",
  source: SOURCE,
  scrape: scrapeAoArenaEvents,
};
