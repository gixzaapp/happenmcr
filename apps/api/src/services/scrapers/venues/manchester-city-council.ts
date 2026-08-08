import { chromium } from "playwright";
import type { RawEventInput } from "../../aggregator.js";
import type { ScraperDefinition } from "../types.js";

/**
 * Manchester City Council public events calendar.
 *
 * Hub: https://www.manchester.gov.uk/parks-leisure-and-the-arts
 * → Events & tourism → https://www.manchester.gov.uk/events
 *
 * Listings come from Funnelback (Cloudflare-protected JSON), not the hub HTML.
 */
const SOURCE = "scraper:manchester-city-council";
const HUB_URL = "https://www.manchester.gov.uk/parks-leisure-and-the-arts";
const EVENTS_PAGE = "https://www.manchester.gov.uk/events";
const SEARCH_JSON =
  "https://manchester2-search.funnelback.squiz.cloud/s/search.json";

const PAGE_SIZE = 50;
const MAX_PAGES = 10;
/** Look ahead ~1 year of events */
const HORIZON_DAYS = 366;

type FunnelbackResult = {
  title?: string;
  liveUrl?: string;
  indexUrl?: string;
  displayUrl?: string;
  summary?: string;
  listMetadata?: Record<string, string[] | undefined>;
};

type FunnelbackResponse = {
  response?: {
    resultPacket?: {
      results?: FunnelbackResult[];
      resultsSummary?: {
        totalMatching?: number;
        currEnd?: number;
        nextStart?: number | null;
      };
    };
  };
};

function meta(
  result: FunnelbackResult,
  key: string,
): string | null {
  const value = result.listMetadata?.[key]?.[0];
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function unixToIso(raw: string | null): string | null {
  if (!raw) return null;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

/** Parse display dates like "Wednesday 12 August 2026" as London noon fallback. */
function parseDisplayDate(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function eventTitle(result: FunnelbackResult): string | null {
  return (
    meta(result, "eventTitle") ||
    (result.title && !/^https?:\/\//i.test(result.title)
      ? result.title.replace(/\s+/g, " ").trim()
      : null) ||
    null
  );
}

function eventUrl(result: FunnelbackResult): string {
  const raw =
    result.liveUrl || result.indexUrl || result.displayUrl || EVENTS_PAGE;
  try {
    return new URL(raw, EVENTS_PAGE).toString();
  } catch {
    return EVENTS_PAGE;
  }
}

function isFreeCost(cost: string | null): boolean {
  if (!cost) return false;
  return /\bfree\b/i.test(cost) || cost.trim() === "0" || /£\s*0\b/.test(cost);
}

export function mapFunnelbackResults(
  results: FunnelbackResult[],
): RawEventInput[] {
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const title = eventTitle(result);
    if (!title) continue;

    const start =
      unixToIso(meta(result, "startDateTimestamp")) ||
      parseDisplayDate(meta(result, "startDate"));
    if (!start) continue;

    const end =
      unixToIso(meta(result, "endDateTimestamp")) ||
      parseDisplayDate(meta(result, "endDate"));

    const location = meta(result, "location");
    const cost = meta(result, "cost");
    const description =
      meta(result, "introText") ||
      (result.summary ? result.summary.replace(/\s+/g, " ").trim() : null);
    const sourceUrl = eventUrl(result);
    const image =
      meta(result, "I") ||
      meta(result, "image") ||
      meta(result, "thumbnail");

    const key = `${title}|${start}|${sourceUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      title,
      description: description || null,
      start_time: start,
      end_time: end && end !== start ? end : null,
      venue_name: location || "Manchester",
      venue_address: location,
      lat: 53.4808,
      lon: -2.2426,
      category: "Community",
      tags: [
        "manchester-city-council",
        "parks-leisure-arts",
        "mcr-buzz",
        ...(cost ? [cost] : []),
      ],
      source: SOURCE,
      source_url: sourceUrl,
      image_url: image,
      ticket_url: sourceUrl,
      is_free: isFreeCost(cost),
    });
  }

  return events;
}

async function fetchFunnelbackPage(
  page: {
    evaluate: <T>(fn: (url: string) => Promise<T>, arg: string) => Promise<T>;
  },
  startRank: number,
  todayUnix: number,
  horizonUnix: number,
): Promise<{ results: FunnelbackResult[]; totalMatching: number }> {
  const url = new URL(SEARCH_JSON);
  url.searchParams.set("collection", "manchester~sp-search");
  url.searchParams.set("profile", "search");
  url.searchParams.set("sort", "date");
  url.searchParams.set("gscope1", "events");
  url.searchParams.set("num_ranks", String(PAGE_SIZE));
  url.searchParams.set("start_rank", String(startRank));
  // Match MCC calendarWidget: events ending on/after today, starting on/before horizon
  url.searchParams.set("ge_endDateTimestamp", String(todayUnix));
  url.searchParams.set("le_startDateTimestamp", String(horizonUnix));

  const payload = await page.evaluate(async (apiUrl) => {
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
    });
    const text = await response.text();
    return { status: response.status, text };
  }, url.toString());

  if (payload.status !== 200) {
    throw new Error(
      `Funnelback search failed (${payload.status}): ${payload.text.slice(0, 200)}`,
    );
  }

  const data = JSON.parse(payload.text) as FunnelbackResponse;
  const packet = data.response?.resultPacket;
  return {
    results: packet?.results ?? [],
    totalMatching: packet?.resultsSummary?.totalMatching ?? 0,
  };
}

async function scrapeManchesterCouncilEvents(): Promise<RawEventInput[]> {
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

  try {
    // Establish Cloudflare cookies against the council site first.
    await page.goto(HUB_URL, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto(EVENTS_PAGE, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await page.waitForTimeout(2_500);

    for (const label of ["Allow all", "Accept all", "Accept All", "OK"]) {
      const btn = page.getByRole("button", { name: label });
      if ((await btn.count()) > 0) {
        await btn.first().click().catch(() => undefined);
        break;
      }
    }

    const now = Math.floor(Date.now() / 1000);
    // Start of today (UTC) is fine; MCC uses local midnight but API accepts unix
    const todayUnix = now - (now % 86_400);
    const horizonUnix = todayUnix + HORIZON_DAYS * 86_400;

    const all: FunnelbackResult[] = [];
    let startRank = 1;

    for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex += 1) {
      const { results, totalMatching } = await fetchFunnelbackPage(
        page,
        startRank,
        todayUnix,
        horizonUnix,
      );

      if (results.length === 0) break;
      all.push(...results);

      if (all.length >= totalMatching) break;
      startRank += PAGE_SIZE;
      await page.waitForTimeout(400);
    }

    const events = mapFunnelbackResults(all);
    console.log(
      `[scraper:manchester-city-council] scraped ${events.length} event(s) (hub ${HUB_URL} → ${EVENTS_PAGE})`,
    );
    return events;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export const manchesterCityCouncilScraper: ScraperDefinition = {
  id: "manchester-city-council",
  source: SOURCE,
  scrape: scrapeManchesterCouncilEvents,
};
