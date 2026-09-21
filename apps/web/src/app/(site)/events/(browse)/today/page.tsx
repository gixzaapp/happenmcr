import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { JsonLd } from "@/components/seo";
import { getTodayEvents } from "@/lib/api";
import { formatLondonDay } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildEventItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR ≤ 10m — today's listing stays crawlable and near-fresh. */
export const revalidate = REVALIDATE_SECONDS;

const PATH = "/events/today";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Manchester Events Today",
    description:
      "Find events in Manchester today — concerts, gigs, nightlife, food, and more. Updated throughout the day on HappenMCR.",
    path: PATH,
    keywords: [
      "Manchester events today",
      "what's on Manchester today",
      "Manchester gigs today",
      "events in Manchester today",
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
      <JsonLd
        data={buildEventItemListJsonLd(events, {
          name: `Manchester events today — ${dayLabel}`,
          path: PATH,
          description: `${countLabel} on in Manchester today.`,
        })}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Today in Manchester
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Manchester events today
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
