import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  buildVenuePath,
  slugifyVenue,
} from "@happenmcr/types";
import { EventList } from "@/components/events";
import {
  ExploreMoreLinks,
  JsonLd,
  venueExploreLinks,
} from "@/components/seo";
import { getAllEvents, isIndexableVenue, listIndexableVenues } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: venue hubs for crawlable venue → event graphs. */
export const revalidate = REVALIDATE_SECONDS;
export const dynamicParams = true;

type VenuePageProps = {
  params: { slug: string };
};

function eventsForVenueSlug(
  events: Awaited<ReturnType<typeof getAllEvents>>,
  slug: string,
) {
  return events.filter(
    (event) =>
      event.venue_name && slugifyVenue(event.venue_name) === slug,
  );
}

export async function generateStaticParams() {
  const events = await getAllEvents();
  return listIndexableVenues(events).map((venue) => ({ slug: venue.slug }));
}

export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const events = await getAllEvents();
  const matches = eventsForVenueSlug(events, params.slug);
  const venueName = matches[0]?.venue_name;

  if (!venueName) {
    return buildPageMetadata({
      title: "Venue not found",
      description: "This venue is unavailable on HappenMCR.",
      path: `/venue/${params.slug}`,
      index: false,
      follow: false,
    });
  }

  const path = buildVenuePath(venueName);
  const count = matches.length;
  const title = `Events at ${venueName}`;
  const description = `${count === 1 ? "1 event" : `${count} events`} at ${venueName} in Manchester. Browse listings on HappenMCR.`;

  return buildPageMetadata({
    title,
    description,
    path,
    index: isIndexableVenue(count),
    follow: true,
    keywords: [venueName, "Manchester venue", "Manchester events", "HappenMCR"],
  });
}

export default async function VenuePage({ params }: VenuePageProps) {
  const events = await getAllEvents();
  const matches = eventsForVenueSlug(events, params.slug);
  const venueName = matches[0]?.venue_name;

  if (!venueName) notFound();

  const path = buildVenuePath(venueName);
  if (`/venue/${params.slug}` !== path) {
    permanentRedirect(path);
  }

  const countLabel =
    matches.length === 1 ? "1 event" : `${matches.length} events`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events", path: "/events/today" },
          { name: venueName, path },
        ])}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Venue
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          {venueName}
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {countLabel} listed at this Manchester venue.
        </p>
      </header>

      <div id="events" className="mt-12 scroll-mt-28">
        <EventList
          events={matches}
          emptyMessage="No events listed for this venue yet."
          aria-label={`Events at ${venueName}`}
        />
      </div>

      <ExploreMoreLinks
        title="Explore more"
        links={venueExploreLinks(venueName, matches)}
      />
    </div>
  );
}
