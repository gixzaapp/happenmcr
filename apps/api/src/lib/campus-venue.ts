export type EventLinkFields = {
  sourceUrl?: string | null;
  ticketUrl?: string | null;
  source_url?: string | null;
  ticket_url?: string | null;
  url?: string | null;
};

type CampusVenueRule = {
  venueName: string;
  defaultAddress: string;
  /** Match hostname only (lowercased). */
  matchesHost: (host: string) => boolean;
};

const CAMPUS_VENUE_RULES: CampusVenueRule[] = [
  {
    venueName: "University of Manchester",
    defaultAddress: "Oxford Road, Manchester M13 9PL",
    matchesHost: (host) =>
      host === "manchester.ac.uk" || host.endsWith(".manchester.ac.uk"),
  },
  {
    venueName: "Manchester Metropolitan University",
    defaultAddress: "All Saints Campus, Manchester M15 6BH",
    matchesHost: (host) => host === "mmu.ac.uk" || host.endsWith(".mmu.ac.uk"),
  },
];

function hostnameFromUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    const match = raw.match(/^(?:https?:\/\/)?([^/?#]+)/i);
    return match?.[1]?.toLowerCase() ?? null;
  }
}

function collectLinks(links: EventLinkFields): string[] {
  return [
    links.sourceUrl,
    links.ticketUrl,
    links.source_url,
    links.ticket_url,
    links.url,
  ].filter((value): value is string => Boolean(value?.trim()));
}

/** Resolve canonical campus venue when any event link matches a known uni domain. */
export function resolveCampusVenueFromLinks(
  links: EventLinkFields,
  existingAddress?: string | null,
): { venueName: string; venueAddress: string } | null {
  for (const href of collectLinks(links)) {
    const host = hostnameFromUrl(href);
    if (!host) continue;
    for (const rule of CAMPUS_VENUE_RULES) {
      if (!rule.matchesHost(host)) continue;
      return {
        venueName: rule.venueName,
        venueAddress: existingAddress?.trim() || rule.defaultAddress,
      };
    }
  }
  return null;
}

/** @deprecated Prefer resolveCampusVenueFromLinks */
export const UNIVERSITY_OF_MANCHESTER_VENUE = "University of Manchester";

/** @deprecated Prefer resolveCampusVenueFromLinks */
export function eventLinksToManchesterAcUk(links: EventLinkFields): boolean {
  return resolveCampusVenueFromLinks(links)?.venueName === UNIVERSITY_OF_MANCHESTER_VENUE;
}

/** @deprecated Prefer resolveCampusVenueFromLinks */
export function universityOfManchesterVenueFields(
  existingAddress?: string | null,
): { venueName: string; venueAddress: string } {
  return (
    resolveCampusVenueFromLinks(
      { url: "https://www.manchester.ac.uk" },
      existingAddress,
    ) ?? {
      venueName: UNIVERSITY_OF_MANCHESTER_VENUE,
      venueAddress: existingAddress?.trim() || "Oxford Road, Manchester M13 9PL",
    }
  );
}
