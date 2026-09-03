export const MCR_HISTORY_PATH = "/mcr-buzz/history";
export const MCR_HISTORY_LABEL = "History";

/** SEO — stable publish date for Article schema (page launch). */
export const MCR_HISTORY_PUBLISHED = "2026-09-03";

export const MCR_HISTORY_HEADLINE = "The History of Manchester";

export const MCR_HISTORY_DESCRIPTION =
  "Discover Manchester's history from Roman Mamucium and Cottonopolis to the Ship Canal, the Manchester Baby computer, and today's regenerated metropolis.";

export const MCR_HISTORY_KEYWORDS = [
  "Manchester history",
  "history of Manchester",
  "Cottonopolis",
  "Mamucium",
  "Manchester industrial revolution",
  "Manchester Ship Canal",
  "Manchester Baby computer",
  "Castlefield Manchester",
  "Greater Manchester history",
  "MCR Buzz",
  "HappenMCR",
] as const;

/** Share image — Wikimedia Commons (absolute URL for Open Graph). */
export const MCR_HISTORY_OG_IMAGE =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Manchester%20Skyline.jpg";

/** Wikimedia Commons — direct paths via Special:FilePath redirect. */
export const MANCHESTER_HISTORY_IMAGES = {
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Manchester%20Skyline.jpg",
  romanFort:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Reconstruction%20of%20the%20Roman%20fort%2C%20Castlefield%20-%20geograph.org.uk%20-%206509245.jpg",
  mills:
    "https://commons.wikimedia.org/wiki/Special:FilePath/McConnel%20%26%20Company%20mills%2C%20about%201820.jpg",
  shipCanal:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Manchester%20Ship%20Canal%2C%20Salford%20Quays%20(geograph%203720284).jpg",
  skyline:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Manchester%20Skyline.jpg",
} as const;

export const MANCHESTER_HISTORY_TIMELINE = [
  { year: "AD 79", label: "Mamucium fort founded", sectionId: "roman-origins" },
  { year: "1764", label: "Spinning jenny invented", sectionId: "industrial-giant" },
  { year: "1830", label: "99 cotton mills in the city", sectionId: "industrial-giant" },
  { year: "1894", label: "Ship Canal opens", sectionId: "innovation-beyond-cotton" },
  { year: "1948", label: "Manchester Baby computer", sectionId: "innovation-beyond-cotton" },
  { year: "1990s–", label: "Post-industrial regeneration", sectionId: "decline-and-reinvention" },
] as const;

export const MANCHESTER_HISTORY_SECTIONS = [
  { id: "roman-origins", title: "Roman Origins" },
  { id: "industrial-giant", title: "The Birth of an Industrial Giant" },
  { id: "innovation-beyond-cotton", title: "Innovation Beyond Cotton" },
  { id: "decline-and-reinvention", title: "Decline and Reinvention" },
  { id: "city-shaping-world", title: "A City Still Shaping the World" },
] as const;
