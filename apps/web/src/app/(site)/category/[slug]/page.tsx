import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventList } from "@/components/events";
import {
  categoryExploreLinks,
  ExploreMoreLinks,
  JsonLd,
} from "@/components/seo";
import {
  getAllEvents,
  getCategoryEvents,
  listCategories,
} from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

/** ISR: category indexes regenerated every 10 minutes. */
export const revalidate = REVALIDATE_SECONDS;

/** Unknown/legacy slugs can still resolve on demand. */
export const dynamicParams = true;

type CategoryPageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const events = await getAllEvents();
  return listCategories(events).map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const result = await getCategoryEvents(params.slug);

  if (!result) {
    return buildPageMetadata({
      title: "Category not found",
      description: "This category is unavailable on HappenMCR.",
      path: `/category/${params.slug}`,
      index: false,
      follow: false,
    });
  }

  const { category, events } = result;
  const path = `/category/${category.slug}`;
  const count = events.length;
  const countLabel =
    count === 0 ? "Find" : count === 1 ? "1" : `${count}`;

  const title = `${category.name} events in Manchester`;
  const description = `${countLabel} ${category.name.toLowerCase()} event${count === 1 ? "" : "s"} in Manchester. Browse live listings, gigs, and nights out on HappenMCR.`;

  return buildPageMetadata({
    title,
    description,
    path,
    keywords: [
      category.name,
      `${category.name} Manchester`,
      `${category.name} events Manchester`,
      "live music Manchester",
      "Manchester events",
      "what's on Manchester",
      "HappenMCR",
    ],
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const result = await getCategoryEvents(params.slug);

  if (!result) {
    notFound();
  }

  const { category, events } = result;
  const countLabel =
    events.length === 1 ? "1 event" : `${events.length} events`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Events", path: "/events/today" },
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
          Category
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[color:var(--ink)] sm:text-5xl">
          {category.name} events in Manchester
        </h1>
        <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">
          {countLabel} tagged {category.name.toLowerCase()}.
        </p>
      </header>

      <div id="events" className="mt-12 scroll-mt-28">
        <EventList
          events={events}
          emptyMessage={`No ${category.name.toLowerCase()} events listed yet.`}
          aria-label={`${category.name} events in Manchester`}
        />
      </div>

      <ExploreMoreLinks
        title="Explore more"
        links={categoryExploreLinks(category.name, events)}
      />
    </div>
  );
}
