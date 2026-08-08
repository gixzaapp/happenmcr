/**
 * Canonical event categories for HappenMCR.
 * Add new buckets here — submit form, validation, and helpers all derive from this list.
 */
export type EventCategoryDefinition = {
  /** Stable id / URL-ish key. Prefer kebab-case; do not reuse after rename. */
  id: string;
  /** Label stored on Event.category and shown in the UI. */
  label: string;
  /** Include in the submit-event dropdown. Default true. */
  showInSubmit?: boolean;
  /** Sort order ascending. Default: registry order. */
  order?: number;
};

const EVENT_CATEGORY_DEFS: EventCategoryDefinition[] = [
  { id: "live-music", label: "Live Music" },
  { id: "nightlife", label: "Nightlife" },
  { id: "comedy", label: "Comedy" },
  { id: "arts-culture", label: "Arts & Culture" },
  { id: "theatre", label: "Theatre" },
  { id: "family", label: "Family" },
  { id: "festivals", label: "Festivals" },
  { id: "community", label: "Community" },
  { id: "student", label: "Student" },
  { id: "sports", label: "Sports" },
  { id: "food-drink", label: "Food & Drink" },
  { id: "talks-workshops", label: "Talks & Workshops" },
  { id: "film", label: "Film" },
  /** Catch-all — always last in the submit picker. */
  { id: "other", label: "Other", order: 10_000 },
];

export type ResolvedEventCategory = EventCategoryDefinition & {
  showInSubmit: boolean;
  order: number;
};

function resolveCategory(
  def: EventCategoryDefinition,
  index: number,
): ResolvedEventCategory {
  return {
    ...def,
    id: def.id.trim().toLowerCase(),
    label: def.label.trim(),
    showInSubmit: def.showInSubmit !== false,
    order: def.order ?? index,
  };
}

export const EVENT_CATEGORIES: ResolvedEventCategory[] = EVENT_CATEGORY_DEFS.map(
  resolveCategory,
).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

const byId = new Map(EVENT_CATEGORIES.map((c) => [c.id, c]));
const byLabel = new Map(
  EVENT_CATEGORIES.map((c) => [c.label.toLowerCase(), c]),
);

/** All categories in display order. */
export function listEventCategories(): ResolvedEventCategory[] {
  return EVENT_CATEGORIES;
}

/** Categories shown on the submit-event form. */
export function listSubmitEventCategories(): ResolvedEventCategory[] {
  return EVENT_CATEGORIES.filter((category) => category.showInSubmit);
}

export function getEventCategory(
  idOrLabel: string,
): ResolvedEventCategory | null {
  const key = idOrLabel.trim().toLowerCase();
  if (!key) return null;
  return byId.get(key) ?? byLabel.get(key) ?? null;
}

export function isValidEventCategory(idOrLabel: string): boolean {
  return getEventCategory(idOrLabel) !== null;
}

/** Canonical label to persist on Event / EventSubmission.category. */
export function resolveEventCategoryLabel(idOrLabel: string): string | null {
  return getEventCategory(idOrLabel)?.label ?? null;
}
