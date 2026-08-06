import type { Cheerio, CheerioAPI } from "cheerio";
import type { RawEventInput } from "../aggregator.js";

export type ScrapeMode = "cheerio" | "playwright";

type ScrapeElement = Cheerio<any>;

export type FieldExtractor =
  | string
  | ((
      element: ScrapeElement,
      $: CheerioAPI,
      context: { pageUrl: string },
    ) => string | string[] | boolean | number | null | undefined);

export type VenueScraperConfig = {
  /** Unique scraper id for logs */
  id: string;
  /** Stored on events as `source` */
  source: string;
  /** Listing page URLs to scrape */
  startUrls: string[];
  /** Default venue metadata applied to every scraped event */
  venue?: {
    name?: string;
    address?: string;
    lat?: number;
    lon?: number;
  };
  mode?: ScrapeMode;
  /** CSS selector that must appear before Playwright considers the page ready */
  waitForSelector?: string;
  /** Selector matching each event card/row on the listing page */
  listSelector: string;
  fields: {
    title: FieldExtractor;
    description?: FieldExtractor;
    start_time: FieldExtractor;
    end_time?: FieldExtractor;
    venue_name?: FieldExtractor;
    venue_address?: FieldExtractor;
    category?: FieldExtractor;
    tags?: FieldExtractor;
    source_url?: FieldExtractor;
    image_url?: FieldExtractor;
    ticket_url?: FieldExtractor;
    is_free?: FieldExtractor;
  };
  /** Optional transform after field extraction */
  mapEvent?: (
    event: RawEventInput,
    element: ScrapeElement,
    $: CheerioAPI,
  ) => RawEventInput;
};

export type ScraperDefinition = {
  id: string;
  source: string;
  scrape: () => Promise<RawEventInput[]>;
};
