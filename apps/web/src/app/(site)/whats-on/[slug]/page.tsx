import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventList } from "@/components/events";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import { getAllEvents, getWeekendEvents } from "@/lib/api";
import {
  filterEventsForHub,
  getEditorialHub,
  listEditorialHubs,
} from "@/lib/editorial-hubs";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEventItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = REVALIDATE_SECONDS;

type HubPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return listEditorialHubs().map((hub) => ({ slug: hub.slug }));
}

export async function generateMetadata({
  params,
}: HubPageProps): Promise<Metadata> {
  const hub = getEditorialHub(params.slug);
  if (!hub) {
    return buildPageMetadata({
      title: "What's on in Manchester",
      description: "Manchester event guides on HappenMCR.",
      path: `/whats-on/${params.slug}`,
      index: false,
    });
  }

  return buildPageMetadata({
    title: hub.title,
    description: hub.description,
    path: hub.path,
    keywords: hub.keywords,
  });
}

export default async function EditorialHubPage({ params }: HubPageProps) {
  const hub = getEditorialHub(params.slug);
  if (!hub) notFound();

  const events =
    hub.slug === "things-to-do-this-weekend-manchester"
      ? await getWeekendEvents()
      : filterEventsForHub(hub.slug, await getAllEvents());

  const listed = events.slice(0, 24);
  const otherHubs = listEditorialHubs()
    .filter((item) => item.slug !== hub.slug)
    .map((item) => ({ href: item.path, label: item.title }));

  return (
    <div className="mx-auto w-full max-w-site px-grid-margin py-12 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "What's On", path: "/whats-on-manchester" },
          { name: hub.title, path: hub.path },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: hub.title,
          description: hub.description,
          path: hub.path,
          isPartOf: { name: "What's On in Manchester", path: "/whats-on-manchester" },
        })}
      />
      <JsonLd
        data={buildEventItemListJsonLd(listed, {
          name: hub.headline,
          path: hub.path,
          description: hub.description,
        })}
      />

      <header className="max-w-3xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          HappenMCR guide
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          {hub.headline}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-secondary sm:text-lg">
          {hub.intro}
        </p>
      </header>

      <section className="mt-10 max-w-3xl" aria-labelledby="hub-tips">
        <h2
          id="hub-tips"
          className="font-display text-xl font-bold text-industrial-black"
        >
          Local tips
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base text-secondary">
          {hub.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="hub-listings">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="hub-listings"
            className="font-display text-2xl font-bold tracking-tight text-industrial-black"
          >
            Upcoming listings
          </h2>
          <p className="text-sm text-secondary">
            {listed.length === 0
              ? "None listed right now"
              : listed.length === 1
                ? "1 listing"
                : `${listed.length} listings`}
          </p>
        </div>
        <div className="mt-8">
          <EventList
            events={listed}
            emptyMessage="Nothing matching this guide right now — check Today or Weekend, or submit an event."
            aria-label={hub.headline}
            titleAs="h3"
          />
        </div>
      </section>

      <ExploreMoreLinks
        title="More Manchester guides"
        links={[
          { href: "/whats-on-manchester", label: "What's on in Manchester" },
          { href: "/events/today", label: "Events in Manchester today" },
          { href: "/events/weekend", label: "This weekend" },
          { href: "/about", label: "About HappenMCR" },
          ...otherHubs,
        ]}
      />

      <p className="mt-10 text-sm text-secondary">
        How we pick listings:{" "}
        <Link
          href="/about"
          className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
        >
          about HappenMCR
        </Link>
        .
      </p>
    </div>
  );
}
