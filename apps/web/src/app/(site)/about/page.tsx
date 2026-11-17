import Link from "next/link";
import { JsonLd } from "@/components/seo";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = REVALIDATE_SECONDS;

const PATH = "/about";

export const metadata = buildPageMetadata({
  title: "About HappenMCR",
  description:
    "HappenMCR is Manchester’s local what’s-on guide — gigs, nightlife, community events, and city stories curated for people who live here.",
  path: PATH,
  keywords: [
    "About HappenMCR",
    "Manchester events guide",
    "what's on Manchester",
  ],
});

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-grid-margin py-12 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "About", path: PATH },
        ])}
      />
      <JsonLd
        data={buildWebPageJsonLd({
          name: "About HappenMCR",
          description:
            "Who we are, how we list Manchester events, and how organisers can submit.",
          path: PATH,
        })}
      />

      <p className="text-label-md uppercase tracking-[0.14em] text-secondary">
        HappenMCR
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
        About us
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-secondary sm:text-lg">
        <p>
          HappenMCR is a Manchester-first guide to what is on in the city. We
          bring gigs, nightlife, community events, student nights, and local
          culture into one place so you can plan a night out — or a free afternoon
          — without jumping between a dozen venue sites.
        </p>
        <p>
          Listings are gathered from public venue calendars and ticketing
          platforms, then organised by day, category, and neighbourhood. We also
          publish original Manchester editorial under MCR Buzz — including city
          history, community photos on MCR on Lens, and Poet&apos;s Corner —
          because a useful local guide is more than a raw feed of scraped pages.
        </p>
        <p>
          Organisers can{" "}
          <Link
            href="/submit-event"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            submit an event
          </Link>{" "}
          for review. We update the calendar daily and mark shows that are
          postponed or cancelled when we know about them.
        </p>
        <p>
          Questions, corrections, or partnership ideas:{" "}
          <a
            href="mailto:hello@happenmcr.com"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            hello@happenmcr.com
          </a>
          . More detail is on our{" "}
          <Link
            href="/contact"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            contact page
          </Link>
          .
        </p>
      </div>

      <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
        <li>
          <Link
            href="/whats-on-manchester"
            className="font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            What&apos;s on in Manchester
          </Link>
        </li>
        <li>
          <Link
            href="/mcr-buzz"
            className="font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            MCR Buzz
          </Link>
        </li>
        <li>
          <Link
            href="/submit-event"
            className="font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            Submit an event
          </Link>
        </li>
        <li>
          <Link
            href="/privacy"
            className="font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            Privacy
          </Link>
        </li>
      </ul>
    </div>
  );
}
