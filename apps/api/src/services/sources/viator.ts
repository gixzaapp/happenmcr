/**
 * Viator Partner API (Basic Access) — Manchester products for Things to Do.
 *
 * Licence constraints enforced by callers/UI:
 * - Drive traffic only to productUrl on viator.com
 * - Do not index unique Viator copy (no detail pages / nosnippet)
 * - Use only as documented (products/search, destinations, tags)
 */

export type ViatorExperienceCategory =
  | "walking-city-tours"
  | "stadium-sports"
  | "food-drink"
  | "sightseeing-attractions"
  | "unique-experiences"
  | "free-things-to-do";

export type ViatorExperienceDto = {
  id: string;
  provider: "viator";
  externalId: string;
  title: string;
  slug: string;
  /** Intentionally empty for index-safety; UI shows book-on-Viator teaser. */
  description: string;
  imageUrl?: string;
  category: ViatorExperienceCategory;
  location: string;
  priceFrom?: number;
  currency?: "GBP";
  affiliateUrl?: string;
  isActive: boolean;
  updatedAt: string;
};

type ViatorImageVariant = {
  height?: number;
  width?: number;
  url?: string;
};

type ViatorProduct = {
  productCode?: string;
  title?: string;
  description?: string;
  images?: Array<{
    isCover?: boolean;
    variants?: ViatorImageVariant[];
  }>;
  pricing?: {
    summary?: {
      fromPrice?: number;
      fromPriceBeforeDiscount?: number;
    };
    currency?: string;
  };
  productUrl?: string;
  tags?: number[];
  flags?: string[];
};

type ViatorSearchResponse = {
  products?: ViatorProduct[];
  totalCount?: number;
  code?: string;
  message?: string;
};

type ViatorDestination = {
  destinationId?: number | string;
  name?: string;
  type?: string;
  parentDestinationId?: number | string;
};

type ViatorDestinationsResponse = {
  destinations?: ViatorDestination[];
  totalCount?: number;
};

const DEFAULT_BASE = "https://api.sandbox.viator.com/partner";
/** Fallback if destinations lookup fails — override with VIATOR_DESTINATION_ID. */
const FALLBACK_MANCHESTER_DESTINATION_ID = "737";
const PAGE_SIZE = 50;
const MAX_PAGES = 3;

let cachedDestinationId: string | null = null;
let cachedDestinationAt = 0;
const DESTINATION_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

function getApiKey(): string | null {
  const key = process.env.VIATOR_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function getBaseUrl(): string {
  return (
    process.env.VIATOR_API_BASE_URL?.trim().replace(/\/$/, "") || DEFAULT_BASE
  );
}

function viatorHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) throw new Error("VIATOR_API_KEY missing");
  return {
    "exp-api-key": key,
    Accept: "application/json;version=2.0",
    "Accept-Language": "en-GB",
    "Content-Type": "application/json",
  };
}

async function viatorFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      ...viatorHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function pickImage(product: ViatorProduct): string | undefined {
  const images = product.images ?? [];
  const cover = images.find((img) => img.isCover) ?? images[0];
  const variants = cover?.variants ?? [];
  if (variants.length === 0) return undefined;
  const sorted = [...variants]
    .filter((v) => v.url)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const preferred =
    sorted.find((v) => (v.width ?? 0) >= 400 && (v.width ?? 0) <= 800) ??
    sorted[0];
  return preferred?.url;
}

function categorizeProduct(product: ViatorProduct): ViatorExperienceCategory {
  const price = product.pricing?.summary?.fromPrice;
  if (typeof price === "number" && price === 0) return "free-things-to-do";

  const hay = `${product.title ?? ""} ${product.description ?? ""}`.toLowerCase();
  if (
    /\b(walk|walking tour|walking|foot tour|guided walk)\b/.test(hay)
  ) {
    return "walking-city-tours";
  }
  if (
    /\b(stadium|football|etihad|old trafford|manchester united|manchester city|sport)\b/.test(
      hay,
    )
  ) {
    return "stadium-sports";
  }
  if (
    /\b(food|drink|pub|beer|gin|whisky|wine|tasting|culinary|dinner|brunch|cocktail)\b/.test(
      hay,
    )
  ) {
    return "food-drink";
  }
  if (
    /\b(sightseeing|hop[- ]?on|bus tour|city tour|attraction|museum|canal|cruise|day trip)\b/.test(
      hay,
    )
  ) {
    return "sightseeing-attractions";
  }
  return "unique-experiences";
}

