import type { CheerioAPI } from "cheerio";
import type { RawEventInput } from "../aggregator.js";
import { fetchHtml, loadDocument } from "./engine.js";
import type {
  FieldExtractor,
  ScraperDefinition,
  VenueScraperConfig,
} from "./types.js";

type ScrapeElement = Parameters<NonNullable<VenueScraperConfig["mapEvent"]>>[1];

function extractField(
  extractor: FieldExtractor | undefined,
  element: ScrapeElement,
  $: CheerioAPI,
  pageUrl: string,
): string | string[] | boolean | number | null {
  if (!extractor) return null;

  if (typeof extractor === "function") {
    const value = extractor(element, $, { pageUrl });
    return value ?? null;
  }

  const selected = element.find(extractor).first();
  if (!selected.length) {
    const selfMatch = element.is(extractor) ? element : null;
    if (selfMatch) {
      const href = selfMatch.attr("href");
      if (href) return resolveUrl(pageUrl, href);
      const src = selfMatch.attr("src");
      if (src) return resolveUrl(pageUrl, src);
      const text = selfMatch.text().replace(/\s+/g, " ").trim();
      return text || null;
    }
    return null;
  }

  const href = selected.attr("href");
  if (href) return resolveUrl(pageUrl, href);

  const src = selected.attr("src") ?? selected.attr("data-src");
  if (src) return resolveUrl(pageUrl, src);

  const datetime = selected.attr("datetime");
  if (datetime) return datetime.trim();

  const content = selected.attr("content");
  if (content) return content.trim();

  const text = selected.text().replace(/\s+/g, " ").trim();
  return text || null;
}

function resolveUrl(baseUrl: string, value: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function scrapeListingPage(
  html: string,
  pageUrl: string,
  config: VenueScraperConfig,
): RawEventInput[] {
  const $ = loadDocument(html);
  const events: RawEventInput[] = [];

  $(config.listSelector).each((_, node) => {
    const element = $(node);

    const title = extractField(config.fields.title, element, $, pageUrl);
    const startTime = extractField(config.fields.start_time, element, $, pageUrl);

    if (typeof title !== "string" || !title || typeof startTime !== "string" || !startTime) {
      return;
    }

    let event: RawEventInput = {
      title,
      description: extractField(config.fields.description, element, $, pageUrl),
      start_time: startTime,
      end_time: extractField(config.fields.end_time, element, $, pageUrl),
      venue_name:
        extractField(config.fields.venue_name, element, $, pageUrl) ??
        config.venue?.name ??
        null,
      venue_address:
        extractField(config.fields.venue_address, element, $, pageUrl) ??
        config.venue?.address ??
        null,
      lat: config.venue?.lat ?? null,
      lon: config.venue?.lon ?? null,
      category: extractField(config.fields.category, element, $, pageUrl),
      tags: extractField(config.fields.tags, element, $, pageUrl) ?? [],
      source: config.source,
      source_url: extractField(config.fields.source_url, element, $, pageUrl) ?? pageUrl,
      image_url: extractField(config.fields.image_url, element, $, pageUrl),
      ticket_url: extractField(config.fields.ticket_url, element, $, pageUrl),
      is_free: extractField(config.fields.is_free, element, $, pageUrl),
    };

    if (config.mapEvent) {
      event = config.mapEvent(event, element, $);
    }

    events.push(event);
  });

  return events;
}

/**
 * Build a venue listing scraper from a declarative config.
 * Use `mode: "cheerio"` for static HTML, `"playwright"` for JS-rendered pages.
 */
export function createVenueScraper(config: VenueScraperConfig): ScraperDefinition {
  return {
    id: config.id,
    source: config.source,
    scrape: async () => {
      const results: RawEventInput[] = [];

      for (const url of config.startUrls) {
        const html = await fetchHtml(url, {
          mode: config.mode ?? "cheerio",
          waitForSelector: config.waitForSelector ?? config.listSelector,
        });
        results.push(...scrapeListingPage(html, url, config));
      }

      console.log(
        `[scraper:${config.id}] scraped ${results.length} event(s) from ${config.startUrls.length} page(s)`,
      );
      return results;
    },
  };
}
