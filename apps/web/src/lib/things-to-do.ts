/**
 * Things to Do — experience discovery (separate from date-bound Event listings).
 * Manual registry for now; Viator / Fever can plug in later without changing the page shape.
 *
 * Viator API licence constraints (enforce in code when Viator content is added):
 * 1. Use Viator content/API only to drive affiliate traffic to Viator.com.
 * 2. Use only on happenmcr.com — do not redistribute content/API access.
 * 3. Call Viator APIs only as documented.
 * 4. Do not bid on Viator trademarks/keywords in ads or SEO keyword targets.
 * 5. Do not index Viator unique content (no indexable detail pages / no Viator
 *    copy in sitemap or structured data; licensed cards use data-nosnippet).
 */

export type ExperienceProvider = "viator" | "fever" | "manual";

export type ExperienceCategoryId =
  | "walking-city-tours"
  | "stadium-sports"
  | "food-drink"
  | "sightseeing-attractions"
  | "unique-experiences"
  | "free-things-to-do";

export type Experience = {
  id: string;
  provider: ExperienceProvider;
  /** Provider-side id when available (dedupe key with provider). */
  externalId?: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  category: ExperienceCategoryId;
  location: string;
  /** Only set when known (e.g. free = 0). Never invent paid prices. */
  priceFrom?: number;
  currency?: "GBP";
  /** Official or affiliate booking URL — omit until a real destination exists. */
  affiliateUrl?: string;
  isActive: boolean;
  updatedAt: string;
};

export type ExperienceCategory = {
  id: ExperienceCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  image: string;
};

export const THINGS_TO_DO_PATH = "/things-to-do-in-manchester";

export const THINGS_TO_DO_TITLE =
  "Things to Do in Manchester | Experiences, Tours & Activities | HappenMCR";

export const THINGS_TO_DO_DESCRIPTION =
  "Discover the best things to do in Manchester, from walking tours and stadium experiences to food adventures, attractions and unique activities. Explore Manchester with HappenMCR.";

/** HappenMCR-owned discovery phrases only — never include “Viator” (trademark bidding rule). */
export const THINGS_TO_DO_KEYWORDS = [
  "things to do in Manchester",
  "Manchester experiences",
  "Manchester tours",
  "Manchester attractions",
  "Manchester activities",
  "HappenMCR",
] as const;

/** Allowed booking hosts for Viator-sourced experiences (affiliate traffic only). */
const VIATOR_BOOKING_HOSTS = new Set([
  "viator.com",
  "www.viator.com",
]);

/** Known-good Unsplash URLs (verified 200). Avoid broken IDs / wrong-city landmarks. */
const CATEGORY_IMAGES = {
  walking:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
  stadium:
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
  sightseeing:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  unique:
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80",
  free: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80",
} as const;

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  {
    id: "walking-city-tours",
    label: "Walking & City Tours",
    shortLabel: "Walking Tours",
    description: "Guided walks and city routes across Manchester.",
    href: `${THINGS_TO_DO_PATH}?category=walking-city-tours#experiences`,
    image: CATEGORY_IMAGES.walking,
  },
  {
    id: "stadium-sports",
    label: "Stadium & Sports Experiences",
    shortLabel: "Stadium Experiences",
    description: "Stadium tours and matchday-adjacent experiences.",
    href: `${THINGS_TO_DO_PATH}?category=stadium-sports#experiences`,
    image: CATEGORY_IMAGES.stadium,
  },
  {
    id: "food-drink",
    label: "Food & Drink Experiences",
    shortLabel: "Food Experiences",
    description: "Food halls, tastings, and culinary city highlights.",
    href: `${THINGS_TO_DO_PATH}?category=food-drink#experiences`,
    image: CATEGORY_IMAGES.food,
  },
  {
    id: "sightseeing-attractions",
    label: "Sightseeing & Attractions",
    shortLabel: "Sightseeing",
    description: "Museums, landmarks, and classic Manchester sights.",
    href: `${THINGS_TO_DO_PATH}?category=sightseeing-attractions#experiences`,
    image: CATEGORY_IMAGES.sightseeing,
  },
  {
    id: "unique-experiences",
    label: "Unique Experiences",
    shortLabel: "Unique Experiences",
    description: "One-off and distinctive things to try in the city.",
    href: `${THINGS_TO_DO_PATH}?category=unique-experiences#experiences`,
    image: CATEGORY_IMAGES.unique,
  },
  {
    id: "free-things-to-do",
    label: "Free Things to Do",
    shortLabel: "Free Things to Do",
    description: "No-ticket and free-entry Manchester plans.",
    href: `${THINGS_TO_DO_PATH}?category=free-things-to-do#experiences`,
    image: CATEGORY_IMAGES.free,
  },
];

