import Link from "next/link";
import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import { getTodayEvents } from "@/lib/api";
import { formatLondonDay } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEventItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR ≤ 10m — today's listing stays crawlable and near-fresh. */
export const revalidate = REVALIDATE_SECONDS;

const PATH = "/events/today";

const FAQ = [
  {
    q: "What is on in Manchester today?",
    a: "HappenMCR lists concerts, gigs, nightlife, free events, talks, and community plans happening in Greater Manchester today. The list updates throughout the day as venues and organisers publish new shows.",
  },
  {
    q: "How often is today’s calendar updated?",
    a: "We refresh listings from venue calendars, ticketing platforms, and organiser submissions during the day. Postponed or cancelled shows are marked when we know about them.",
  },
  {
    q: "Where else can I browse?",
    a: "Use This weekend for Saturday and Sunday plans, Free events for no-ticket days, or What’s on in Manchester for a wider city guide. You can also jump into MCR Buzz for original Manchester editorial.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const dayLabel = formatLondonDay();
  return buildPageMetadata({
    title: "Events in Manchester Today",
    description: `Events in Manchester today (${dayLabel}) — gigs, nightlife, free events, and local plans. Updated throughout the day on HappenMCR.`,
    path: PATH,
    keywords: [
      "events in Manchester today",
      "today in Manchester",
      "Manchester events today",
      "what's on Manchester today",
      "what's on in Manchester today",
      "Manchester gigs today",
      "HappenMCR",
    ],
  });
}

export default async function EventsTodayPage() {
  const events = await getTodayEvents();
  const dayLabel = formatLondonDay();
  const countLabel =
    events.length === 1 ? "1 event" : `${events.length} events`;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events in Manchester today", path: PATH },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: "Events in Manchester today",
          description: `Today in Manchester — ${countLabel} listed for ${dayLabel}.`,
          path: PATH,
          isPartOf: { name: "HappenMCR", path: "/" },
        })}
      />
      <JsonLd
        data={buildEventItemListJsonLd(events, {
          name: `Events in Manchester today — ${dayLabel}`,
          path: PATH,
          description: `${countLabel} on in Manchester today.`,
        })}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }}
      />

      <header className="max-w-3xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Today in Manchester
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Events in Manchester today
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {dayLabel}. {countLabel} listed and updated throughout the day.
        </p>
        <p className="mt-4 text-base leading-relaxed text-secondary sm:text-lg">
          Looking for events in Manchester today? This page is HappenMCR&apos;s
          live day list for Greater Manchester — gigs, nightlife, free events,
          campus talks, and community plans with clear times and venues. We pull
          from public venue calendars and organiser submissions, then keep the
          day view focused so you can decide what to do tonight without opening
          a dozen tabs.
        </p>
        <p className="mt-4 text-base leading-relaxed text-secondary sm:text-lg">
          Prefer a wider browse? Jump to{" "}
          <Link
            href="/whats-on-manchester"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            what&apos;s on in Manchester
          </Link>
          , check{" "}
          <Link
            href="/events/weekend"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            this weekend
          </Link>
          , or explore{" "}
          <Link
            href="/whats-on/free-events-manchester"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            free events
          </Link>
          .
        </p>
      </header>

      <div className="mt-12">
        <EventList
          events={events}
          emptyMessage="No events listed for today yet — check this weekend or free events, or check back soon."
          aria-label="Events in Manchester today"
        />
      </div>

      <section className="mt-16 max-w-3xl" aria-labelledby="today-faq">
        <h2
          id="today-faq"
          className="font-display text-2xl font-bold tracking-tight text-industrial-black"
        >
          Today in Manchester — quick answers
        </h2>
        <dl className="mt-6 space-y-6">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-display text-lg font-semibold text-industrial-black">
                {item.q}
              </dt>
              <dd className="mt-2 text-base leading-relaxed text-secondary">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <ExploreMoreLinks
        title="Keep exploring"
        links={[
          { href: "/whats-on-manchester", label: "What's on in Manchester" },
          { href: "/events/weekend", label: "Events this weekend" },
          {
            href: "/whats-on/free-events-manchester",
            label: "Free events in Manchester",
          },
          { href: "/category/live-music", label: "Live music / gigs" },
          { href: "/category/nightlife", label: "Nightlife" },
          { href: "/mcr-buzz", label: "MCR Buzz" },
          { href: "/about", label: "About HappenMCR" },
        ]}
      />
    </>
  );
}
