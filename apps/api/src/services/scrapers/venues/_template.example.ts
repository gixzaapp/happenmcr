/**
 * Copy this file when adding a new Manchester venue scraper.
 *
 * 1. Duplicate as `venues/<venue-slug>.ts`
 * 2. Fill in selectors against the venue's what's-on page
 * 3. Export the scraper and register it in `../index.ts`
 */
import { createVenueScraper } from "../template.js";

export const exampleVenueScraper = createVenueScraper({
  id: "example-venue",
  source: "scraper:example-venue",
  startUrls: ["https://example.com/whats-on"],
  mode: "cheerio", // or "playwright" for JS-heavy listings
  // waitForSelector: ".event-card",
  venue: {
    name: "Example Venue",
    address: "Manchester",
    lat: 53.4808,
    lon: -2.2426,
  },
  listSelector: ".event-card",
  fields: {
    title: ".event-card__title",
    description: ".event-card__description",
    start_time: "time[datetime]",
    end_time: ".event-card__end",
    source_url: "a.event-card__link",
    image_url: "img.event-card__image",
    ticket_url: "a.event-card__tickets",
    category: ".event-card__category",
    tags: (el, $) =>
      el
        .find(".event-card__tag")
        .map((_, tag) => $(tag).text().trim())
        .get()
        .filter(Boolean),
    is_free: (el) => el.find(".event-card__price").text().toLowerCase().includes("free"),
  },
  mapEvent: (event) => ({
    ...event,
    tags: Array.isArray(event.tags) ? event.tags : [],
  }),
});
