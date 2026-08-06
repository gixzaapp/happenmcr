import { JsonLd } from "@/components/seo";
import { SubmitEventForm } from "@/components/submit/SubmitEventForm";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = REVALIDATE_SECONDS;

const PATH = "/submit-event";

export const metadata = buildPageMetadata({
  title: "Submit an event",
  description:
    "List your Manchester gig, club night, workshop or community event on HappenMCR.",
  path: PATH,
  keywords: [
    "submit Manchester event",
    "list event Manchester",
    "HappenMCR submit",
  ],
});

export default function SubmitEventPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Submit event", path: PATH },
        ])}
      />

      <header className="max-w-xl">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bee-yellow">
          Organisers
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Submit an event
        </h1>
        <p className="mt-4 text-base text-secondary sm:text-lg">
          Tell us what’s on in Manchester. We review every submission before it
          appears on the site.
        </p>
      </header>

      <div className="mt-10 rounded-xl border border-industrial-black/10 bg-surface-container-low p-6 sm:p-8">
        <SubmitEventForm />
      </div>
    </div>
  );
}
