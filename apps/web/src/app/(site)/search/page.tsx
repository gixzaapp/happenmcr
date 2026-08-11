import type { Metadata } from "next";
import { EventList } from "@/components/events";
import { SearchForm } from "@/components/search/SearchForm";
import { JsonLd } from "@/components/seo";
import { getSearchEvents } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { buildPageMetadata } from "@/lib/seo";

/**
 * Search results are SSR'd so Google (and users) always get fresh HTML
 * for `?q=` queries. The blank `/search` landing is also rendered on demand.
 */
export const dynamic = "force-dynamic";

const PATH = "/search";

type SearchPageProps = {
  searchParams: { q?: string | string[] };
};

function readQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const q = readQuery(searchParams.q);
  const title = q ? `Search results for “${q}”` : "Search Manchester events";
  const description = q
    ? `Events in Manchester matching “${q}” on HappenMCR.`
    : "Search Manchester events by title, venue, or category on HappenMCR.";

  return buildPageMetadata({
    title,
    description,
    // Always self-canonical to /search — never mint indexed URLs per query.
    path: PATH,
    keywords: q
      ? [q, "Manchester events", "HappenMCR search", "HappenMCR"]
      : ["search Manchester events", "HappenMCR"],
    // Search UI is a tool page (thin / query-shaped) — keep out of the index.
    index: false,
    follow: true,
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = readQuery(searchParams.q);
  const events = q ? await getSearchEvents(q) : [];
  const countLabel =
    events.length === 1 ? "1 result" : `${events.length} results`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          {
            name: q ? `Search: ${q}` : "Search",
            path: q ? `${PATH}?q=${encodeURIComponent(q)}` : PATH,
          },
        ])}
      />
      <header className="max-w-2xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
          Search
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[color:var(--ink)] sm:text-5xl">
          {q ? `Results for “${q}”` : "Search Manchester events"}
        </h1>
        <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">
          {q
            ? `${countLabel} matching title, venue, category, or tags.`
            : "Find gigs, venues, and free events across the city."}
        </p>
      </header>

      <div className="mt-8 max-w-2xl">
        <SearchForm key={q || "empty"} initialQuery={q} autoFocus={!q} />
      </div>

      <div className="mt-12">
        {q ? (
          <EventList
            events={events}
            emptyMessage={`No events found for “${q}”. Try another venue or artist.`}
            aria-label={`Search results for ${q}`}
          />
        ) : (
          <p className="text-sm text-[color:var(--muted)]" role="status">
            Enter a search to see matching events.
          </p>
        )}
      </div>
    </div>
  );
}
