import Image from "next/image";
import Link from "next/link";
import type { Event } from "@happenmcr/types";
import { buildCategoryPath, buildVenuePath } from "@happenmcr/types";
import { eventImageAlt } from "@/lib/a11y";
import { formatEventDateLong } from "@/lib/format";
import { shouldUseSymbolicEventImage } from "@/lib/source";
import { EventBackButton } from "./EventBackButton";
import { EventSymbolicPoster } from "./EventSymbolicPoster";
import { ExploreMoreLinks, eventExploreLinks } from "@/components/seo";

type EventDetailProps = {
  event: Event;
};

export function EventDetail({ event }: EventDetailProps) {
  const startLabel = formatEventDateLong(event.start_time);
  const endLabel = event.end_time ? formatEventDateLong(event.end_time) : null;
  const venueLine = [event.venue_name, event.venue_address]
    .filter(Boolean)
    .join(" · ");
  const categoryHref = event.category
    ? buildCategoryPath(event.category)
    : null;
  const venueHref = event.venue_name
    ? buildVenuePath(event.venue_name)
    : null;
  const primaryUrl = event.ticket_url || event.source_url;
  const useSymbolic = shouldUseSymbolicEventImage(event.source);

  return (
    <article>
      <div className="relative aspect-[21/9] min-h-[240px] w-full overflow-hidden bg-industrial-black sm:min-h-[320px]">
        {useSymbolic ? (
          <EventSymbolicPoster
            title={event.title}
            className="p-8 sm:p-12"
            titleClassName="max-w-3xl text-2xl sm:text-4xl line-clamp-3"
          />
        ) : event.image_url ? (
          <Image
            src={event.image_url}
            alt={eventImageAlt(event.title, event.venue_name)}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <EventSymbolicPoster
            title={event.title}
            className="p-8 sm:p-12"
            titleClassName="max-w-3xl text-2xl sm:text-4xl line-clamp-3"
          />
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <EventBackButton />

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {event.is_free ? (
            <span className="rounded-md bg-[color:var(--accent-soft)] px-2.5 py-1 font-semibold text-[color:var(--accent)]">
              Free
            </span>
          ) : null}
          {event.category && categoryHref ? (
            <Link
              href={categoryHref}
              className="font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)] transition hover:brightness-90"
            >
              {event.category}
            </Link>
          ) : null}
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[color:var(--ink)] sm:text-5xl">
          {event.title}
        </h1>

        <dl className="mt-8 space-y-4 border-y border-[color:var(--line)] py-6 text-sm sm:text-base">
          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              When
            </dt>
            <dd className="mt-1 text-[color:var(--ink)]">
              <time dateTime={event.start_time}>{startLabel}</time>
              {endLabel ? (
                <>
                  {" "}
                  – <time dateTime={event.end_time!}>{endLabel}</time>
                </>
              ) : null}
            </dd>
          </div>

          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Where
            </dt>
            <dd className="mt-1 text-[color:var(--ink)]">
              {venueHref ? (
                <Link
                  href={venueHref}
                  className="transition hover:text-[color:var(--accent)]"
                >
                  {venueLine}
                </Link>
              ) : (
                venueLine || "Venue TBC"
              )}
            </dd>
          </div>
        </dl>

        {event.description ? (
          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold text-[color:var(--ink)]">
              About
            </h2>
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-[color:var(--muted)]">
              {event.description}
            </p>
          </div>
        ) : null}

        {event.tags.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
            {event.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-[color:var(--surface-2)] px-2.5 py-1 text-xs text-[color:var(--muted)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          {primaryUrl ? (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {event.ticket_url ? "Get tickets" : "View source"}
            </a>
          ) : null}
          {event.ticket_url && event.source_url ? (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-2)]"
            >
              Event page
            </a>
          ) : null}
          <Link
            href="/events/today"
            className="inline-flex items-center rounded-md px-3 py-2.5 text-sm font-semibold text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
          >
            More today
          </Link>
          <Link
            href="/events/weekend"
            className="inline-flex items-center rounded-md px-3 py-2.5 text-sm font-semibold text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
          >
            This weekend
          </Link>
        </div>

        <ExploreMoreLinks links={eventExploreLinks(event)} />

        <p className="mt-10 text-xs leading-relaxed text-[color:var(--muted)]">
          Images belong to their respective organisers and are used for event
          promotion purposes only.
        </p>
      </div>
    </article>
  );
}
