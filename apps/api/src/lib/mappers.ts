import type { Event as EventDto } from "@happenmcr/types";
import type { Event as PrismaEvent } from "@prisma/client";
import { resolveCampusVenueFromLinks } from "./campus-venue.js";

export function toEventDto(event: PrismaEvent): EventDto {
  const campus = resolveCampusVenueFromLinks(
    {
      sourceUrl: event.sourceUrl,
      ticketUrl: event.ticketUrl,
    },
    event.venueAddress,
  );

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start_time: event.startTime.toISOString(),
    end_time: event.endTime ? event.endTime.toISOString() : null,
    venue_name: campus?.venueName ?? event.venueName,
    venue_address: campus?.venueAddress ?? event.venueAddress,
    lat: event.lat,
    lon: event.lon,
    category: event.category,
    tags: event.tags,
    source: event.source,
    source_url: event.sourceUrl,
    image_url: event.imageUrl,
    ticket_url: event.ticketUrl,
    is_free: event.isFree,
  };
}
