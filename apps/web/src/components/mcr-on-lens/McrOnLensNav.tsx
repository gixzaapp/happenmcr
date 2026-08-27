"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MCR_ON_LENS_MAP_PATH,
  MCR_ON_LENS_PATH,
  MCR_ON_LENS_UPLOAD_PATH,
} from "@/lib/mcr-on-lens";

const items = [
  { href: MCR_ON_LENS_PATH, label: "Home", icon: "home", match: "home" },
  {
    href: MCR_ON_LENS_UPLOAD_PATH,
    label: "Upload",
    icon: "upload",
    match: "upload",
  },
  {
    href: MCR_ON_LENS_MAP_PATH,
    label: "Map",
    icon: "map",
    match: "map",
  },
] as const;

function activeMatch(pathname: string): "home" | "upload" | "map" {
  if (pathname.startsWith(MCR_ON_LENS_UPLOAD_PATH)) return "upload";
  if (pathname.startsWith(MCR_ON_LENS_MAP_PATH)) return "map";
  return "home";
}

export function McrOnLensSidebar() {
  const pathname = usePathname();
  const active = activeMatch(pathname);

  return (
    <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 flex-col border-r border-secondary/20 bg-canvas-white p-4 lg:flex">
      <div className="mb-8 p-2">
        <p className="font-display text-lg font-bold text-industrial-black">
          MCR on Lens
        </p>
        <p className="mt-1 text-label-md text-secondary">Manchester Unified</p>
      </div>

      <nav aria-label="MCR on Lens sections" className="space-y-1">
        {items.map((item) => {
          const isActive = item.match === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg p-3 text-label-md transition duration-150 ${
                isActive
                  ? "bg-bee-yellow font-bold text-industrial-black"
                  : "text-secondary hover:translate-x-1 hover:bg-surface-container-low"
              }`}
              aria-current={isActive ? "page" : undefined}
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

export function McrOnLensMobileNav() {
  const pathname = usePathname();
  const active = activeMatch(pathname);

  return (
    <nav
      aria-label="MCR on Lens sections"
      className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:hidden"
    >
      {items.map((item) => {
        const isActive = item.match === active;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              isActive
                ? "border-industrial-black bg-bee-yellow text-industrial-black"
                : "border-industrial-black/10 bg-surface-container-low text-industrial-black"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
