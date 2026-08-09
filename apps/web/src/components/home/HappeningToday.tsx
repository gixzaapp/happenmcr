"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildEventPath, type Event } from "@happenmcr/types";
import { EventSymbolicPoster } from "@/components/events/EventSymbolicPoster";
import { formatEventDate } from "@/lib/format";
import { shouldUseSymbolicEventImage } from "@/lib/source";

const AUTO_SCROLL_MS = 4000;

type HappeningTodayProps = {
  events: Event[];
};

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

export function HappeningToday({ events }: HappeningTodayProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pageIndexRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const pages = useMemo(() => chunkPairs(events), [events]);

  const scrollToPage = useCallback(
    (pageIndex: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el || pages.length === 0) return;
      const next = ((pageIndex % pages.length) + pages.length) % pages.length;
      pageIndexRef.current = next;
      el.scrollTo({ top: next * el.clientHeight, behavior });
    },
    [pages.length],
  );

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      scrollToPage(pageIndexRef.current + direction);
    },
    [scrollToPage],
  );

  useEffect(() => {
    pageIndexRef.current = 0;
    scrollToPage(0, "auto");
  }, [events, scrollToPage]);

  useEffect(() => {
    if (pages.length <= 1 || paused) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      scrollToPage(pageIndexRef.current + 1);
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(id);
  }, [pages.length, paused, scrollToPage]);

  return (
    <div
      className="rounded-xl border border-canvas-white/10 bg-canvas-white/5 p-6 backdrop-blur-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="mb-stack-sm flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-headline-sm text-bee-yellow">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            bolt
          </span>
          HAPPENING TODAY
        </h2>

        {pages.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-canvas-white/15 text-canvas-white transition hover:border-bee-yellow hover:text-bee-yellow"
              aria-label="Previous today events"
            >
              <span className="material-symbols-outlined text-xl">
                expand_less
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-canvas-white/15 text-canvas-white transition hover:border-bee-yellow hover:text-bee-yellow"
              aria-label="Next today events"
            >
              <span className="material-symbols-outlined text-xl">
                expand_more
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-secondary-fixed-dim">
          No events listed for today yet.{" "}
          <Link href="/events/weekend" className="underline">
            See the weekend
          </Link>
          .
        </p>
      ) : (
        <div
          ref={scrollerRef}
          className="max-h-[12.5rem] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Today's events"
          aria-live="off"
        >
          {pages.map((pair, pageIndex) => (
            <div
              key={`today-page-${pageIndex}`}
              className="flex h-[12.5rem] snap-start flex-col justify-start"
            >
              <div className="space-y-1">
                {pair.map((event, index) => (
                  <Link
                    key={event.id}
                    href={buildEventPath(event)}
                    className={`group flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-canvas-white/10 ${
                      index > 0 ? "border-t border-canvas-white/5 pt-3" : ""
                    }`}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-industrial-black">
                      {shouldUseSymbolicEventImage(
                        event.source,
                        event.image_url,
                      ) || !event.image_url ? (
                        <EventSymbolicPoster
                          title={event.title}
                          className="p-1.5"
                          titleClassName="text-[9px] leading-tight line-clamp-4"
                        />
                      ) : (
                        <Image
                          src={event.image_url}
                          alt=""
                          fill
                          loading="lazy"
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-label-md text-canvas-white transition-colors group-hover:text-bee-yellow">
                        {event.title}
                      </h3>
                      <p className="text-xs text-secondary-fixed-dim">
                        {timeLabel(event.start_time)}
                        {event.venue_name ? ` • ${event.venue_name}` : ""}
                      </p>
                      <p className="sr-only">
                        {formatEventDate(event.start_time)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-secondary-fixed-dim">
          {events.length === 0
            ? null
            : events.length === 1
              ? "1 event today"
              : `${events.length} events today`}
        </p>
        <Link
          href="/events/today"
          className="inline-flex text-xs font-semibold uppercase tracking-widest text-bee-yellow hover:underline"
        >
          View all today
        </Link>
      </div>
    </div>
  );
}
