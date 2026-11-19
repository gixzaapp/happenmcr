const TIME_ZONE = "Europe/London";

function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function weekdayInTimeZone(date: Date, timeZone: string): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[label] ?? date.getUTCDay();
}

/** Convert a civil clock time in `timeZone` to a UTC Date. */
export function zonedDateTimeToUtc(
  ymd: string,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
  timeZone: string = TIME_ZONE,
): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let i = 0; i < 3; i += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(utc))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );

    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const desired = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);
    utc += desired - asUtc;
  }

  return new Date(utc);
}

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Parse submit-form / ops datetimes as Europe/London wall clock.
 * - `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss` → London local
 * - Strings with Z / offset → absolute instant (unchanged)
 */
export function parseLondonDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const wall = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    trimmed,
  );
  if (wall) {
    const ymd = wall[1];
    const hours = Number(wall[2]);
    const minutes = Number(wall[3]);
    const seconds = Number(wall[4] ?? "0");
    if (
      hours > 23 ||
      minutes > 59 ||
      seconds > 59 ||
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      Number.isNaN(seconds)
    ) {
      return null;
    }
    return zonedDateTimeToUtc(ymd, hours, minutes, seconds, 0, TIME_ZONE);
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function getTodayRange(reference = new Date()): { start: Date; end: Date } {
  const ymd = ymdInTimeZone(reference, TIME_ZONE);
  const range = getDayRange(ymd);
  if (!range) {
    throw new Error(`Unable to resolve London day range for ${ymd}`);
  }
  return range;
}

/** Calendar day range in Europe/London for a `YYYY-MM-DD` civil date. */
export function getDayRange(ymd: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    start: zonedDateTimeToUtc(ymd, 0, 0, 0, 0, TIME_ZONE),
    end: zonedDateTimeToUtc(ymd, 23, 59, 59, 999, TIME_ZONE),
  };
}

/**
 * Current weekend if Sat/Sun, otherwise the upcoming Sat–Sun (Europe/London).
 * On Sunday, Saturday is already over — range is Sunday only.
 */
export function getWeekendRange(reference = new Date()): { start: Date; end: Date } {
  const ymd = ymdInTimeZone(reference, TIME_ZONE);
  const weekday = weekdayInTimeZone(reference, TIME_ZONE);
  const daysUntilSaturday = weekday === 0 ? -1 : weekday === 6 ? 0 : 6 - weekday;
  const saturday = addDaysYmd(ymd, daysUntilSaturday);
  const sunday = addDaysYmd(saturday, 1);

  // Sunday: drop Saturday from the window.
  const rangeStartYmd = weekday === 0 ? sunday : saturday;

  return {
    start: zonedDateTimeToUtc(rangeStartYmd, 0, 0, 0, 0, TIME_ZONE),
    end: zonedDateTimeToUtc(sunday, 23, 59, 59, 999, TIME_ZONE),
  };
}
