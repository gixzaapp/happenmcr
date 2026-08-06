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
      "Discover what's on in Manchester: live music, nightlife, free events, community, and more — updated daily on HappenMCR.",
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
      "Manchester gigs",
      "Manchester nightlife",
      "Free events in Manchester",
      "Community events",
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
      "Manchester live music",
      "Manchester nightlife",
      "Manchester free events",
      "Community events Manchester",
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

/**
 * schema.org Event JSON-LD for an event detail page.
 * Image is omitted unless organiser photo display is permitted.
 */
export function buildEventJsonLd(event: Event): Record<string, unknown> {
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
  const offers = {
    "@type": "Offer",
    url: ticketUrl,
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    ...(event.is_free ? { price: 0 } : {}),
  };

  const payload = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.start_time,
    endDate: event.end_time,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: pageUrl,
    image: showImage ? event.image_url : null,
    location,
    organizer,
    performer,
    offers,
  };

  return (prune(payload) ?? {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_time,
    url: pageUrl,
  }) as Record<string, unknown>;
}
