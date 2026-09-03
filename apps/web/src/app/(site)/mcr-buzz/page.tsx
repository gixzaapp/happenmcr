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
import { MCR_HISTORY_LABEL, MCR_HISTORY_PATH } from "@/lib/mcr-history";
import { MCR_ON_LENS_LABEL, MCR_ON_LENS_PATH } from "@/lib/mcr-on-lens";
import { buildPageMetadata } from "@/lib/seo";

/** Always fresh — avoid sticky empty ISR after deploy/ingest. */
export const dynamic = "force-dynamic";

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
  const allEvents = await getAllEvents({ cache: "no-store" });
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

      <section className="mt-12 border-t border-industrial-black/10 pt-10">
        <h2 className="font-display text-xl font-bold text-industrial-black">
          Stories &amp; community
        </h2>
        <ul className="mt-6 grid gap-8 sm:grid-cols-2">
          <li>
            <Link
              href={MCR_HISTORY_PATH}
              className="group block transition hover:opacity-90"
            >
              <h3 className="font-display text-2xl font-bold text-industrial-black group-hover:underline">
                {MCR_HISTORY_LABEL}
              </h3>
              <p className="mt-2 text-sm text-secondary">
                From Roman Mamucium to Cottonopolis — how Manchester became the
                world&apos;s first industrial city, and reinvented itself again.
              </p>
              <p className="mt-3 text-sm font-semibold text-industrial-black">
                Read the story →
              </p>
            </Link>
          </li>
          <li>
            <Link
              href={MCR_ON_LENS_PATH}
              className="group block transition hover:opacity-90"
            >
              <h3 className="font-display text-2xl font-bold text-industrial-black group-hover:underline">
                {MCR_ON_LENS_LABEL}
              </h3>
              <p className="mt-2 text-sm text-secondary">
                See Manchester through the community lens — photos, places, and
                people.
              </p>
              <p className="mt-3 text-sm font-semibold text-industrial-black">
                View the feed →
              </p>
            </Link>
          </li>
        </ul>
      </section>

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
