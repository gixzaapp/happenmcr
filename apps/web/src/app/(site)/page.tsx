import {
  ChooseVibe,
  FeaturedDiscovery,
  HomeHero,
  Newsletter,
  type VibeCard,
} from "@/components/home";
import { JsonLd } from "@/components/seo";
import { getAllEvents, getTodayEvents, pickTrending } from "@/lib/api";
import { buildLocalBusinessJsonLd, buildOrganizationJsonLd } from "@/lib/jsonld";
import {
  filterMcrBuzzEvents,
  getMcrBuzzSection,
  mcrBuzzPath,
} from "@/lib/mcr-buzz";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import {
  buildPageMetadata,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "@/lib/seo";
import {
  categoryMatchesSlug,
  slugifyCategory,
} from "@happenmcr/types";

/** ISR homepage — refreshed every 10 minutes. */
export const revalidate = REVALIDATE_SECONDS;

export const metadata = buildPageMetadata({
  title: "HappenMCR | What's On in Manchester — Events, Gigs & Nightlife",
  description: DEFAULT_DESCRIPTION,
  path: "/",
  keywords: [...DEFAULT_KEYWORDS],
  absoluteTitle: true,
});

const VIBE_IMAGES = {
  gigs: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
  nightlife:
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80",
  workshops:
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80",
  student:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
} as const;

function countForSlug(
  events: Awaited<ReturnType<typeof getAllEvents>>,
  slug: string,
): number {
  return events.filter(
    (event) => event.category && categoryMatchesSlug(event.category, slug),
  ).length;
}

function countForQuery(
  events: Awaited<ReturnType<typeof getAllEvents>>,
  query: string,
): number {
  const needle = query.toLowerCase();
  return events.filter((event) => {
    const hay = [
      event.title,
      event.description ?? "",
      event.category ?? "",
      ...event.tags,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  }).length;
}

export default async function HomePage() {
  const [allEvents, todayEvents] = await Promise.all([
    getAllEvents(),
    getTodayEvents(),
  ]);

  const featured = pickTrending(allEvents, { limit: 3, days: 14 });

  const gigsCount =
    countForSlug(allEvents, "gigs") + countForSlug(allEvents, "live-music");
  const nightlifeCount =
    countForSlug(allEvents, "nightlife") +
    countForSlug(allEvents, "electronic") +
    countForSlug(allEvents, "club");
  const workshopsCount =
    countForSlug(allEvents, "arts-culture") +
    countForSlug(allEvents, "arts-and-culture") +
    countForSlug(allEvents, "arts") +
    countForQuery(allEvents, "workshop");
  const studentSection = getMcrBuzzSection("student");
  const studentCount = studentSection
    ? filterMcrBuzzEvents(allEvents, studentSection).length
    : 0;

  const vibes: VibeCard[] = [
    {
      href: "/category/live-music",
      label: "GIGS",
      countLabel: `${Math.max(gigsCount, 1)}+ Events`,
      image: VIBE_IMAGES.gigs,
    },
    {
      href: nightlifeCount > 0 ? "/category/electronic" : "/category/club",
      label: "NIGHTLIFE",
      countLabel: `${Math.max(nightlifeCount, 1)}+ Parties`,
      image: VIBE_IMAGES.nightlife,
    },
    {
      href: `/category/${slugifyCategory("Arts And Culture")}`,
      label: "WORKSHOPS",
      countLabel: `${Math.max(workshopsCount, 1)}+ Skills`,
      image: VIBE_IMAGES.workshops,
    },
    {
      href: studentSection
        ? mcrBuzzPath(studentSection.slug)
        : "/mcr-buzz",
      label: "STUDENT",
      countLabel: `${Math.max(studentCount, 1)}+ Offers`,
      image: VIBE_IMAGES.student,
    },
  ];

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildLocalBusinessJsonLd()} />
      <HomeHero todayEvents={todayEvents} />
      <FeaturedDiscovery events={featured} />
      <ChooseVibe vibes={vibes} />
      <Newsletter />
    </>
  );
}
