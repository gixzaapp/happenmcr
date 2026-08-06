import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventList } from "@/components/events";
import { JsonLd } from "@/components/seo";
import { getEventsByDate } from "@/lib/api";
import {
  formatLondonDayFromYmd,
  isValidYmd,
  londonDateHorizon,
} from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import {
  DATE_ISR_HORIZON_DAYS,
  REVALIDATE_SECONDS,
} from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: HTML regenerated every 10 minutes for crawlable date indexes. */
export const revalidate = REVALIDATE_SECONDS;

/** Dates outside the prebuild horizon are still generated on first request. */
export const dynamicParams = true;

type EventsDatePageProps = {
  params: { ymd: string };
};

/** Pre-render the next 90 London calendar days (aligned with sitemap). */
export async function generateStaticParams() {
  return londonDateHorizon(DATE_ISR_HORIZON_DAYS).map((ymd) => ({ ymd }));
}

export async function generateMetadata({
  params,
}: EventsDatePageProps): Promise<Metadata> {
  const { ymd } = params;
  if (!isValidYmd(ymd)) {
    return buildPageMetadata({
      title: "Events in Manchester",
      description: "Browse Manchester events by date on HappenMCR.",
      path: `/events/date/${ymd}`,
      index: false,
      follow: true,
    });
  }

  const events = await getEventsByDate(ymd);
  const dayLabel = formatLondonDayFromYmd(ymd);
  const count = events.length;
  const countLabel =
    count === 0
      ? "Find what's on"
      : count === 1
        ? "1 event on"
        : `${count} events on`;

  const title = `Events in Manchester — ${dayLabel}`;
  const description = `${countLabel} in Manchester on ${dayLabel}. Concerts, gigs, nightlife, and more on HappenMCR.`;
  const path = `/events/date/${ymd}`;

  return buildPageMetadata({
    title,
    description,
    path,
    keywords: [
      `Manchester events ${dayLabel}`,
      "what's on Manchester",
      "Manchester gigs",
      "HappenMCR",
    ],
  });
}

export default async function EventsDatePage({ params }: EventsDatePageProps) {
  const { ymd } = params;
  if (!isValidYmd(ymd)) notFound();

  const events = await getEventsByDate(ymd);
  const dayLabel = formatLondonDayFromYmd(ymd);
  const countLabel =
    events.length === 1 ? "1 event" : `${events.length} events`;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events", path: "/events/today" },
          { name: dayLabel, path: `/events/date/${ymd}` },
        ])}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Calendar search
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Events in Manchester
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {dayLabel}. {countLabel} listed for this day.
        </p>
      </header>

      <div className="mt-12">
        <EventList
          events={events}
          emptyMessage={`No events listed for ${dayLabel} yet — try another date.`}
          aria-label={`Events in Manchester on ${dayLabel}`}
        />
      </div>
    </>
  );
}
