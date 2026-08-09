import Image from "next/image";
import Link from "next/link";
import { buildEventPath, type Event } from "@happenmcr/types";
import { EventSymbolicPoster } from "@/components/events/EventSymbolicPoster";
import { formatEventDate } from "@/lib/format";
import { shouldUseSymbolicEventImage } from "@/lib/source";

type FeaturedDiscoveryProps = {
  events: Event[];
};

const badgeColors = [
  "bg-event-purple text-canvas-white border-bee-yellow",
  "bg-event-teal text-canvas-white border-industrial-black",
  "bg-bee-yellow text-industrial-black border-canvas-white",
];

function categoryBadge(index: number): string {
  return badgeColors[index % badgeColors.length];
}

export function FeaturedDiscovery({ events = [] }: FeaturedDiscoveryProps) {
  const [featured, ...rest] = events;
  const sideEvents = rest.slice(0, 2);

  if (!featured) {
    return null;
  }

  const featuredSymbolic = shouldUseSymbolicEventImage(
    featured.source,
    featured.image_url,
  );

  return (
    <section className="mx-auto max-w-site px-grid-margin py-stack-lg">
      <div className="mb-stack-md flex items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-industrial-black sm:text-headline-lg">
            FEATURED DISCOVERY
          </h2>
          <p className="mt-2 text-body-md text-secondary">
            Hand-picked Manchester experiences for this week.
          </p>
        </div>
        <Link
          href="/events/weekend"
          className="hidden items-center gap-2 border-b-2 border-bee-yellow pb-1 text-label-md text-industrial-black transition-all hover:border-industrial-black md:flex"
        >
          VIEW ALL EVENTS
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <Link
          href={buildEventPath(featured)}
          className="group relative h-[500px] overflow-hidden rounded-xl md:col-span-2"
        >
          {featuredSymbolic ? (
            <EventSymbolicPoster
              title={featured.title}
              className="absolute inset-0 p-8 sm:p-10"
              titleClassName="max-w-xl text-2xl sm:text-4xl line-clamp-4"
            />
          ) : (
            <>
              <Image
                src={
                  featured.image_url ||
                  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80"
                }
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-industrial-black via-transparent to-transparent opacity-80" />
            </>
          )}
          {featured.category ? (
            <div className="absolute left-6 top-6 z-20">
              <span
                className={`border-l-4 px-3 py-1 text-xs font-semibold uppercase tracking-widest ${categoryBadge(0)}`}
              >
                {featured.category}
              </span>
            </div>
          ) : null}
          <div className="absolute bottom-8 left-8 z-20 max-w-md">
            {!featuredSymbolic ? (
              <h3 className="mb-2 font-display text-2xl font-bold text-canvas-white sm:text-headline-lg">
                {featured.title}
              </h3>
            ) : null}
            {featured.description ? (
              <p className="mb-4 line-clamp-2 text-body-md text-canvas-white/80">
                {featured.description}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 font-sans text-sm font-semibold uppercase tracking-tighter text-bee-yellow">
              <span>{formatEventDate(featured.start_time)}</span>
              {featured.venue_name ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-bee-yellow" />
                  <span>{featured.venue_name}</span>
                </>
              ) : null}
            </div>
          </div>
        </Link>

        <div className="space-y-gutter">
          {sideEvents.map((event, index) => {
            const dark = index === 1;
            const symbolic = shouldUseSymbolicEventImage(
              event.source,
              event.image_url,
            );
            return (
              <Link
                key={event.id}
                href={buildEventPath(event)}
                className={`group block h-[calc(250px-0.75rem)] overflow-hidden rounded-xl border transition-colors ${
                  dark
                    ? "border-transparent bg-industrial-black"
                    : "border-industrial-black/10 bg-canvas-white hover:border-bee-yellow"
                }`}
              >
                <div className="relative h-1/2 overflow-hidden bg-industrial-black">
                  {symbolic ? (
                    <EventSymbolicPoster
                      title={event.title}
                      className="p-3"
                      titleClassName="text-sm sm:text-base line-clamp-3"
                    />
                  ) : (
                    <Image
                      src={
                        event.image_url ||
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
                      }
                      alt=""
                      fill
                      loading="lazy"
                      sizes="33vw"
                      className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
                        dark ? "opacity-80" : ""
                      }`}
                    />
                  )}
                  {event.category ? (
                    <span
                      className={`absolute left-4 top-4 border-l-2 px-2 py-0.5 text-[10px] font-bold uppercase ${categoryBadge(index + 1)}`}
                    >
                      {event.category}
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <h4
                    className={`mb-1 line-clamp-2 font-display text-lg font-semibold transition-colors sm:text-xl ${
                      dark
                        ? "text-bee-yellow"
                        : "text-industrial-black group-hover:text-primary"
                    }`}
                  >
                    {event.title}
                  </h4>
                  <p
                    className={`line-clamp-2 text-sm ${
                      dark ? "text-canvas-white/60" : "text-secondary"
                    }`}
                  >
                    {event.description ||
                      `${formatEventDate(event.start_time)}${
                        event.venue_name ? ` • ${event.venue_name}` : ""
                      }`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
