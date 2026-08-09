import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { JsonLd } from "@/components/seo";
import { getWeekendEvents } from "@/lib/api";
import { formatWeekendRange } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildEventItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: weekend listing for crawlers. */
export const revalidate = REVALIDATE_SECONDS;

const PATH = "/events/weekend";

export async function generateMetadata(): Promise<Metadata> {
  const events = await getWeekendEvents();
  const rangeLabel = formatWeekendRange();
  const count = events.length;
  const countLabel =
    count === 0
      ? "Find what's on"
      : count === 1
        ? "1 event on"
        : `${count} events on`;

  const title = `Manchester Events This Weekend — ${rangeLabel}`;
  const description = `Find events in Manchester this weekend (${rangeLabel}). ${countLabel} listed — gigs, nightlife, shows, and more on HappenMCR.`;

  return buildPageMetadata({
    title,
    description,
    path: PATH,
    keywords: [
      "Manchester events this weekend",
      "what's on Manchester weekend",
      "Manchester gigs weekend",
      "HappenMCR",
    ],
  });
}

export default async function EventsWeekendPage() {
  const events = await getWeekendEvents();
  const rangeLabel = formatWeekendRange();
  const countLabel =
    events.length === 1 ? "1 event" : `${events.length} events`;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events this weekend", path: PATH },
        ])}
      />
      <JsonLd
        data={buildEventItemListJsonLd(events, {
          name: `Manchester events this weekend — ${rangeLabel}`,
          path: PATH,
          description: `${countLabel} listed for Saturday and Sunday.`,
        })}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          This weekend in Manchester
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Manchester events this weekend
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {rangeLabel}. {countLabel} listed for Saturday and Sunday.
        </p>
      </header>

      <div className="mt-12">
        <EventList
          events={events}
          emptyMessage="No weekend events listed yet — check back soon."
          aria-label="Events in Manchester this weekend"
        />
      </div>
    </>
  );
}
