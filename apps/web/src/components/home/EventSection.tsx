import type { Event } from "@happenmcr/types";
import { EventList } from "@/components/events";

type EventSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  events: Event[];
  emptyMessage: string;
};

export function EventSection({
  id,
  eyebrow,
  title,
  description,
  events,
  emptyMessage,
}: EventSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 border-t border-[color:var(--line)]/70"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
          {eyebrow}
        </p>
        <h2
          id={`${id}-heading`}
          className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ink)] sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-base text-[color:var(--muted)]">
          {description}
        </p>
        <div className="mt-10">
          <EventList
            events={events}
            emptyMessage={emptyMessage}
            aria-label={title}
            titleAs="h3"
          />
        </div>
      </div>
    </section>
  );
}
