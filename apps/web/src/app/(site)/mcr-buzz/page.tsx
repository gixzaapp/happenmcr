import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo";
import { getAllEvents } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import {
  filterMcrBuzzEvents,
  listMcrBuzzSections,
  mcrBuzzLabelList,
  mcrBuzzPath,
} from "@/lib/mcr-buzz";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = REVALIDATE_SECONDS;

const labelList = mcrBuzzLabelList();

export const metadata: Metadata = buildPageMetadata({
  title: "MCR Buzz",
  description: `Local Manchester ${labelList} events from community organisers and the city calendar — not marketplace repeats.`,
  path: "/mcr-buzz",
  keywords: [
    "MCR Buzz",
    "Manchester local events",
    "community events Manchester",
    "HappenMCR",
    ...listMcrBuzzSections().map((section) => section.label),
  ],
});

export default async function McrBuzzHubPage() {
  const allEvents = await getAllEvents();
  const sections = listMcrBuzzSections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
        ])}
      />

      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          MCR Buzz
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          Homegrown {labelList} happenings — from community organisers and
          Manchester City Council, separate from the main ticket marketplace
          feeds.
        </p>
      </header>

      <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const count = filterMcrBuzzEvents(allEvents, section).length;
          const countLabel =
            count === 1 ? "1 local event" : `${count} local events`;

          return (
            <li key={section.id}>
              <Link
                href={mcrBuzzPath(section.slug)}
                className="group block transition hover:opacity-90"
              >
                <h2 className="font-display text-2xl font-bold text-industrial-black group-hover:underline">
                  {section.label}
                </h2>
                <p className="mt-2 text-sm text-secondary">
                  {section.description}
                </p>
                <p className="mt-3 text-sm font-semibold text-industrial-black">
                  {countLabel} →
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-12 text-sm text-secondary">
        Organising something local?{" "}
        <Link
          href="/submit-event"
          className="font-semibold text-industrial-black underline hover:text-[color:var(--accent-ink)]"
        >
          Submit an event
        </Link>
        .
      </p>
    </div>
  );
}
