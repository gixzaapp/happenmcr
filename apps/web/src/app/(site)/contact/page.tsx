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

const PATH = "/contact";
const CONTACT_EMAIL = "hello@happenmcr.com";

export const metadata = buildPageMetadata({
  title: "Contact HappenMCR",
  description:
    "Contact HappenMCR about Manchester event listings, corrections, submissions, or partnerships.",
  path: PATH,
  keywords: ["Contact HappenMCR", "Manchester events", "submit event"],
});

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-grid-margin py-12 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Contact", path: PATH },
        ])}
      />
      <JsonLd
        data={buildWebPageJsonLd({
          name: "Contact HappenMCR",
          description:
            "Email HappenMCR for listing corrections, event submissions, and general enquiries.",
          path: PATH,
        })}
      />

      <p className="text-label-md uppercase tracking-[0.14em] text-secondary">
        Get in touch
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
        Contact
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-secondary sm:text-lg">
        <p>
          Email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          . We read every message about listing mistakes, postponed shows,
          partnership ideas, and press.
        </p>
        <p>
          To add a public event to the calendar, use the{" "}
          <Link
            href="/submit-event"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            submit event form
          </Link>
          . Include a clear title, date, venue, and ticket or info link so we
          can review it quickly.
        </p>
        <p>
          For how we handle personal data, see our{" "}
          <Link
            href="/privacy"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 rounded-lg border border-industrial-black/10 bg-surface-container-low p-6">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-secondary">
          Email
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-2 inline-block font-display text-xl font-bold text-industrial-black"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-4 text-sm text-secondary">
          Based in Greater Manchester · HappenMCR is an independent local guide.
        </p>
      </div>
    </div>
  );
}
