import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { JsonLd } from "@/components/seo";
import { getTodayEvents } from "@/lib/api";
import { formatLondonDay } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: today's listing stays crawlable and near-fresh. */
export const revalidate = REVALIDATE_SECONDS;

const PATH = "/events/today";

export async function generateMetadata(): Promise<Metadata> {
  const events = await getTodayEvents();
  const dayLabel = formatLondonDay();
  const count = events.length;
  const countLabel =
    count === 0
      ? "Find what's on"
      : count === 1
        ? "1 event on"
        : `${count} events on`;

  const title = `Events in Manchester Today — ${dayLabel}`;
  const description = `${countLabel} in Manchester today (${dayLabel}). Concerts, gigs, nightlife, food, and more on HappenMCR.`;

  return buildPageMetadata({
    title,
    description,
    path: PATH,
    keywords: [
      "Manchester events today",
      "what's on Manchester today",
      "Manchester gigs today",
      "HappenMCR",
    ],
  });
}

export default async function EventsTodayPage() {
  const events = await getTodayEvents();
  const dayLabel = formatLondonDay();
  const countLabel =
    events.length === 1 ? "1 event" : `${events.length} events`;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events today", path: PATH },
        ])}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Today in Manchester
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Events in Manchester today
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {dayLabel}. {countLabel} listed and updated throughout the day.
        </p>
      </header>

      <div className="mt-12">
        <EventList
          events={events}
          emptyMessage="No events listed for today yet — check back soon."
          aria-label="Events in Manchester today"
        />
      </div>
    </>
  );
}
