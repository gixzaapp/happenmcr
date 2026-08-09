import { buildEventPath, type Event } from "@happenmcr/types";
import { getSiteUrl } from "@/lib/config";
import { canShowEventImage } from "@/lib/source";

type JsonLdPrimitive = string | number | boolean | null;
type JsonLdValue =
  | JsonLdPrimitive
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

/** Drop null/undefined keys so Google receives clean JSON-LD. */
function prune<T extends JsonLdValue>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    const next = value
      .map((item) => prune(item))
      .filter((item): item is JsonLdValue => item !== undefined);
    return (next.length > 0 ? next : undefined) as T | undefined;
  }
  if (typeof value === "object") {
    const next: Record<string, JsonLdValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      const kept = prune(nested as JsonLdValue);
      if (kept !== undefined) next[key] = kept;
    }
    return (Object.keys(next).length > 0 ? next : undefined) as T | undefined;
  }
  return value;
}

function toAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, getSiteUrl()).toString();
}

function eventPageUrl(event: Event): string {
  return new URL(buildEventPath(event), getSiteUrl()).toString();
}

export type BreadcrumbItem = {
  name: string;
  /** Site path, e.g. `/events/today` */
  path: string;
};

export function homeBreadcrumb(): BreadcrumbItem {
  return { name: "Home", path: "/" };
}

/**
 * schema.org Organization JSON-LD for HappenMCR itself.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "HappenMCR",
    alternateName: ["Happen MCR", "happenmcr.com"],
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: toAbsoluteUrl("/apple-icon"),
      width: 180,
      height: 180,
    },
    image: toAbsoluteUrl("/opengraph-image"),
    description:
      "Find events in Manchester today — live music, gigs, nightlife, free events, community workshops, and food & drink. Updated daily on HappenMCR.",
    email: "hello@happenmcr.com",
    foundingLocation: {
      "@type": "Place",
      name: "Manchester, UK",
    },
    areaServed: {
      "@type": "City",
      name: "Manchester",
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Greater Manchester",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Manchester",
      addressRegion: "Greater Manchester",
      addressCountry: "GB",
    },
    knowsAbout: [
      "Manchester events",
      "live music Manchester",
      "Manchester nightlife",
      "drum and bass events Manchester",
      "underground warehouse raves",
      "cocktail masterclass Manchester",
      "community garden workshops",
      "Free events in Manchester",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@happenmcr.com",
      contactType: "customer support",
      areaServed: "GB",
      availableLanguage: "English",
    },
  };
}

/** Manchester city-centre coordinates used for local SEO geo markup. */
const MANCHESTER_GEO = {
  latitude: 53.4808,
  longitude: -2.2426,
} as const;

/**
 * schema.org LocalBusiness JSON-LD — boosts Manchester local SEO.
 */
export function buildLocalBusinessJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#localbusiness`,
    name: "HappenMCR",
    alternateName: ["Happen MCR", "happenmcr.com"],
    url: siteUrl,
    image: toAbsoluteUrl("/opengraph-image"),
    logo: toAbsoluteUrl("/apple-icon"),
    description:
      "Manchester events guide covering gigs, nightlife, free events, and community happenings across Greater Manchester.",
    email: "hello@happenmcr.com",
    priceRange: "Free",
    currenciesAccepted: "GBP",
    paymentAccepted: "Free listing discovery",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Manchester",
      addressRegion: "Greater Manchester",
      postalCode: "M1",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: MANCHESTER_GEO.latitude,
      longitude: MANCHESTER_GEO.longitude,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Manchester",
      },
      {
        "@type": "AdministrativeArea",
        name: "Greater Manchester",
      },
    ],
    knowsAbout: [
      "What's on in Manchester",
      "live music Manchester",
      "Manchester nightlife",
      "drum and bass events Manchester",
      "underground warehouse raves",
      "cocktail masterclass Manchester",
      "community garden workshops",
      "Manchester free events",
    ],
    parentOrganization: {
      "@id": `${siteUrl}/#organization`,
    },
  };
}

