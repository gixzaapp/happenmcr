import { AdSenseInFeed, AdsterraInFeed } from "@/components/analytics";
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

export type EventListAdNetwork = "adsense" | "adsterra";

export type EventListProps = {
  events: EventListItem[] | Event[];
  emptyMessage?: string;
  className?: string;
  "aria-label"?: string;
  /** Heading level for card titles. */
  titleAs?: "h2" | "h3";
  /**
   * Insert an in-feed ad after every N cards.
   * Set `0` to disable. Default: 6 (≈2 desktop rows).
   * Adsterra only supports one container id — only the first slot is used.
   */
  adEvery?: number;
  /** Default AdSense. Use `adsterra` on /events/today (Plan B). */
  adNetwork?: EventListAdNetwork;
};

/** Place first in-feed ad after this many cards (then every `adEvery`). */
const AD_FIRST_AFTER = 3;

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

function shouldInsertAd(
  index: number,
  total: number,
  adEvery: number,
  adNetwork: EventListAdNetwork,
  adsterraUsed: boolean,
): boolean {
  if (adEvery <= 0 || total < AD_FIRST_AFTER) return false;
  // One Adsterra container id per page — only the first in-feed slot.
  if (adNetwork === "adsterra" && adsterraUsed) return false;

  const position = index + 1;
  if (position === AD_FIRST_AFTER) return true;
  if (position <= AD_FIRST_AFTER) return false;
  return (position - AD_FIRST_AFTER) % adEvery === 0 && position < total;
}

export function EventList({
  events,
  emptyMessage = "No events to show.",
  className = "",
  "aria-label": ariaLabel = "Events",
  titleAs = "h2",
  adEvery = 6,
  adNetwork = "adsense",
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

  let adsterraUsed = false;

  return (
    <ul
      aria-label={ariaLabel}
      className={`grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {events.flatMap((event, index) => {
        const props = toCardProps(event);
        const nodes = [
          <li key={itemKey(event, index)} className="min-w-0">
            <EventCard {...props} titleAs={titleAs} />
          </li>,
        ];

        if (
          shouldInsertAd(
            index,
            events.length,
            adEvery,
            adNetwork,
            adsterraUsed,
          )
        ) {
          if (adNetwork === "adsterra") {
            adsterraUsed = true;
            nodes.push(
              <li key={`adsterra-infeed-${index}`} className="min-w-0">
                <AdsterraInFeed />
              </li>,
            );
          } else {
            nodes.push(
              <li key={`adsense-infeed-${index}`} className="min-w-0">
                <AdSenseInFeed />
              </li>,
            );
          }
        }

        return nodes;
      })}
    </ul>
  );
}
