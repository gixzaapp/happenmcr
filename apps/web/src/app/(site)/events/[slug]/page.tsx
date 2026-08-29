import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  buildEventPath,
  parseEventPathSegment,
  slugifyEvent,
} from "@happenmcr/types";
import { EventDetail } from "@/components/events";
import { JsonLd } from "@/components/seo";
import { getAllEvents, getEventById } from "@/lib/api";
import { formatEventDateLong } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildEventJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";
import { getSiteUrl } from "@/lib/config";
import { canShowEventImage } from "@/lib/source";

/** ISR: event detail HTML for crawlers, refreshed every 10 minutes. */
export const revalidate = REVALIDATE_SECONDS;

/** New event slugs outside the prebuild set are still generated on demand. */
export const dynamicParams = true;

type EventDetailPageProps = {
  params: { slug: string };
};

const PREBUILD_DAYS = 90;

/** Pre-render upcoming event detail pages for SEO. */
export async function generateStaticParams() {
  const events = await getAllEvents({ cache: "no-store" });
  const now = Date.now();
  const horizon = now + PREBUILD_DAYS * 24 * 60 * 60 * 1000;

  return events
    .filter((event) => {
      const time = new Date(event.start_time).getTime();
      return Number.isFinite(time) && time >= now && time <= horizon;
    })
    .map((event) => ({
      slug: `${slugifyEvent(event.title, event.venue_name)}-${event.id}`,
    }));
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const parsed = parseEventPathSegment(params.slug);
  if (!parsed) {
    return buildPageMetadata({
      title: "Event not found",
      description: "This event is unavailable on HappenMCR.",
      path: `/events/${params.slug}`,
      index: false,
      follow: false,
    });
  }

  const event = await getEventById(parsed.id);

  if (!event) {
    return buildPageMetadata({
      title: "Event not found",
      description: "This event is unavailable on HappenMCR.",
      path: `/events/${params.slug}`,
      index: false,
      follow: false,
    });
  }

  const path = buildEventPath(event);
  const when = formatEventDateLong(event.start_time);
  const where = event.venue_name ? ` at ${event.venue_name}` : "";
  const title = event.title;
  const description = truncateSeoText(
    event.description ||
      `${event.title}${where} — ${when}. Find what's on in Manchester on HappenMCR.`,
  );
  const shareImage = canShowEventImage(event.source, event.image_url)
    ? `${getSiteUrl()}/og/event/${event.id}`
    : null;
  const keywords = [
    event.title,
    event.venue_name,
    event.category,
    "Manchester events",
    "HappenMCR",
  ].filter(Boolean) as string[];

  return buildPageMetadata({
    title,
    description,
    path,
    keywords,
    image: shareImage,
    imageAlt: event.title,
    type: "article",
  });
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const parsed = parseEventPathSegment(params.slug);
  if (!parsed) notFound();

  const event = await getEventById(parsed.id);
  if (!event) notFound();

  const canonicalPath = buildEventPath(event);
  if (`/events/${params.slug}` !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  return (
    <>
      <JsonLd data={buildEventJsonLd(event)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events", path: "/events/today" },
          { name: event.title, path: canonicalPath },
        ])}
      />
      <EventDetail event={event} />
    </>
  );
}
