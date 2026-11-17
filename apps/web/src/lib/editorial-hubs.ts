import type { Event } from "@happenmcr/types";
import { getMcrBuzzSection, filterMcrBuzzEvents } from "@/lib/mcr-buzz";

export type EditorialHub = {
  slug: string;
  path: string;
  title: string;
  headline: string;
  description: string;
  intro: string;
  tips: string[];
  keywords: string[];
};

export const EDITORIAL_HUBS: EditorialHub[] = [
  {
    slug: "free-events-manchester",
    path: "/whats-on/free-events-manchester",
    title: "Free Events in Manchester",
    headline: "Free things to do in Manchester",
    description:
      "Free events in Manchester — galleries, talks, community days, and no-ticket nights. Updated daily on HappenMCR.",
    intro:
      "Manchester still does free well: museum late openings, campus talks, community markets, and outdoor seasons when the weather plays along. This guide pulls free listings from across the city calendar so you can plan without a ticket budget. We refresh the list daily from venue sources and organiser submissions — always double-check the event page before you travel, especially for capacity-limited free shows.",
    tips: [
      "Free does not always mean turn-up — some listings still need a free registration.",
      "Campus and gallery events often cluster midweek; weekends fill with markets and outdoor programmes.",
      "Use Submit Event if you run a free community day we have missed.",
    ],
    keywords: [
      "free events Manchester",
      "free things to do Manchester",
      "Manchester free events",
      "HappenMCR",
    ],
  },
  {
    slug: "things-to-do-this-weekend-manchester",
    path: "/whats-on/things-to-do-this-weekend-manchester",
    title: "Things to Do This Weekend in Manchester",
    headline: "Things to do this weekend in Manchester",
    description:
      "Weekend plans in Manchester — gigs, nightlife, family days, and local events for Saturday and Sunday on HappenMCR.",
    intro:
      "Weekends in Manchester move fast: Saturday markets and matinees, Saturday-night rooms, and Sunday recovery plans that still feel like a day out. This page is our weekend shortlist drawn from the live calendar — not a static brochure. We favour clear times and venues so you can build a day without opening ten tabs. If a show is postponed, we mark it when we know.",
    tips: [
      "Check Today as well as Weekend if you are reading this on a Sunday.",
      "Northern Quarter, Ancoats, and city-centre rooms fill early on Friday and Saturday nights.",
      "Free and family listings often sit earlier in the day — scroll past the late gigs.",
    ],
    keywords: [
      "things to do this weekend Manchester",
      "Manchester weekend events",
      "what's on this weekend Manchester",
      "HappenMCR",
    ],
  },
  {
    slug: "student-nights-manchester",
    path: "/whats-on/student-nights-manchester",
    title: "Student Nights in Manchester",
    headline: "Student nights and campus events in Manchester",
    description:
      "Student nights, societies, and university calendar events across Manchester — UoM, MMU, Salford and more on HappenMCR.",
    intro:
      "Manchester’s student calendar is its own city: society socials, freshers holdovers, campus gigs, and club nights aimed at student cards. We surface those listings alongside the wider city guide so you can see what is on without living inside five Instagram accounts. Sources include university calendars and local promoters — always check entry rules and ID requirements on the ticket page.",
    tips: [
      "Many student nights are midweek — Tuesday to Thursday are often the busy club nights.",
      "Campus talks and society events are usually free or cheap; club nights vary.",
      "Organisers: submit via HappenMCR if your society night is missing.",
    ],
    keywords: [
      "student nights Manchester",
      "Manchester university events",
      "MMU events",
      "University of Manchester events",
      "HappenMCR",
    ],
  },
  {
    slug: "drum-and-bass-manchester",
    path: "/whats-on/drum-and-bass-manchester",
    title: "Drum and Bass Events in Manchester",
    headline: "Drum and bass in Manchester",
    description:
      "Drum and bass, DnB, and jungle nights in Manchester — raves, club shows, and local promotions listed on HappenMCR.",
    intro:
      "Manchester’s bass scene still books proper rooms: warehouse one-offs, club residencies, and touring packages that hit the city hard. This hub filters the live calendar for drum and bass, DnB, and jungle-leaning nights so you can scan what is coming without wading through every genre tag. Listings come from promoters and venues — sound systems and door policies live on the organiser page.",
    tips: [
      "Search titles for DnB, drum & bass, jungle, and liquid if a night uses a niche spelling.",
      "Weekenders and warehouse bills often announce late — check back midweek.",
      "Pair with Nightlife and Today for the wider electronic picture.",
    ],
    keywords: [
      "drum and bass Manchester",
      "DnB Manchester",
      "jungle night Manchester",
      "Manchester raves",
      "HappenMCR",
    ],
  },
];

const hubsBySlug = new Map(EDITORIAL_HUBS.map((hub) => [hub.slug, hub]));

export function getEditorialHub(slug: string): EditorialHub | null {
  return hubsBySlug.get(slug.trim().toLowerCase()) ?? null;
}

export function listEditorialHubs(): EditorialHub[] {
  return EDITORIAL_HUBS;
}

const DNB_RE =
  /\b(drum\s*(and|&)\s*bass|dnb|d&b|jungle|neurofunk|liquid\s*dnb)\b/i;

export function filterEventsForHub(slug: string, events: Event[]): Event[] {
  const key = slug.trim().toLowerCase();
  const upcoming = events.filter((event) => {
    if (event.status && event.status !== "scheduled") return false;
    const t = new Date(event.start_time).getTime();
    return Number.isFinite(t) && t >= Date.now() - 60 * 60 * 1000;
  });

  switch (key) {
    case "free-events-manchester":
      return upcoming.filter((event) => event.is_free);
    case "things-to-do-this-weekend-manchester":
      // Caller should pass weekend events; fall back to weekend-ish filter.
      return upcoming;
    case "student-nights-manchester": {
      const section = getMcrBuzzSection("student");
      if (section) return filterMcrBuzzEvents(upcoming, section);
      return upcoming.filter((event) => {
        const hay = [
          event.title,
          event.description ?? "",
          event.category ?? "",
          ...event.tags,
        ]
          .join(" ")
          .toLowerCase();
        return /student|university|freshers|campus|mmu|salford/.test(hay);
      });
    }
    case "drum-and-bass-manchester":
      return upcoming.filter((event) => {
        const hay = [
          event.title,
          event.description ?? "",
          event.category ?? "",
          ...event.tags,
        ].join(" ");
        return DNB_RE.test(hay);
      });
    default:
      return upcoming;
  }
}