/**
 * Curated manual listings with official destinations only.
 * No invented prices, ratings, or affiliate tracking params.
 */
const MANUAL_EXPERIENCES: Experience[] = [
  {
    id: "manual-science-industry-museum",
    provider: "manual",
    externalId: "science-and-industry-museum",
    title: "Science and Industry Museum",
    slug: "science-and-industry-museum",
    description:
      "Explore Manchester’s industrial story in the world’s oldest surviving passenger railway station — permanent galleries are free to enter.",
    imageUrl: CATEGORY_IMAGES.free,
    category: "free-things-to-do",
    location: "Castlefield, Manchester",
    priceFrom: 0,
    currency: "GBP",
    affiliateUrl: "https://www.scienceandindustrymuseum.org.uk/",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-manchester-art-gallery",
    provider: "manual",
    externalId: "manchester-art-gallery",
    title: "Manchester Art Gallery",
    slug: "manchester-art-gallery",
    description:
      "Free city-centre gallery with British art, design, and temporary exhibitions a short walk from St Peter’s Square.",
    imageUrl: CATEGORY_IMAGES.sightseeing,
    category: "sightseeing-attractions",
    location: "Mosley Street, Manchester",
    priceFrom: 0,
    currency: "GBP",
    affiliateUrl: "https://manchesterartgallery.org/",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-national-football-museum",
    provider: "manual",
    externalId: "national-football-museum",
    title: "National Football Museum",
    slug: "national-football-museum",
    description:
      "Interactive football history next to Cathedral Gardens — check the official site for current ticket options.",
    imageUrl:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80",
    category: "stadium-sports",
    location: "Urbis Building, Manchester",
    affiliateUrl: "https://www.nationalfootballmuseum.com/",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-etihad-stadium-tours",
    provider: "manual",
    externalId: "etihad-stadium-tours",
    title: "Etihad Stadium Tours",
    slug: "etihad-stadium-tours",
    description:
      "Go behind the scenes at Manchester City’s home — dressing rooms, tunnel, and pitchside views via the club’s official tour booking.",
    imageUrl:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80",
    category: "stadium-sports",
    location: "Etihad Campus, Manchester",
    affiliateUrl: "https://www.mancity.com/stadium-tours",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-peoples-history-museum",
    provider: "manual",
    externalId: "peoples-history-museum",
    title: "People’s History Museum",
    slug: "peoples-history-museum",
    description:
      "Britain’s national museum of democracy on the Irwell — banners, protest history, and riverside walks nearby.",
    imageUrl: CATEGORY_IMAGES.sightseeing,
    category: "sightseeing-attractions",
    location: "Left Bank, Manchester",
    affiliateUrl: "https://phm.org.uk/",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-castlefield-walk",
    provider: "manual",
    externalId: "castlefield-canal-walk",
    title: "Castlefield Canal Walk",
    slug: "castlefield-canal-walk",
    description:
      "A free self-guided stroll through Roman ruins, canal basins, and railway arches in Castlefield.",
    imageUrl: CATEGORY_IMAGES.walking,
    category: "walking-city-tours",
    location: "Castlefield, Manchester",
    priceFrom: 0,
    currency: "GBP",
    affiliateUrl: "https://www.visitmanchester.com/things-to-do/castlefield-p24191",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-mackie-mayor",
    provider: "manual",
    externalId: "mackie-mayor",
    title: "Mackie Mayor Food Hall",
    slug: "mackie-mayor-food-hall",
    description:
      "Victorian market hall turned food destination in the Northern Quarter — traders rotate, so check what’s open before you go.",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    category: "food-drink",
    location: "Northern Quarter, Manchester",
    affiliateUrl: "https://www.mackiemayor.co.uk/",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
  {
    id: "manual-home-mcr",
    provider: "manual",
    externalId: "home-manchester",
    title: "HOME Manchester",
    slug: "home-manchester",
    description:
      "Independent cinema, theatre, and gallery space at First Street — a distinctive night out beyond the usual gig circuit.",
    imageUrl: CATEGORY_IMAGES.unique,
    category: "unique-experiences",
    location: "First Street, Manchester",
    affiliateUrl: "https://homemcr.org/",
    isActive: true,
    updatedAt: "2026-11-18T00:00:00.000Z",
  },
];

const categoriesById = new Map(
  EXPERIENCE_CATEGORIES.map((category) => [category.id, category]),
);

function experienceDedupeKey(experience: Experience): string {
  if (experience.externalId) {
    return `${experience.provider}:${experience.externalId}`.toLowerCase();
  }
  return `${experience.provider}:${experience.slug}`.toLowerCase();
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Viator licence: booking links must send users to Viator.com only.
 * Manual picks may use any https official destination.
 */
export function isAllowedAffiliateUrl(
  provider: ExperienceProvider,
  url: string | undefined,
): boolean {
  const href = url?.trim();
  if (!href) return false;
  const host = hostnameOf(href);
  if (!host) return false;
  if (provider === "viator") return VIATOR_BOOKING_HOSTS.has(host);
  // Fever / other partners: https only until their allowlist is added.
  return href.startsWith("https://");
}

/**
 * Viator unique content must not be indexed. Manual HappenMCR copy may be.
 * Never emit licensed provider copy into sitemap or JSON-LD.
 */
export function isLicensedPartnerContent(
  experience: Pick<Experience, "provider">,
): boolean {
  return experience.provider === "viator" || experience.provider === "fever";
}

/** Short teaser safe to show for licensed partners (no full unique copy). */
export function experienceDisplayDescription(
  experience: Experience,
): string | null {
  if (isLicensedPartnerContent(experience)) {
    return null;
  }
  const text = experience.description.trim();
  return text.length > 0 ? text : null;
}

export function resolveAffiliateUrl(
  experience: Experience,
): string | undefined {
  const href = experience.affiliateUrl?.trim();
  if (!href) return undefined;
  if (!isAllowedAffiliateUrl(experience.provider, href)) return undefined;
  return href;
}

function pushUnique(
  out: Experience[],
  seen: Set<string>,
  experience: Experience,
): void {
  if (!experience.isActive) return;
  if (
    isLicensedPartnerContent(experience) &&
    !resolveAffiliateUrl(experience)
  ) {
    return;
  }
  const key = experienceDedupeKey(experience);
  if (seen.has(key)) return;
  seen.add(key);
  out.push(experience);
}

/** Manual curated experiences only. */
export function listManualExperiences(): Experience[] {
  const seen = new Set<string>();
  const out: Experience[] = [];
  for (const experience of MANUAL_EXPERIENCES) {
    pushUnique(out, seen, experience);
  }
  return out;
}

/**
 * Merge Viator + manual. Viator first so partner inventory leads;
 * manual fills gaps without duplicating provider:externalId keys.
 */
export function mergeExperiences(
  viator: Experience[],
  manual: Experience[] = listManualExperiences(),
): Experience[] {
  const seen = new Set<string>();
  const out: Experience[] = [];
  for (const experience of viator) pushUnique(out, seen, experience);
  for (const experience of manual) pushUnique(out, seen, experience);
  return out;
}

/** @deprecated Prefer mergeExperiences(getViatorExperiences()) on pages. */
export function listExperiences(): Experience[] {
  return listManualExperiences();
}

/** Experiences whose copy may appear in indexable SEO surfaces. */
export function listIndexableExperiences(): Experience[] {
  return listExperiences().filter((item) => !isLicensedPartnerContent(item));
}

export function getExperienceCategory(
  id: string,
): ExperienceCategory | null {
  return categoriesById.get(id as ExperienceCategoryId) ?? null;
}

export function filterExperiencesByCategory(
  experiences: Experience[],
  categoryId: string | null | undefined,
): Experience[] {
  if (!categoryId) return experiences;
  const category = getExperienceCategory(categoryId);
  if (!category) return experiences;
  return experiences.filter((item) => item.category === category.id);
}

export function providerLabel(provider: ExperienceProvider): string {
  switch (provider) {
    case "viator":
      return "Viator";
    case "fever":
      return "Fever";
    default:
      return "HappenMCR pick";
  }
}

export function formatExperiencePrice(
  experience: Pick<Experience, "priceFrom" | "currency">,
): string | null {
  if (experience.priceFrom === undefined || experience.priceFrom === null) {
    return null;
  }
  if (experience.priceFrom === 0) return "Free";
  const currency = experience.currency ?? "GBP";
  try {
    return `From ${new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(experience.priceFrom)}`;
  } catch {
    return `From ${experience.priceFrom} ${currency}`;
  }
}

/** Homepage teaser — four priority categories. */
export function listHomeTeaserCategories(): ExperienceCategory[] {
  const ids: ExperienceCategoryId[] = [
    "walking-city-tours",
    "stadium-sports",
    "food-drink",
    "sightseeing-attractions",
  ];
  return ids
    .map((id) => categoriesById.get(id))
    .filter((item): item is ExperienceCategory => Boolean(item));
}
