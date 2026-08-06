import { chromium, type Page } from "playwright";
import type { RawEventInput } from "../../aggregator.js";
import { loadDocument } from "../engine.js";
import type { ScraperDefinition } from "../types.js";

const EVENTS_URL = "https://bandonthewall.org/whats-on/";
const SOURCE = "scraper:band-on-the-wall";
const MONTHS_TO_SCRAPE = 6;

const VENUE = {
  name: "Band on the Wall",
  address: "25 Swan Street, Northern Quarter, Manchester M4 5JZ",
  lat: 53.4855,
  lon: -2.2342,
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

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function text(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseMonth(raw: string): number | null {
  return MONTHS[text(raw).toLowerCase()] ?? null;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse "Wed 05 Aug" using an active listing year. */
function parseBotwDate(raw: string, year: number): string | null {
  const match = text(raw).match(/(?:\w{3}\s+)?(\d{1,2})\s+([A-Za-z]+)/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = parseMonth(match[2]);
  if (!day || !month) return null;
  return toIsoDate(year, month, day);
}

/** Parse times like "8.00PM" / "7.30PM" / "20:00". */
function parseBotwTime(raw: string): string | null {
  const value = text(raw);
  const match = value.match(/^(\d{1,2})[.:](\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function parseActiveYear(label: string, fallback = new Date().getFullYear()): number {
  const match = text(label).match(/(\d{4})/);
  return match ? Number(match[1]) : fallback;
}

function roomFromTag(className: string, label: string): string {
  if (/venue-copper/i.test(className) || /copper/i.test(label)) {
    return "The Copper Bar";
  }
  return VENUE.name;
}

export function parseBandOnTheWallHtml(
  html: string,
  activeYear: number,
  pageUrl = EVENTS_URL,
): RawEventInput[] {
  const $ = loadDocument(html);
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  $("article").each((_, node) => {
    const el = $(node);
    const titleLink = el.find("p.font-header a").first();
    const title = text(titleLink.text());
    if (!title) return;

    const metaSpans = el
      .find(".uppercase.flex.items-center span")
      .toArray()
      .map((span) => text($(span).text()))
      .filter(Boolean);

    const dateRaw = metaSpans.find((value) => /\d{1,2}\s+[A-Za-z]+/.test(value));
    const timeRaw = metaSpans.find((value) => /\d{1,2}[.:]\d{2}/.test(value));
    if (!dateRaw) return;

    const startDate = parseBotwDate(dateRaw, activeYear);
    if (!startDate) return;

    const detailUrl = titleLink.attr("href")
      ? new URL(titleLink.attr("href")!, pageUrl).toString()
      : pageUrl;

    const dedupeKey = `${title}|${startDate}|${detailUrl}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const venueTag = el.find("span.tag").first();
    const roomLabel = text(venueTag.find("span").last().text());
    const room = roomFromTag(venueTag.attr("class") ?? "", roomLabel);
    const description = text(el.find("span.leading-tight").first().text());
    const imageSrc = el.find("img").first().attr("src");
    const ticketHref = el
      .find("a")
      .toArray()
      .map((anchor) => ({
        href: $(anchor).attr("href") ?? "",
        label: text($(anchor).text()),
      }))
      .find((anchor) => /ticket/i.test(anchor.label) || /seetickets\.com/i.test(anchor.href))
      ?.href;

    const free =
      metaSpans.some((value) => /\bfree\b/i.test(value)) ||
      /\bfree\b/i.test(description) ||
      (!ticketHref && /copper/i.test(room));

    events.push({
      title,
      description: description || null,
      start_time: `${startDate}T${parseBotwTime(timeRaw ?? "") ?? "00:00:00"}`,
      end_time: null,
      venue_name: room,
      venue_address: VENUE.address,
      lat: VENUE.lat,
      lon: VENUE.lon,
      category: "Live music",
      tags: [
        "band-on-the-wall",
        "manchester",
        ...(room !== VENUE.name ? [room] : []),
        ...(description ? [description] : []),
      ],
      source: SOURCE,
      source_url: detailUrl,
      image_url: imageSrc ? new URL(imageSrc, pageUrl).toString() : null,
      ticket_url: ticketHref
        ? new URL(ticketHref, pageUrl).toString()
        : detailUrl,
      is_free: free,
    });
  });

  return events;
}

async function getActiveMonthLabel(page: Page): Promise<string> {
  const label = await page
    .locator("button[id^='headlessui-popover-button']")
    .first()
    .innerText()
    .catch(() => "");
  return text(label);
}

async function goToNextMonth(page: Page, currentLabel: string): Promise<boolean> {
  const currentMonth = text(currentLabel).match(
    /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
  )?.[1];
  if (!currentMonth) return false;

  const currentIndex = parseMonth(currentMonth);
  if (!currentIndex) return false;

  const nextAbbr = MONTH_ABBR[currentIndex % 12];
  const button = page
    .locator("button")
    .filter({ hasText: new RegExp(`^\\s*${nextAbbr}\\s*$`, "i") })
    .first();

  if ((await button.count()) === 0) return false;
  const disabled = await button.isDisabled().catch(() => true);
  if (disabled) return false;

  await button.click();
  await page.waitForTimeout(1500);
  await page.waitForSelector("article", { timeout: 15_000 }).catch(() => undefined);
  return true;
}

async function scrapeBandOnTheWallEvents(): Promise<RawEventInput[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-GB",
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  try {
    await page.goto(EVENTS_URL, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await page.waitForSelector("article", { timeout: 30_000 });

    for (const label of ["Accept", "Allow all", "Accept All", "OK"]) {
      const btn = page.getByRole("button", { name: label });
      if ((await btn.count()) > 0) {
        await btn.first().click().catch(() => undefined);
        break;
      }
    }

    for (let month = 0; month < MONTHS_TO_SCRAPE; month += 1) {
      const activeLabel = await getActiveMonthLabel(page);
      const year = parseActiveYear(activeLabel);
      const html = await page.content();
      const batch = parseBandOnTheWallHtml(html, year, EVENTS_URL);

      for (const event of batch) {
        const key = `${event.title}|${event.start_time}|${event.source_url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        events.push(event);
      }

      if (month === MONTHS_TO_SCRAPE - 1) break;
      const moved = await goToNextMonth(page, activeLabel);
      if (!moved) break;
    }

    console.log(`[scraper:band-on-the-wall] scraped ${events.length} event(s)`);
    return events;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export const bandOnTheWallScraper: ScraperDefinition = {
  id: "band-on-the-wall",
  source: SOURCE,
  scrape: scrapeBandOnTheWallEvents,
};
