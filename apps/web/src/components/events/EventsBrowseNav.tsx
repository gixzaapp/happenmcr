"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { londonYmd } from "@/lib/format";
import { timingNav } from "@/lib/nav";

const menuIcons: Record<string, string> = {
  Today: "today",
  Weekend: "date_range",
  Free: "sell",
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

function monthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Monday-first offset for the 1st of the month (0 = Mon). */
function mondayFirstOffset(year: number, monthIndex: number): number {
  const sundayFirst = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

function toYmd(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

type EventsBrowseNavProps = {
  selectedYmd?: string | null;
};

export function EventsBrowseSidebar({ selectedYmd = null }: EventsBrowseNavProps) {
  const pathname = usePathname();
  const today = londonYmd();
  const activeYmd =
    selectedYmd ??
    (pathname.startsWith("/events/date/")
      ? pathname.split("/")[3] ?? null
      : pathname === "/events/today"
        ? today
        : null);

  return (
    <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 flex-col overflow-y-auto border-r border-secondary/20 bg-canvas-white p-4 lg:flex">
      <div className="mb-8 p-2">
        <p className="font-display text-lg font-bold text-industrial-black">
          Browse
        </p>
        <p className="mt-1 text-label-md text-secondary">When &amp; free</p>
      </div>

      <nav aria-label="Event filters" className="space-y-1">
        {timingNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg p-3 text-label-md transition duration-150 ${
                isActive
                  ? "bg-bee-yellow font-bold text-industrial-black"
                  : "text-secondary hover:translate-x-1 hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined">
                {menuIcons[item.label] ?? "event"}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-secondary/15 pt-6">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          Calendar search
        </p>
        <EventsCalendar selectedYmd={activeYmd} />
      </div>
    </aside>
  );
}

export function EventsBrowseMobileNav({
  selectedYmd = null,
}: EventsBrowseNavProps) {
  const pathname = usePathname();
  const today = londonYmd();
  const activeYmd =
    selectedYmd ??
    (pathname.startsWith("/events/date/")
      ? pathname.split("/")[3] ?? null
      : pathname === "/events/today"
        ? today
        : null);

  return (
    <div className="mb-8 space-y-4 lg:hidden">
      <nav
        aria-label="Event filters"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {timingNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                isActive
                  ? "bg-bee-yellow text-industrial-black"
                  : "border border-industrial-black/10 bg-surface-container-low text-industrial-black"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <details className="rounded-lg border border-secondary/20 bg-surface-container-low">
        <summary className="cursor-pointer list-none px-4 py-3 font-display text-sm font-bold text-industrial-black marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            Pick a date
            {activeYmd ? (
              <span className="font-sans text-xs font-medium text-secondary">
                ({activeYmd})
              </span>
            ) : null}
          </span>
        </summary>
        <div className="border-t border-secondary/15 p-3">
          <EventsCalendar selectedYmd={activeYmd} />
        </div>
      </details>
    </div>
  );
}

function EventsCalendar({ selectedYmd }: { selectedYmd: string | null }) {
  const router = useRouter();
  const today = londonYmd();
  const initial = selectedYmd && /^\d{4}-\d{2}-\d{2}$/.test(selectedYmd)
    ? selectedYmd
    : today;
  const [year, initialMonth] = [
    Number(initial.slice(0, 4)),
    Number(initial.slice(5, 7)) - 1,
  ];
  const [cursor, setCursor] = useState({ year, month: initialMonth });

  const cells = useMemo(() => {
    const total = daysInMonth(cursor.year, cursor.month);
    const offset = mondayFirstOffset(cursor.year, cursor.month);
    const items: Array<{ day: number | null; ymd: string | null }> = [];

    for (let i = 0; i < offset; i += 1) {
      items.push({ day: null, ymd: null });
    }
    for (let day = 1; day <= total; day += 1) {
      items.push({
        day,
        ymd: toYmd(cursor.year, cursor.month, day),
      });
    }
    return items;
  }, [cursor.month, cursor.year]);

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const date = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  return (
    <div className="rounded-lg border border-industrial-black/10 bg-canvas-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-industrial-black transition-colors hover:bg-surface-container-low"
          aria-label="Previous month"
        >
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </button>
        <p className="font-display text-sm font-bold text-industrial-black">
          {monthLabel(cursor.year, cursor.month)}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-industrial-black transition-colors hover:bg-surface-container-low"
          aria-label="Next month"
        >
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-secondary">
        {WEEKDAYS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell.ymd || cell.day === null) {
            return <span key={`empty-${index}`} className="h-9" />;
          }

          const isSelected = cell.ymd === selectedYmd;
          const isToday = cell.ymd === today;

          return (
            <button
              key={cell.ymd}
              type="button"
              onClick={() => {
                if (cell.ymd === today) {
                  router.push("/events/today");
                  return;
                }
                router.push(`/events/date/${cell.ymd}`);
              }}
              className={`h-9 rounded text-sm font-semibold transition ${
                isSelected
                  ? "bg-bee-yellow text-industrial-black"
                  : isToday
                    ? "bg-industrial-black text-bee-yellow"
                    : "text-industrial-black hover:bg-surface-container-low"
              }`}
              aria-label={`Events on ${cell.ymd}`}
              aria-current={isSelected ? "date" : undefined}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
