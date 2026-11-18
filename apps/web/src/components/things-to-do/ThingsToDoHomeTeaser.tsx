import Link from "next/link";
import {
  listHomeTeaserCategories,
  THINGS_TO_DO_PATH,
} from "@/lib/things-to-do";
import { ExperienceCategoryGrid } from "./ExperienceCategoryGrid";

export function ThingsToDoHomeTeaser() {
  const categories = listHomeTeaserCategories();

  return (
    <section
      aria-labelledby="things-to-do-home-heading"
      className="bg-canvas-white py-stack-lg"
    >
      <div className="mx-auto max-w-site px-grid-margin">
        <div className="mb-stack-md flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2
              id="things-to-do-home-heading"
              className="font-display text-3xl font-bold tracking-tight text-industrial-black sm:text-headline-lg"
            >
              THINGS TO DO IN MANCHESTER
            </h2>
            <p className="mt-3 text-base text-secondary">
              Discover experiences beyond gigs and nightlife.
            </p>
          </div>
          <Link
            href={THINGS_TO_DO_PATH}
            className="font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4 transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bee-yellow"
          >
            View all experiences
          </Link>
        </div>
        <ExperienceCategoryGrid
          categories={categories}
          titleAs="h3"
          columns="home"
        />
      </div>
    </section>
  );
}
