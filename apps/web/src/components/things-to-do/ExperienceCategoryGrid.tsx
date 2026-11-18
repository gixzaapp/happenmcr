import Image from "next/image";
import Link from "next/link";
import type { ExperienceCategory } from "@/lib/things-to-do";

type ExperienceCategoryGridProps = {
  categories: ExperienceCategory[];
  titleAs?: "h2" | "h3";
  columns?: "home" | "page";
};

export function ExperienceCategoryGrid({
  categories,
  titleAs = "h3",
  columns = "page",
}: ExperienceCategoryGridProps) {
  const TitleTag = titleAs;
  const gridClass =
    columns === "home"
      ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
      : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul className={gridClass}>
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={category.href}
            aria-label={`${category.label}: ${category.description}`}
            className="group relative flex h-64 items-end overflow-hidden rounded-xl border-2 border-transparent bg-industrial-black p-6 transition-all hover:border-bee-yellow focus-visible:border-bee-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bee-yellow"
          >
            <Image
              src={category.image}
              alt=""
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover brightness-50 transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-industrial-black/80 via-industrial-black/20 to-transparent"
              aria-hidden
            />
            <div className="relative z-10 w-full">
              <TitleTag className="mb-2 font-display text-xl font-bold text-canvas-white drop-shadow sm:text-2xl">
                {columns === "home" ? category.shortLabel : category.label}
              </TitleTag>
              <div className="flex items-center justify-between gap-3 text-bee-yellow">
                <span className="line-clamp-2 text-sm font-semibold">
                  {columns === "home" ? "Explore" : "Browse experiences"}
                </span>
                <span
                  className="material-symbols-outlined shrink-0 transition-transform group-hover:translate-x-2"
                  aria-hidden
                >
                  arrow_forward
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
