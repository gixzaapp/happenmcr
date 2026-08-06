import Image from "next/image";
import Link from "next/link";
import type { Event } from "@happenmcr/types";
import { buildEventPath } from "@happenmcr/types";
import { formatEventDate } from "@/lib/format";
import { shouldUseSymbolicEventImage } from "@/lib/source";
import { EventSymbolicPoster } from "./EventSymbolicPoster";

export type EventCardProps = {
  title: string;
  date: string | Date;
  venue: string | null;
  image?: string | null;
  source?: string | null;
  href?: string;
  className?: string;
  /** Heading level for the card title (listing under h1 → 2; under h2 → 3). */
  titleAs?: "h2" | "h3";
};

export function eventToCardProps(
  event: Pick<
    Event,
    "id" | "title" | "start_time" | "venue_name" | "image_url" | "source"
  >,
): EventCardProps {
  return {
    title: event.title,
    date: event.start_time,
    venue: event.venue_name,
    image: event.image_url,
    source: event.source,
    href: buildEventPath(event),
  };
}

export function EventCard({
  title,
  date,
  venue,
  image,
  source,
  href,
  className = "",
  titleAs = "h2",
}: EventCardProps) {
  const formattedDate = formatEventDate(date);
  const useSymbolic = shouldUseSymbolicEventImage(source);
  const TitleTag = titleAs;

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-industrial-black">
        {useSymbolic ? (
          <EventSymbolicPoster title={title} />
        ) : image ? (
          <Image
            src={image}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <EventSymbolicPoster title={title} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pt-4">
        <time
          dateTime={typeof date === "string" ? date : date.toISOString()}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-primary"
        >
          {formattedDate}
        </time>
        <TitleTag className="font-display text-lg font-semibold leading-snug tracking-tight text-industrial-black transition group-hover:text-primary">
          {title}
        </TitleTag>
        <p className="text-sm text-secondary">
          {venue?.trim() || "Venue TBC"}
        </p>
      </div>
    </>
  );

  const sharedClassName = `group flex h-full flex-col text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)] ${className}`;

  if (href) {
    return (
      <Link href={href} className={sharedClassName}>
        {body}
      </Link>
    );
  }

  return <article className={sharedClassName}>{body}</article>;
}
