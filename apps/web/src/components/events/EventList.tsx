import type { Event } from "@happenmcr/types";
import {
  EventCard,
  eventToCardProps,
  type EventCardProps,
} from "./EventCard";

export type EventListItem = EventCardProps & {
  /** Stable key when title alone is not unique. */
  id?: string;
};

export type EventListProps = {
  events: EventListItem[] | Event[];
  emptyMessage?: string;
  className?: string;
  "aria-label"?: string;
  /** Card title heading level. Use 3 when the list sits under an h2. */
  titleAs?: "h2" | "h3";
};

function isApiEvent(event: EventListItem | Event): event is Event {
  return "start_time" in event && "venue_name" in event;
}

function toCardProps(event: EventListItem | Event): EventCardProps {
  return isApiEvent(event) ? eventToCardProps(event) : event;
}

function itemKey(event: EventListItem | Event, index: number): string {
  if ("id" in event && event.id) return event.id;
  const card = toCardProps(event);
  const date =
    typeof card.date === "string" ? card.date : card.date.toISOString();
  return `${card.title}-${date}-${index}`;
}

export function EventList({
  events,
  emptyMessage = "No events to show.",
  className = "",
  "aria-label": ariaLabel = "Events",
  titleAs = "h2",
}: EventListProps) {
  if (events.length === 0) {
    return (
      <p
        className={`text-sm text-[color:var(--muted)] ${className}`}
        role="status"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      aria-label={ariaLabel}
      className={`grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {events.map((event, index) => {
        const props = toCardProps(event);
        return (
          <li key={itemKey(event, index)} className="min-w-0">
            <EventCard {...props} titleAs={titleAs} />
          </li>
        );
      })}
    </ul>
  );
}
