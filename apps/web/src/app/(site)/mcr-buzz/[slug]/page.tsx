import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventList } from "@/components/events";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import { getAllEvents } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import {
  filterMcrBuzzEvents,
  getMcrBuzzSection,
  listMcrBuzzSections,
  mcrBuzzPath,
  mcrBuzzSiblingLinks,
} from "@/lib/mcr-buzz";
import { buildPageMetadata } from "@/lib/seo";

/** Always fresh — avoid sticky empty ISR after deploy/ingest. */
export const dynamic = "force-dynamic";
export const dynamicParams = false;

type McrBuzzPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return listMcrBuzzSections().map((section) => ({ slug: section.slug }));
}

export async function generateMetadata({
  params,
}: McrBuzzPageProps): Promise<Metadata> {
  const section = getMcrBuzzSection(params.slug);
  if (!section) {
    return buildPageMetadata({
      title: "MCR Buzz",
      description: "Local Manchester community events on HappenMCR.",
      path: mcrBuzzPath(params.slug),
      index: false,
      follow: false,
    });
  }

  const path = mcrBuzzPath(section.slug);
  return buildPageMetadata({
    title: `${section.label} · MCR Buzz`,
    description: section.description,
    path,
    keywords: [
      section.label,
      "MCR Buzz",
      "Manchester local events",
      "HappenMCR",
      ...section.keywords.slice(0, 6),
    ],
  });
}

export default async function McrBuzzSectionPage({ params }: McrBuzzPageProps) {
  const section = getMcrBuzzSection(params.slug);
  if (!section) notFound();

  const events = filterMcrBuzzEvents(
    await getAllEvents({ cache: "no-store" }),
    section,
  );
  const path = mcrBuzzPath(section.slug);
  const countLabel =
    events.length === 1 ? "1 local event" : `${events.length} local events`;

  const sections = listMcrBuzzSections();
  const siblingLinks = mcrBuzzSiblingLinks(section.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: section.label, path },
        ])}
      />

      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          MCR Buzz
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          {section.label}
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          {section.description}
        </p>
        <p className="mt-2 text-sm text-secondary">
          {countLabel} from community organisers and Manchester City Council —
          not marketplace repeats.
        </p>
      </header>

      <nav
        aria-label="MCR Buzz sections"
        className="mt-8 flex flex-wrap gap-2"
      >
        {sections.map((item) => {
          const active = item.id === section.id;
          return (
            <Link
              key={item.id}
              href={mcrBuzzPath(item.slug)}
              className={`rounded-lg px-4 py-2 font-display text-sm font-semibold transition ${
                active
                  ? "bg-bee-yellow text-industrial-black"
                  : "border border-industrial-black/10 text-secondary hover:text-industrial-black"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div id="events" className="mt-12 scroll-mt-28">
        <EventList
          events={events}
          emptyMessage={`No local ${section.label.toLowerCase()} events listed yet. Community submissions appear here after approval.`}
          aria-label={`${section.label} local events`}
        />
      </div>

      <p className="mt-8 text-sm text-secondary">
        Organising something local?{" "}
        <Link
          href="/submit-event"
          className="font-semibold text-industrial-black underline hover:text-[color:var(--accent-ink)]"
        >
          Submit an event
        </Link>
        .
      </p>

      <ExploreMoreLinks title="More MCR Buzz" links={siblingLinks} />
    </div>
  );
}
