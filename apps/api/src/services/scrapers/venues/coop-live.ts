import { chromium, type Browser, type Page } from "playwright";
import type { RawEventInput } from "../../aggregator.js";
import { loadDocument } from "../engine.js";
import type { ScraperDefinition } from "../types.js";

const EVENTS_URL = "https://www.cooplive.com/events?items_per_page=27";
const SOURCE = "scraper:coop-live";
const MAX_PAGES = 12;

const VENUE = {
  name: "Co-op Live",
  address: "Etihad Campus, Manchester M11 3FF",
  lat: 53.487,
  lon: -2.2,
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
  return MONTHS[text(raw).toLowerCase()] ?? null;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse dates like "Sun 16 Aug 2026" or "16 Aug 2026". */
function parseCoopDate(raw: string): string | null {
  const match = text(raw).match(
    /(?:[A-Za-z]{3}\s+)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
  );
  if (!match) return null;

  const day = Number(match[1]);
  const month = parseMonth(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;
  return toIsoDate(year, month, day);
}

function parseCoopTime(raw: string): string | null {
  const value = text(raw);
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

export function parseCoopLiveHtml(
  html: string,
  pageUrl = EVENTS_URL,
): RawEventInput[] {
  const $ = loadDocument(html);
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  $("li.eventCard").each((_, node) => {
    const el = $(node);
    const titleLink = el.find("a.desc").first();
    const title = text(el.find("h3.title").first().text());
    if (!title) return;

    const dateRaw = text(el.find(".top-date .start, .datetime .start").first().text());
    const startDate = parseCoopDate(dateRaw);
    if (!startDate) return;

    const href = titleLink.attr("href") ?? el.find("a.image").attr("href");
    const detailUrl = href
      ? new URL(href, "https://www.cooplive.com").toString()
      : pageUrl;

    const dedupeKey = `${title}|${startDate}|${detailUrl}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const subtitle = text(el.find(".subtitle").first().text());
    const timeRaw = text(el.find(".top-date .time").first().text());
    const startTime = parseCoopTime(timeRaw);
    const imageSrc =
      el.find(".thumb img").attr("src") ?? el.find("img").first().attr("src");

    const bookHref =
      el.find("a.btn[href*='/events/']").attr("href") ??
      el.find("a.mobile-button").attr("href") ??
      href;

    events.push({
      title,
      description: subtitle || null,
      start_time: `${startDate}T${startTime ?? "00:00:00"}`,
      end_time: null,
      venue_name: VENUE.name,
      venue_address: VENUE.address,
      lat: VENUE.lat,
      lon: VENUE.lon,
      category: "Arena",
      tags: ["coop-live", "manchester", ...(subtitle ? [subtitle] : [])],
      source: SOURCE,
      source_url: detailUrl,
      image_url: imageSrc
        ? new URL(imageSrc, "https://www.cooplive.com").toString()
        : null,
      ticket_url: bookHref
        ? new URL(bookHref, "https://www.cooplive.com").toString()
        : detailUrl,
      is_free: false,
    });
  });

  return events;
}

async function dismissCookies(page: Page): Promise<void> {
  for (const label of ["Accept all", "Accept All", "Accept", "Agree", "OK"]) {
    const button = page.getByRole("button", { name: label });
    if ((await button.count()) > 0) {
      await button.first().click().catch(() => undefined);
      await page.waitForTimeout(800);
      return;
    }
  }
}

async function waitForListing(page: Page): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    const title = await page.title();
    const count = await page.locator("li.eventCard").count();
    if (!/secure connection|just a moment|checking/i.test(title) && count > 0) {
      return;
    }
    await page.waitForTimeout(1500);
  }
  await page.waitForSelector("li.eventCard", { timeout: 30_000 });
}

async function openBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

async function scrapeCoopLiveEvents(): Promise<RawEventInput[]> {
  const browser = await openBrowser();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-GB",
    viewport: { width: 1440, height: 1100 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  try {
    let nextUrl: string | null = EVENTS_URL;

    for (let pageNumber = 1; pageNumber <= MAX_PAGES && nextUrl; pageNumber += 1) {
      await page.goto(nextUrl, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await waitForListing(page);
      await dismissCookies(page);

      const html = await page.content();
      const batch = parseCoopLiveHtml(html, nextUrl);

      for (const event of batch) {
        const key = String(event.source_url);
        if (seen.has(key)) continue;
        seen.add(key);
        events.push(event);
      }

      const nextHref = await page
        .locator("a.next[rel='next'], a.btn.next")
        .first()
        .getAttribute("href")
        .catch(() => null);

      nextUrl = nextHref
        ? new URL(nextHref, "https://www.cooplive.com").toString()
        : null;
    }

    console.log(`[scraper:coop-live] scraped ${events.length} event(s)`);
    return events;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export const coopLiveScraper: ScraperDefinition = {
  id: "coop-live",
  source: SOURCE,
  scrape: scrapeCoopLiveEvents,
};
