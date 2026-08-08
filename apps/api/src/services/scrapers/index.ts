import type { RawEventInput } from "../aggregator.js";
import { closeBrowser } from "./engine.js";
import type { ScraperDefinition } from "./types.js";
import { albertHallScraper } from "./venues/albert-hall.js";
import { aoArenaScraper } from "./venues/ao-arena.js";
import { bandOnTheWallScraper } from "./venues/band-on-the-wall.js";
import { coopLiveScraper } from "./venues/coop-live.js";
import { manchesterCityCouncilScraper } from "./venues/manchester-city-council.js";
import { manchesterMetScraper } from "./venues/manchester-met.js";
import { o2RitzScraper } from "./venues/o2-ritz.js";
import { rncmScraper } from "./venues/rncm.js";
import { universityOfGreaterManchesterScraper } from "./venues/university-of-greater-manchester.js";
import { universityOfManchesterScraper } from "./venues/university-of-manchester.js";
import { universityOfSalfordScraper } from "./venues/university-of-salford.js";

/**
 * Enabled venue scrapers.
 * Import createVenueScraper definitions from `./venues/*.ts` and add them here.
 */
export const venueScrapers: ScraperDefinition[] = [
  aoArenaScraper,
  coopLiveScraper,
  bandOnTheWallScraper,
  o2RitzScraper,
  albertHallScraper,
  manchesterCityCouncilScraper,
  universityOfManchesterScraper,
  manchesterMetScraper,
  universityOfSalfordScraper,
  universityOfGreaterManchesterScraper,
  rncmScraper,
];

export async function runVenueScrapers(): Promise<RawEventInput[]> {
  if (venueScrapers.length === 0) {
    console.warn("[scrapers] no venue scrapers registered yet");
    return [];
  }

  try {
    const batches = await Promise.allSettled(
      venueScrapers.map((scraper) => scraper.scrape()),
    );

    return batches.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;
      const id = venueScrapers[index]?.id ?? String(index);
      console.error(`[scrapers] ${id} failed`, result.reason);
      return [];
    });
  } finally {
    await closeBrowser();
  }
}

export { createVenueScraper } from "./template.js";
export { closeBrowser, fetchHtml, loadDocument } from "./engine.js";
export type { ScraperDefinition, VenueScraperConfig } from "./types.js";
