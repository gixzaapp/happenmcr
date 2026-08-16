const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Format an event datetime for UI (Manchester / en-GB). */
export function formatEventDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "Date TBC";
  return dateFormatter.format(value);
}

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Longer datetime for detail pages. */
export function formatEventDateLong(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "Date TBC";
  return longDateFormatter.format(value);
}

/** Human-readable London calendar day, e.g. "Wednesday, 5 August 2026". */
export function formatLondonDay(date: Date = new Date()): string {
  return dayFormatter.format(date);
}

/** Format a `YYYY-MM-DD` civil date as a London day label. */
export function formatLondonDayFromYmd(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return ymd;
  // Noon UTC avoids DST edge cases when formatting with Europe/London.
  return dayFormatter.format(new Date(Date.UTC(year, month - 1, day, 12)));
}

/** Today's calendar date in Europe/London as `YYYY-MM-DD`. */
export function londonYmd(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

/** Next `n` London calendar dates starting today (`YYYY-MM-DD`). */
export function londonDateHorizon(days: number): string[] {
  const start = londonYmd();
  const [year, month, day] = start.split("-").map(Number);
  const dates: string[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const probe = new Date(Date.UTC(year, month - 1, day + offset));
    dates.push(probe.toISOString().slice(0, 10));
  }

  return dates;
}

/** True when `ymd` is a real Gregorian calendar day. */
export function isValidYmd(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [year, month, day] = ymd.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/**
 * Label for the current/upcoming weekend in London time
 * (matches API weekend window: Sat–Sun, or Sunday-only once Saturday is over).
 */
export function formatWeekendRange(reference: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const weekdayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/London",
    weekday: "short",
  }).format(reference);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[weekdayLabel] ?? reference.getUTCDay();
  const daysUntilSaturday =
    weekday === 0 ? -1 : weekday === 6 ? 0 : 6 - weekday;

  const saturdayUtc = Date.UTC(year, month - 1, day + daysUntilSaturday, 12);
  const sundayUtc = Date.UTC(year, month - 1, day + daysUntilSaturday + 1, 12);

  if (weekday === 0) {
    return shortDayFormatter.format(new Date(sundayUtc));
  }

  return `${shortDayFormatter.format(new Date(saturdayUtc))} – ${shortDayFormatter.format(new Date(sundayUtc))}`;
}
