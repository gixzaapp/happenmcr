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
 * University of Salford public what's-on listing.
 * https://www.salford.ac.uk/events
 */
const SOURCE = "scraper:university-of-salford";
const LIST_URL = "https://www.salford.ac.uk/events";

const CAMPUS = {
  name: "University of Salford",
  address: "43 Crescent, Salford M5 4WT",
  lat: 53.4875,
  lon: -2.2734,
};

function parseListingCards(html: string): Array<{
  href: string;
  title: string;
  teaser: string;
  imageUrl: string | null;
}> {
  const $ = cheerio.load(html);
  const cards: Array<{
    href: string;
    title: string;
    teaser: string;
    imageUrl: string | null;
  }> = [];

  $(".node--type-event, .views-row .uos-card").each((_, el) => {
    const $el = $(el);
    const href = absoluteUrl($el.find("a[href*='/events/']").first().attr("href"), LIST_URL);
    if (!href) return;
    const title =
      cleanText($el.find(".uos-card__title, h2, h3").first().text()) ||
      cleanText($el.find("a[rel='bookmark']").attr("aria-label")) ||
      cleanText($el.find("img").attr("alt"));
    const teaser = cleanText($el.text());
    const imageUrl =
      absoluteUrl($el.find("img").attr("src") || $el.find("source").attr("srcset")?.split(" ")[0], LIST_URL);
    if (!title) return;
    cards.push({ href, title, teaser, imageUrl });
  });

  return cards;
}

function parseDetail(html: string, pageUrl: string, fallbackTitle: string) {
  const $ = cheerio.load(html);
  const title =
    cleanText($("h1").first().text()) ||
    cleanText($("meta[property='og:title']").attr("content")) ||
    fallbackTitle;
  const description =
    cleanText($("meta[name='description']").attr("content")) ||
    cleanText($(".field--name-body, .uos-content, article").first().text()).slice(0, 800) ||
    null;

  const body = cleanText($("main, article, body").first().text());
  const ymd =
    parseEnglishDate(body) ||
    parseEnglishDate(cleanText($("time").attr("datetime") || $("time").text()));
  const { start, end } = parseTimeFromText(body);

  const imageUrl =
    absoluteUrl($("meta[property='og:image']").attr("content"), pageUrl) ||
    absoluteUrl($("img").first().attr("src"), pageUrl);

  return {
    title,
    description,
    ymd,
    start,
    end,
    imageUrl,
    free: looksFree(body, description ?? ""),
  };
}

export async function scrapeUniversityOfSalfordEvents(): Promise<RawEventInput[]> {
  const listHtml = await fetchText(LIST_URL);
  const cards = parseListingCards(listHtml);
  const events: RawEventInput[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    if (seen.has(card.href)) continue;
    seen.add(card.href);

    let detail = {
      title: card.title,
      description: null as string | null,
      ymd: parseEnglishDate(card.teaser),
      start: parseTimeFromText(card.teaser).start,
      end: parseTimeFromText(card.teaser).end,
      imageUrl: card.imageUrl,
      free: looksFree(card.teaser),
    };

    try {
      const detailHtml = await fetchText(card.href);
      detail = { ...detail, ...parseDetail(detailHtml, card.href, card.title) };
    } catch (error) {
      console.warn(`[scrapers] salford detail failed ${card.href}`, error);
    }

    if (!detail.ymd) continue;
    const startTime = combineLondonDateTime(detail.ymd, detail.start);
    if (!startTime) continue;

    events.push(
      universityEvent({
        title: detail.title || card.title,
        description: detail.description,
        startTime,
        endTime: detail.end
          ? combineLondonDateTime(detail.ymd, detail.end)
          : null,
        venueName: CAMPUS.name,
        venueAddress: CAMPUS.address,
        lat: CAMPUS.lat,
        lon: CAMPUS.lon,
        source: SOURCE,
        sourceUrl: card.href,
        imageUrl: detail.imageUrl,
        isFree: detail.free,
        extraTags: ["salford", "university of salford"],
      }),
    );
  }

  return events;
}

export const universityOfSalfordScraper: ScraperDefinition = {
  id: "university-of-salford",
  source: SOURCE,
  scrape: scrapeUniversityOfSalfordEvents,
};