/**
 * schema.org BreadcrumbList JSON-LD for hierarchical pages.
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  const crumbs =
    items[0]?.path === "/" ? items : [homeBreadcrumb(), ...items];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

/** Nested Event node (no @context) for detail pages and ItemList items. */
function buildEventNode(event: Event): { [key: string]: JsonLdValue | undefined } {
  const pageUrl = eventPageUrl(event);
  const showImage = canShowEventImage(event.source, event.image_url);

  const location =
    event.venue_name ||
    event.venue_address ||
    (event.lat != null && event.lon != null)
      ? {
          "@type": "Place",
          name: event.venue_name,
          address: event.venue_address
            ? {
                "@type": "PostalAddress",
                streetAddress: event.venue_address,
                addressLocality: "Manchester",
                addressCountry: "GB",
              }
            : {
                "@type": "PostalAddress",
                addressLocality: "Manchester",
                addressCountry: "GB",
              },
          geo:
            event.lat != null && event.lon != null
              ? {
                  "@type": "GeoCoordinates",
                  latitude: event.lat,
                  longitude: event.lon,
                }
              : null,
        }
      : null;

  const organizer = {
    "@type": "Organization",
    name: event.venue_name || "HappenMCR",
    url: event.source_url || getSiteUrl(),
  };

  const performer = {
    "@type": "PerformingGroup",
    name: event.title,
  };

  const ticketUrl = event.ticket_url || event.source_url || pageUrl;
  const offers: { [key: string]: JsonLdValue | undefined } = {
    "@type": "Offer",
    url: ticketUrl,
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    validFrom: offerValidFrom(event.start_time),
  };
  // Free events always expose price 0. Unknown paid ticket prices are omitted
  // (we don't invent costs).
  if (event.is_free) {
    offers.price = 0;
  }

  const images = eventJsonLdImages(event, showImage);
  const endDate = eventEndDate(event);

  return {
    "@type": "Event",
    "@id": `${pageUrl}#event`,
    name: event.title,
    description: event.description,
    startDate: event.start_time,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: pageUrl,
    image: images.length === 1 ? images[0] : images,
    location,
    organizer,
    performer,
    offers,
  };
}

/**
 * schema.org Event JSON-LD for an event detail page.
 * Fills Google's recommended Event fields (image, endDate, offers.price/validFrom).
 */
export function buildEventJsonLd(event: Event): Record<string, unknown> {
  const pageUrl = eventPageUrl(event);
  const node = buildEventNode(event);
  const payload = {
    "@context": "https://schema.org",
    ...node,
  };

  return (prune(payload) ?? {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${pageUrl}#event`,
    name: event.title,
    startDate: event.start_time,
    endDate: eventEndDate(event),
    url: pageUrl,
    image: eventJsonLdImages(
      event,
      canShowEventImage(event.source, event.image_url),
    ),
  }) as Record<string, unknown>;
}

/**
 * schema.org ItemList for listing pages — each entry embeds a full Event node
 * (same shape as event detail JSON-LD, referenced via url / @id).
 */
export function buildEventItemListJsonLd(
  events: Event[],
  options: { name: string; path: string; description?: string },
): Record<string, unknown> {
  const listUrl = toAbsoluteUrl(options.path);
  const items = events.slice(0, 50).map((event, index) => {
    const node = prune(buildEventNode(event)) ?? {
      "@type": "Event",
      name: event.title,
      url: eventPageUrl(event),
      startDate: event.start_time,
    };
    return {
      "@type": "ListItem",
      position: index + 1,
      url: eventPageUrl(event),
      item: node,
    };
  });

  const payload = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${listUrl}#itemlist`,
    name: options.name,
    description: options.description ?? null,
    numberOfItems: events.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    url: listUrl,
    itemListElement: items,
  };

  return (prune(payload) ?? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options.name,
    url: listUrl,
    itemListElement: items,
  }) as Record<string, unknown>;
}

function absoluteMaybeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return toAbsoluteUrl(url.startsWith("/") ? url : `/${url}`);
}

/** Prefer organiser art when allowed; always include a happenmcr.com OG image. */
function eventJsonLdImages(event: Event, showImage: boolean): string[] {
  const urls: string[] = [];
  if (showImage && event.image_url) {
    urls.push(absoluteMaybeUrl(event.image_url));
  }
  urls.push(toAbsoluteUrl(`/og/event/${encodeURIComponent(event.id)}`));
  return [...new Set(urls)];
}

/** Google recommends endDate — default to start + 3h when the feed has no end. */
function eventEndDate(event: Event): string {
  if (event.end_time) return event.end_time;
  const start = new Date(event.start_time);
  if (Number.isNaN(start.getTime())) return event.start_time;
  return new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
}

/** Offer availability start — stable estimate when on-sale date is unknown. */
function offerValidFrom(startTime: string): string {
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return startTime;
  return new Date(start.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
}
