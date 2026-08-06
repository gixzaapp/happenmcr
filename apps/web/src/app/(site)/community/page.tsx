import {
  CharityDirectory,
  CommunityHero,
  CommunityMobileNav,
  CommunitySidebar,
  ImpactNow,
} from "@/components/community";
import { JsonLd } from "@/components/seo";
import { getAllEvents } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import type { Event } from "@happenmcr/types";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = REVALIDATE_SECONDS;

export const metadata = buildPageMetadata({
  title: "Community & Charity Hub",
  description:
    "Grit & Goodness — workshops, volunteering, and local charities across Manchester on HappenMCR.",
  path: "/community",
  keywords: [
    "Manchester community",
    "Manchester volunteering",
    "Manchester charities",
    "HappenMCR",
  ],
});

function pickWorkshop(events: Event[]): Event | null {
  const ranked = [...events].sort((a, b) => {
    const score = (event: Event) => {
      const hay = `${event.title} ${event.description ?? ""} ${event.category ?? ""}`.toLowerCase();
      let value = 0;
      if (hay.includes("workshop")) value += 3;
      if (hay.includes("community")) value += 2;
      if (hay.includes("volunteer")) value += 2;
      if (event.category?.toLowerCase().includes("art")) value += 1;
      return value;
    };
    return score(b) - score(a);
  });

  return ranked.find((event) => {
    const hay = `${event.title} ${event.description ?? ""}`.toLowerCase();
    return (
      hay.includes("workshop") ||
      hay.includes("community") ||
      event.category?.toLowerCase().includes("art")
    );
  }) ?? ranked[0] ?? null;
}

export default async function CommunityPage() {
  const allEvents = await getAllEvents();
  const workshopHits = allEvents.filter((event) => {
    const hay =
      `${event.title} ${event.description ?? ""} ${event.category ?? ""}`.toLowerCase();
    return (
      hay.includes("workshop") ||
      hay.includes("community") ||
      hay.includes("volunteer")
    );
  });

  const workshop =
    pickWorkshop(workshopHits) ??
    pickWorkshop(
      allEvents.filter((event) =>
        (event.category ?? "").toLowerCase().includes("art"),
      ),
    );

  return (
    <div className="mx-auto flex w-full max-w-site">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Community", path: "/community" },
        ])}
      />
      <CommunitySidebar />
      <div className="min-w-0 flex-1 px-grid-margin py-8">
        <CommunityMobileNav />
        <CommunityHero />
        <ImpactNow workshop={workshop} />
        <div id="talks" className="scroll-mt-28" />
        <CharityDirectory />
      </div>

      <a
        href="#submit-project"
        className="fixed bottom-8 right-8 z-40 hidden h-16 w-16 items-center justify-center rounded-full bg-bee-yellow text-industrial-black shadow-2xl transition-transform hover:scale-110 md:flex"
        aria-label="Add event"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </a>
    </div>
  );
}
