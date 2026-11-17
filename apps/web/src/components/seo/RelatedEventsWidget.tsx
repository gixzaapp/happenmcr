import Link from "next/link";
import type { Event } from "@happenmcr/types";
import { EventCard, eventToCardProps } from "@/components/events";

type RelatedEventsWidgetProps = {
  title?: string;
  events: Event[];
  limit?: number;
  moreHref?: string;
  moreLabel?: string;
};

/**
 * Compact event strip for editorial pages (MCR Buzz → live listings).
 * Pass already-filtered upcoming events from the server parent.
 */
export function RelatedEventsWidget({
  title = "Related events in Manchester",
  events,
  limit = 4,
  moreHref = "/events/today",
  moreLabel = "Events in Manchester today",
}: RelatedEventsWidgetProps) {
  const listed = events
    .filter((event) => !event.status || event.status === "scheduled")
    .slice(0, limit);

  if (listed.length === 0) return null;

  return (
    <section
      aria-labelledby="related-events-heading"
      className="my-10 border-y border-industrial-black/10 py-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="related-events-heading"
          className="font-display text-xl font-bold tracking-tight text-industrial-black sm:text-2xl"
        >
          {title}
        </h2>
        <Link
          href={moreHref}
          className="text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
        >
          {moreLabel}
        </Link>
      </div>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {listed.map((event) => (
          <li key={event.id}>
            <EventCard {...eventToCardProps(event)} titleAs="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
