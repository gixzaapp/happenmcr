import Link from "next/link";
import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import { getTodayEvents, getWeekendEvents } from "@/lib/api";
import { formatLondonDay, formatWeekendRange } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEventItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import {
  buildPageMetadata,
  WHATS_ON_MANCHESTER_DESCRIPTION,
  WHATS_ON_MANCHESTER_KEYWORDS,
  WHATS_ON_MANCHESTER_PATH,
  WHATS_ON_MANCHESTER_TITLE,
} from "@/lib/seo";

/** ISR hub for the “What's On in Manchester” query. */
export const revalidate = REVALIDATE_SECONDS;

export const metadata: Metadata = buildPageMetadata({
  title: WHATS_ON_MANCHESTER_TITLE,
  description: WHATS_ON_MANCHESTER_DESCRIPTION,
  path: WHATS_ON_MANCHESTER_PATH,
  keywords: [...WHATS_ON_MANCHESTER_KEYWORDS],
});

const EXPLORE_LINKS = [
  { href: "/events/today", label: "Events today" },
  { href: "/events/weekend", label: "This weekend" },
  { href: "/events/free", label: "Free events" },
  { href: "/category/live-music", label: "Live music / gigs" },
  { href: "/category/nightlife", label: "Nightlife" },
  { href: "/category/festivals", label: "Festivals" },
  { href: "/community", label: "Community" },
  { href: "/mcr-buzz", label: "MCR Buzz" },
] as const;

export default async function WhatsOnManchesterPage() {
  const [todayEvents, weekendEvents] = await Promise.all([
    getTodayEvents(),
    getWeekendEvents(),
  ]);
  const dayLabel = formatLondonDay();
  const weekendLabel = formatWeekendRange();
  const todayCount =
    todayEvents.length === 1 ? "1 event" : `${todayEvents.length} events`;
  const weekendCount =
    weekendEvents.length === 1
      ? "1 event"
      : `${weekendEvents.length} events`;

  return (
    <div className="mx-auto w-full max-w-site px-grid-margin py-12 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          {
            name: WHATS_ON_MANCHESTER_TITLE,
            path: WHATS_ON_MANCHESTER_PATH,
          },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: WHATS_ON_MANCHESTER_TITLE,
          description: WHATS_ON_MANCHESTER_DESCRIPTION,
          path: WHATS_ON_MANCHESTER_PATH,
          isPartOf: { name: "HappenMCR", path: "/" },
        })}
      />
      <JsonLd
        data={buildEventItemListJsonLd(todayEvents, {
          name: `What's on in Manchester today — ${dayLabel}`,
          path: WHATS_ON_MANCHESTER_PATH,
          description: `${todayCount} listed for today.`,
        })}
      />

      <header className="max-w-3xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          HappenMCR city guide
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          What&apos;s On in Manchester
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          Your daily guide to what&apos;s on in Manchester — gigs, nightlife,
          free events, festivals, and local plans, updated throughout the day.
        </p>
      </header>

      <nav
        aria-label="Jump to"
        className="mt-8 flex flex-wrap gap-2"
      >
        <a
          href="#today"
          className="inline-flex items-center rounded-md border border-industrial-black/10 bg-surface-container-low px-3 py-2 text-sm font-semibold text-industrial-black transition hover:border-bee-yellow hover:bg-bee-yellow"
        >
          Today
        </a>
        <a
          href="#weekend"
          className="inline-flex items-center rounded-md border border-industrial-black/10 bg-surface-container-low px-3 py-2 text-sm font-semibold text-industrial-black transition hover:border-bee-yellow hover:bg-bee-yellow"
        >
          This weekend
        </a>
        <Link
          href="/events/free"
          className="inline-flex items-center rounded-md border border-industrial-black/10 bg-surface-container-low px-3 py-2 text-sm font-semibold text-industrial-black transition hover:border-bee-yellow hover:bg-bee-yellow"
        >
          Free events
        </Link>
      </nav>

      <section id="today" className="mt-14 scroll-mt-28">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-industrial-black sm:text-3xl">
              Today in Manchester
            </h2>
            <p className="mt-2 text-sm text-secondary sm:text-base">
              {dayLabel}. {todayCount} listed.
            </p>
          </div>
          <Link
            href="/events/today"
            className="text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            Full today list
          </Link>
        </div>
        <div className="mt-8">
          <EventList
            events={todayEvents.slice(0, 12)}
            emptyMessage="No events listed for today yet — check back soon."
            aria-label="What's on in Manchester today"
            titleAs="h3"
          />
        </div>
      </section>

      <section id="weekend" className="mt-16 scroll-mt-28">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-industrial-black sm:text-3xl">
              This weekend
            </h2>
            <p className="mt-2 text-sm text-secondary sm:text-base">
              {weekendLabel}. {weekendCount} listed.
            </p>
          </div>
          <Link
            href="/events/weekend"
            className="text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            Full weekend list
          </Link>
        </div>
        <div className="mt-8">
          <EventList
            events={weekendEvents.slice(0, 12)}
            emptyMessage="No weekend events listed yet — check back soon."
            aria-label="What's on in Manchester this weekend"
            titleAs="h3"
          />
        </div>
      </section>

      <ExploreMoreLinks title="Browse by vibe" links={[...EXPLORE_LINKS]} />

      <p className="mt-12 text-xs leading-relaxed text-secondary">
        Images belong to their respective organisers and are used for event
        promotion purposes only.
      </p>
    </div>
  );
}
