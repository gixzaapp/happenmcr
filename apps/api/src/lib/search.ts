import type { Event } from "@happenmcr/types";

/** Case-insensitive match across common event text fields. */
export function eventMatchesQuery(event: Event, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;

  const fields = [
    event.title,
    event.description ?? "",
    event.venue_name ?? "",
    event.venue_address ?? "",
    event.category ?? "",
    event.source ?? "",
    ...event.tags,
  ];

  return fields.some((field) => field.toLowerCase().includes(needle));
}
