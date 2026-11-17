import Link from "next/link";
import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import { getWeekendEvents } from "@/lib/api";
import { formatWeekendRange } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEventItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: weekend listing for crawlers. */
export const revalidate = REVALIDATE_SECONDS;

const PATH = "/events/weekend";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Manchester Events This Weekend",
    description:
      "Events in Manchester this weekend — gigs, nightlife, free days, and local plans for Saturday and Sunday. Updated daily on HappenMCR.",
    path: PATH,
    keywords: [
      "Manchester events this weekend",
      "what's on Manchester weekend",
      "things to do this weekend Manchester",
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
  const windowLabel = rangeLabel.includes("–")
    ? "Saturday and Sunday"
    : "Sunday";

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events this weekend", path: PATH },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: "Manchester events this weekend",
          description: `${countLabel} listed for ${windowLabel} (${rangeLabel}).`,
          path: PATH,
          isPartOf: { name: "HappenMCR", path: "/" },
        })}
      />
      <JsonLd
        data={buildEventItemListJsonLd(events, {
          name: `Manchester events this weekend — ${rangeLabel}`,
          path: PATH,
          description: `${countLabel} listed for ${windowLabel}.`,
        })}
      />

      <header className="max-w-3xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          This weekend in Manchester
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Manchester events this weekend
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {rangeLabel}. {countLabel} listed for {windowLabel}.
        </p>
        <p className="mt-4 text-base leading-relaxed text-secondary sm:text-lg">
          Looking past{" "}
          <Link
            href="/events/today"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            events in Manchester today
          </Link>
          ? This weekend list gathers Saturday and Sunday plans — gigs,
          nightlife, free events, and family days — with clear times and venues.
          For a curated shortlist, also see{" "}
          <Link
            href="/whats-on/things-to-do-this-weekend-manchester"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            things to do this weekend in Manchester
          </Link>
          .
        </p>
      </header>

      <div className="mt-12">
        <EventList
          events={events}
          emptyMessage="No weekend events listed yet — check back soon."
          aria-label="Events in Manchester this weekend"
        />
      </div>

      <ExploreMoreLinks
        title="Keep exploring"
        links={[
          { href: "/events/today", label: "Events in Manchester today" },
          { href: "/whats-on-manchester", label: "What's on in Manchester" },
          {
            href: "/whats-on/free-events-manchester",
            label: "Free events in Manchester",
          },
          { href: "/category/nightlife", label: "Nightlife" },
          { href: "/mcr-buzz", label: "MCR Buzz" },
        ]}
      />
    </>
  );
}
