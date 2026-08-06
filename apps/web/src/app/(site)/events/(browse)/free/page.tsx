import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { JsonLd } from "@/components/seo";
import { getFreeEvents } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: free-events listing for crawlers. */
export const revalidate = REVALIDATE_SECONDS;

const PATH = "/events/free";

export async function generateMetadata(): Promise<Metadata> {
  const events = await getFreeEvents();
  const count = events.length;
  const countLabel =
    count === 0
      ? "Find free things to do"
      : count === 1
        ? "1 free event"
        : `${count} free events`;

  const title = "Free Events in Manchester";
  const description = `${countLabel} in Manchester. Markets, music, culture, and more — no ticket required. Updated on HappenMCR.`;

  return buildPageMetadata({
    title,
    description,
    path: PATH,
    keywords: [
      "free events Manchester",
      "free things to do Manchester",
      "Manchester free gigs",
      "HappenMCR",
    ],
  });
}

export default async function EventsFreePage() {
  const events = await getFreeEvents();
  const countLabel =
    events.length === 1 ? "1 free event" : `${events.length} free events`;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Free events", path: PATH },
        ])}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Free in Manchester
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Free events in Manchester
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {countLabel} listed — things to do without buying a ticket.
        </p>
      </header>

      <div className="mt-12">
        <EventList
          events={events}
          emptyMessage="No free events listed yet — check back soon."
          aria-label="Free events in Manchester"
        />
      </div>
    </>
  );
}
