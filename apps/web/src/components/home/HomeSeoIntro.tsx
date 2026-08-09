import Link from "next/link";

const LINKS = [
  { href: "/category/live-music", label: "Live music Manchester" },
  { href: "/category/electronic", label: "Nightlife & club nights" },
  { href: "/events/free", label: "Free Manchester events" },
  { href: "/events/today", label: "What's on today" },
  { href: "/mcr-buzz/food-drink", label: "Food & drink" },
  { href: "/community", label: "Community & workshops" },
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
          What&apos;s on in Manchester
        </h2>
        <p className="mt-4 max-w-3xl text-base text-secondary sm:text-lg">
          HappenMCR lists live music Manchester, gigs, nightlife and drum and
          bass events across the city — plus free events, student nights, and
          food &amp; drink plans like cocktail masterclasses. From underground
          warehouse raves to community garden workshops, we pull the city
          calendar into one place and keep it updated daily.
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {LINKS.map((link) => (
            <li key={link.href}>
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