function toExperience(product: ViatorProduct): ViatorExperienceDto | null {
  const code = product.productCode?.trim();
  const title = product.title?.trim();
  const affiliateUrl = product.productUrl?.trim();
  if (!code || !title || !affiliateUrl) return null;

  let host = "";
  try {
    host = new URL(affiliateUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host !== "viator.com" && host !== "www.viator.com") return null;

  const price = product.pricing?.summary?.fromPrice;
  const currency = product.pricing?.currency?.toUpperCase();

  return {
    id: `viator-${code}`,
    provider: "viator",
    externalId: code,
    title,
    slug: slugify(`${title}-${code}`),
    description: "",
    imageUrl: pickImage(product),
    category: categorizeProduct(product),
    location: "Manchester",
    priceFrom: typeof price === "number" && Number.isFinite(price) ? price : undefined,
    currency: currency === "GBP" ? "GBP" : currency ? undefined : "GBP",
    affiliateUrl,
    isActive: true,
    updatedAt: new Date().toISOString(),
  };
}

async function resolveManchesterDestinationId(): Promise<string> {
  const configured = process.env.VIATOR_DESTINATION_ID?.trim();
  if (configured) return configured;

  const now = Date.now();
  if (cachedDestinationId && now - cachedDestinationAt < DESTINATION_CACHE_MS) {
    return cachedDestinationId;
  }

  try {
    const res = await viatorFetch("/destinations", { method: "GET" });
    if (!res.ok) {
      const body = await res.text();
      console.warn(
        `[viator] destinations ${res.status}: ${body.slice(0, 200)}`,
      );
      return FALLBACK_MANCHESTER_DESTINATION_ID;
    }
    const data = (await res.json()) as ViatorDestinationsResponse;
    const destinations = data.destinations ?? [];
    const hit =
      destinations.find(
        (d) =>
          String(d.name ?? "").toLowerCase() === "manchester" &&
          String(d.type ?? "").toUpperCase() === "CITY",
      ) ??
      destinations.find(
        (d) => String(d.name ?? "").toLowerCase() === "manchester",
      );
    if (hit?.destinationId != null) {
      cachedDestinationId = String(hit.destinationId);
      cachedDestinationAt = now;
      console.log(`[viator] Manchester destinationId=${cachedDestinationId}`);
      return cachedDestinationId;
    }
  } catch (error) {
    console.warn("[viator] destinations lookup failed", error);
  }

  return FALLBACK_MANCHESTER_DESTINATION_ID;
}

async function searchPage(
  destinationId: string,
  start: number,
): Promise<ViatorProduct[]> {
  const res = await viatorFetch("/products/search", {
    method: "POST",
    body: JSON.stringify({
      filtering: {
        destination: String(destinationId),
      },
      sorting: {
        sort: "TRAVELER_RATING",
        order: "DESCENDING",
      },
      pagination: {
        start,
        count: PAGE_SIZE,
      },
      currency: "GBP",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[viator] products/search ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(`Viator products/search failed (${res.status})`);
  }

  const data = JSON.parse(text) as ViatorSearchResponse;
  return data.products ?? [];
}

/**
 * Fetch Manchester Viator products. Returns [] when key missing or API errors.
 */
export async function fetchViatorManchesterExperiences(): Promise<{
  experiences: ViatorExperienceDto[];
  error?: string;
}> {
  if (!getApiKey()) {
    console.warn("[viator] VIATOR_API_KEY not set — skipping Viator fetch");
    return { experiences: [], error: "VIATOR_API_KEY not set" };
  }

  try {
    const destinationId = await resolveManchesterDestinationId();
    const all: ViatorProduct[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const start = page * PAGE_SIZE + 1;
      const batch = await searchPage(destinationId, start);
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }

    const seen = new Set<string>();
    const experiences: ViatorExperienceDto[] = [];
    for (const product of all) {
      const mapped = toExperience(product);
      if (!mapped) continue;
      if (seen.has(mapped.externalId)) continue;
      seen.add(mapped.externalId);
      experiences.push(mapped);
    }

    console.log(
      `[viator] fetched ${experiences.length} Manchester experience(s) (dest=${destinationId})`,
    );
    return { experiences };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[viator] fetch failed:", message);
    return { experiences: [], error: message };
  }
}
