export type HealthStatus = "ok" | "degraded" | "down";

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  lat: number | null;
  lon: number | null;
  category: string | null;
  tags: string[];
  source: string | null;
  source_url: string | null;
  image_url: string | null;
  ticket_url: string | null;
  is_free: boolean;
}

export interface CategoryInfo {
  slug: string;
  name: string;
}

export interface CategoryEventsResponse {
  data: Event[];
  /** Present on success; omitted on error payloads. */
  category?: CategoryInfo;
  error?: string;
}

export {
  EVENT_CATEGORIES,
  listEventCategories,
  listSubmitEventCategories,
  getEventCategory,
  isValidEventCategory,
  resolveEventCategoryLabel,
  type EventCategoryDefinition,
  type ResolvedEventCategory,
} from "./categories";

export {
  SLUG_STOPWORDS,
  EVENT_ID_PATTERN,
  slugify,
  slugifyCategory,
  slugifyVenue,
  slugifyEvent,
  buildEventPath,
  buildVenuePath,
  buildCategoryPath,
  parseEventPathSegment,
  categoryMatchesSlug,
  type SlugifyOptions,
} from "./slugify";
