import Link from "next/link";
import {
  THINGS_TO_DO_PATH,
  type ExperienceCategory,
  type ExperienceCategoryId,
} from "@/lib/things-to-do";

type ExperienceCategoryFilterProps = {
  categories: ExperienceCategory[];
  activeId?: ExperienceCategoryId | null;
};

/**
 * Compact category filter for the Things to Do landing page.
 * Keeps results above the fold — not a full-viewport image grid.
 */
export function ExperienceCategoryFilter({
  categories,
  activeId = null,
}: ExperienceCategoryFilterProps) {
  return (
    <nav aria-label="Experience categories" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={`${THINGS_TO_DO_PATH}#experiences`}
            className={`inline-flex items-center rounded-lg border px-3 py-2 font-display text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bee-yellow ${
              !activeId
                ? "border-industrial-black bg-industrial-black text-canvas-white"
                : "border-industrial-black/15 text-secondary hover:border-industrial-black/40 hover:text-industrial-black"
            }`}
            aria-current={!activeId ? "page" : undefined}
          >
            All
          </Link>
        </li>
        {categories.map((category) => {
          const active = activeId === category.id;
          return (
            <li key={category.id}>
              <Link
                href={`${THINGS_TO_DO_PATH}?category=${category.id}#experiences`}
                className={`inline-flex items-center rounded-lg border px-3 py-2 font-display text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bee-yellow ${
                  active
                    ? "border-bee-yellow bg-bee-yellow text-industrial-black"
                    : "border-industrial-black/15 text-secondary hover:border-industrial-black/40 hover:text-industrial-black"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {category.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
