import Link from "next/link";

const items = [
  { href: "/community", label: "Home", icon: "home", exact: true },
  { href: "/community#volunteering", label: "Volunteering", icon: "groups" },
  { href: "/community#workshops", label: "Workshops", icon: "build" },
  { href: "/community#talks", label: "Talks", icon: "forum" },
  { href: "/community#charities", label: "Local Charities", icon: "volunteer_activism" },
] as const;

type CommunitySidebarProps = {
  active?: "home" | "volunteering" | "workshops" | "talks" | "charities";
};

export function CommunitySidebar({ active = "home" }: CommunitySidebarProps) {
  return (
    <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 flex-col border-r border-secondary/20 bg-canvas-white p-4 lg:flex">
      <div className="mb-8 p-2">
        <p className="font-display text-lg font-bold text-industrial-black">
          Community
        </p>
        <p className="mt-1 text-label-md text-secondary">Manchester Unified</p>
      </div>

      <nav aria-label="Community sections" className="space-y-1">
        {items.map((item) => {
          const isActive =
            ("exact" in item && item.exact && active === "home") ||
            item.href.endsWith(`#${active}`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg p-3 text-label-md transition duration-150 ${
                isActive
                  ? "bg-bee-yellow font-bold text-industrial-black"
                  : "text-secondary hover:translate-x-1 hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function CommunityMobileNav() {
  return (
    <nav
      aria-label="Community sections"
      className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="shrink-0 rounded-full border border-industrial-black/10 bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-industrial-black"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
