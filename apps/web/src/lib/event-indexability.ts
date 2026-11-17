import type { Event } from "@happenmcr/types";
import { londonYmd } from "@/lib/format";

/** Past shows stay reachable but drop out of the index after this window. */
export const EVENT_INDEX_RETENTION_DAYS = 7;

/** Descriptions shorter than this are treated as thin for indexing. */
export const THIN_DESCRIPTION_CHARS = 80;

function eventEndMs(event: Pick<Event, "start_time" | "end_time">): number {
  if (event.end_time) {
    const end = new Date(event.end_time).getTime();
    if (Number.isFinite(end)) return end;
  }
  return new Date(event.start_time).getTime();
}

/** True when the event ended (or started) more than retention days ago. */
export function isEventExpiredForIndex(
  event: Pick<Event, "start_time" | "end_time">,
  now = new Date(),
): boolean {
  const endMs = eventEndMs(event);
  if (!Number.isFinite(endMs)) return false;
  const cutoff = now.getTime() - EVENT_INDEX_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return endMs < cutoff;
}

export function isThinEventDescription(
  description: string | null | undefined,
): boolean {
  const text = (description ?? "").replace(/\s+/g, " ").trim();
  return text.length < THIN_DESCRIPTION_CHARS;
}

/**
 * Whether search engines should index this event detail page.
 * Expired and empty/thin descriptions are noindex; postponed/cancelled stay
 * indexable so status is discoverable.
 */
export function shouldIndexEventPage(event: Event, now = new Date()): boolean {
  if (isEventExpiredForIndex(event, now)) return false;
  if (isThinEventDescription(event.description) && !event.custom_intro) {
    return false;
  }
  return true;
}

/** Minimum events before a `/events/date/YYYY-MM-DD` page is indexed / sitemap'd. */
export const MIN_DATE_EVENTS_FOR_INDEX = 3;

/**
 * Date hubs: only index today/future days with enough listings.
 * Past calendar days stay reachable but noindex (soft-404 / bloat risk).
 */
export function shouldIndexDatePage(
  ymd: string,
  eventCount: number,
  todayYmd: string = londonYmd(),
): boolean {
  if (ymd < todayYmd) return false;
  return eventCount >= MIN_DATE_EVENTS_FOR_INDEX;
}

/** Fallback body when the feed left no useful description. */
export function buildEventFallbackCopy(event: Event, whenLabel: string): string {
  const where = event.venue_name?.trim() || "Manchester";
  const statusNote =
    event.status === "postponed"
      ? " This listing is marked postponed — check the organiser page for a new date."
      : event.status === "cancelled"
        ? " This listing is marked cancelled."
        : "";
  return `${event.title} at ${where} — ${whenLabel}. Listed on HappenMCR, Manchester’s local what’s-on guide.${statusNote}`;
}
