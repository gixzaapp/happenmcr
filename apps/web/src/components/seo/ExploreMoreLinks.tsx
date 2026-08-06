import Link from "next/link";

export type ExploreMoreLink = {
  href: string;
  label: string;
};

type ExploreMoreLinksProps = {
  title?: string;
  links: ExploreMoreLink[];
  className?: string;
};

/** Crawl-friendly internal linking block for event / venue / category pages. */
export function ExploreMoreLinks({
  title = "Explore more",
  links,
  className = "",
}: ExploreMoreLinksProps) {
  const unique = new Map<string, ExploreMoreLink>();
  for (const link of links) {
    if (!link.href || !link.label.trim()) continue;
    if (!unique.has(link.href)) unique.set(link.href, link);
  }

  const items = [...unique.values()];
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={title}
      className={`mt-12 border-t border-industrial-black/10 pt-8 ${className}`}
    >
      <h2 className="font-display text-lg font-bold text-industrial-black">
        {title}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center rounded-md border border-industrial-black/10 bg-surface-container-low px-3 py-2 text-sm font-semibold text-industrial-black transition hover:border-bee-yellow hover:bg-bee-yellow"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
