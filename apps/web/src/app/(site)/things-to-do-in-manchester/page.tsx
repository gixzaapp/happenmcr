import Link from "next/link";
import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import {
  ExperienceCard,
  ExperienceCategoryFilter,
} from "@/components/things-to-do";
import { getViatorExperiences, getWeekendEvents } from "@/lib/api";
import { formatWeekendRange } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";
import {
  EXPERIENCE_CATEGORIES,
  filterExperiencesByCategory,
  getExperienceCategory,
  listManualExperiences,
  mergeExperiences,
  THINGS_TO_DO_DESCRIPTION,
  THINGS_TO_DO_KEYWORDS,
  THINGS_TO_DO_PATH,
  THINGS_TO_DO_TITLE,
} from "@/lib/things-to-do";

export const revalidate = REVALIDATE_SECONDS;

type ThingsToDoPageProps = {
  searchParams?: { category?: string };
};

export const metadata: Metadata = buildPageMetadata({
  title: THINGS_TO_DO_TITLE,
  description: THINGS_TO_DO_DESCRIPTION,
  path: THINGS_TO_DO_PATH,
  keywords: [...THINGS_TO_DO_KEYWORDS],
  absoluteTitle: true,
});

export default async function ThingsToDoInManchesterPage({
  searchParams,
}: ThingsToDoPageProps) {
  const categoryParam = searchParams?.category?.trim() || null;
  const activeCategory = categoryParam
    ? getExperienceCategory(categoryParam)
    : null;
  const [viatorExperiences, weekendEvents] = await Promise.all([
    getViatorExperiences({ cache: REVALIDATE_SECONDS }),
    getWeekendEvents(),
  ]);
  const allExperiences = mergeExperiences(
    viatorExperiences,
    listManualExperiences(),
  );
  const experiences = filterExperiencesByCategory(
    allExperiences,
    activeCategory?.id,
  );
  const weekendLabel = formatWeekendRange();
  const weekendCount =
    weekendEvents.length === 1
      ? "1 event"
      : `${weekendEvents.length} events`;
  const resultsHeading = activeCategory
    ? activeCategory.label
    : "Featured experiences";
  const countLabel =
    experiences.length === 1
      ? "1 experience"
      : `${experiences.length} experiences`;

  return (
    <div className="mx-auto w-full max-w-site px-grid-margin py-8 sm:py-12">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Things to Do in Manchester", path: THINGS_TO_DO_PATH },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: "Things to Do in Manchester",
          description: THINGS_TO_DO_DESCRIPTION,
          path: THINGS_TO_DO_PATH,
          isPartOf: { name: "HappenMCR", path: "/" },
        })}
      />

      <header className="max-w-3xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Experiences &amp; activities
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-industrial-black sm:text-4xl">
          Things to Do in Manchester
        </h1>
        <p className="mt-3 text-base leading-relaxed text-secondary">
          Tours, attractions, food experiences and activities — beyond gigs and
          nightlife.
        </p>
      </header>

      <ExperienceCategoryFilter
        categories={EXPERIENCE_CATEGORIES}
        activeId={activeCategory?.id ?? null}
      />

      <section
        id="experiences"
        aria-labelledby="experiences-heading"
        className="mt-8 scroll-mt-28"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="experiences-heading"
              className="font-display text-xl font-bold tracking-tight text-industrial-black sm:text-2xl"
            >
              {resultsHeading}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {countLabel}
              {activeCategory ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={`${THINGS_TO_DO_PATH}#experiences`}
                    className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
                  >
                    Clear filter
                  </Link>
                </>
              ) : (
                " · Viator + HappenMCR picks"
              )}
            </p>
          </div>
        </div>

        {experiences.length > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <li key={experience.id}>
                <ExperienceCard experience={experience} titleAs="h3" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-xl border border-industrial-black/10 bg-surface-container-low p-6">
            <p className="font-display text-lg font-semibold text-industrial-black">
              {activeCategory
                ? `No ${activeCategory.label.toLowerCase()} listed yet`
                : "Experiences coming soon"}
            </p>
            <p className="mt-2 text-base text-secondary">
              Try another category, or browse weekend events below.
            </p>
            {activeCategory ? (
              <Link
                href={`${THINGS_TO_DO_PATH}#experiences`}
                className="mt-4 inline-flex font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
              >
                View all experiences
              </Link>
            ) : null}
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-secondary">
          Some outbound links may be affiliate or partner links. HappenMCR may
          earn a commission if you book through them, at no extra cost to you.
          Partner listings open on Viator.com.
        </p>
      </section>

      <section
        id="weekend"
        aria-labelledby="weekend-things-heading"
        className="mt-14"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="weekend-things-heading"
              className="font-display text-xl font-bold tracking-tight text-industrial-black sm:text-2xl"
            >
              Things to do this weekend
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {weekendLabel}. {weekendCount} from the HappenMCR calendar.
            </p>
          </div>
          <Link
            href="/events/weekend"
            className="text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            Full weekend list
          </Link>
        </div>
        <div className="mt-6">
          <EventList
            events={weekendEvents.slice(0, 8)}
            emptyMessage="No weekend events listed yet — check back soon."
            aria-label="Things to do in Manchester this weekend"
            titleAs="h3"
          />
        </div>
      </section>

      <ExploreMoreLinks
        title="Explore more Manchester events"
        links={[
          { href: "/category/live-music", label: "Gigs" },
          { href: "/category/nightlife", label: "Nightlife" },
          { href: "/category/festivals", label: "Festivals" },
          { href: "/community", label: "Community events" },
          { href: "/events/today", label: "Events in Manchester today" },
          { href: "/whats-on-manchester", label: "What's on in Manchester" },
        ]}
      />
    </div>
  );
}
