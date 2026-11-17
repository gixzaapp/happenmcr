import Link from "next/link";

const LINKS = [
  { href: "/events/today", label: "Events in Manchester today" },
  { href: "/whats-on-manchester", label: "What's on in Manchester" },
  { href: "/events/weekend", label: "This weekend" },
  { href: "/whats-on/free-events-manchester", label: "Free events guide" },
  { href: "/whats-on/student-nights-manchester", label: "Student nights" },
  {
    href: "/whats-on/drum-and-bass-manchester",
    label: "Drum and bass",
  },
  {
    href: "/whats-on/northern-quarter-nightlife",
    label: "Northern Quarter nightlife",
  },
  { href: "/mcr-buzz", label: "MCR Buzz editorial" },
  { href: "/about", label: "About HappenMCR" },
] as const;

/**
 * Crawlable homepage copy for high-intent Manchester event searches.
 * Kept below the fold — one job: plain-language discovery links.
 */
export function HomeSeoIntro() {
  return (
    <section
      aria-labelledby="home-seo-heading"
      className="border-t border-industrial-black/10 bg-canvas-white py-stack-lg"
    >
      <div className="mx-auto max-w-site px-grid-margin">
        <h2
          id="home-seo-heading"
          className="max-w-2xl font-display text-2xl font-bold tracking-tight text-industrial-black sm:text-3xl"
        >
          Events in Manchester today
        </h2>
        <p className="mt-4 max-w-3xl text-base text-secondary sm:text-lg">
          HappenMCR is a local guide to{" "}
          <Link
            href="/events/today"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            today in Manchester
          </Link>
          {" "}
          — live music, nightlife, free events, student nights, and drum and bass
          across Greater Manchester, organised by day and vibe. Listings come
          from venue calendars and organiser submissions; we mark postponed
          shows when we know, and we publish original city writing under MCR Buzz
          — history, community photos, and Poet&apos;s Corner — alongside the
          calendar.
        </p>
        <p className="mt-4 max-w-3xl text-base text-secondary sm:text-lg">
          Start with{" "}
          <Link
            href="/events/today"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            events in Manchester today
          </Link>
          , the weekend, a niche guide below, or{" "}
          <Link
            href="/submit-event"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            submit an event
          </Link>{" "}
          if you are putting something on.
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {LINKS.map((link) => (
            <li key={`${link.href}:${link.label}`}>
              <Link
                href={link.href}
                className="font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4 transition hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
