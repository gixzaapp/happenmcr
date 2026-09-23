"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  POETS_CORNER_PATH,
  POETS_CORNER_PROFILE_PATH,
  POETS_CORNER_WRITE_PATH,
} from "@/lib/poets-corner";

const items = [
  { href: POETS_CORNER_PROFILE_PATH, label: "Profile", match: "profile" as const },
  { href: POETS_CORNER_PATH, label: "Home", match: "home" as const },
  { href: POETS_CORNER_WRITE_PATH, label: "Write", match: "write" as const },
];

function activeMatch(pathname: string): "profile" | "home" | "write" {
  if (pathname.startsWith(POETS_CORNER_PROFILE_PATH)) return "profile";
  if (pathname.startsWith(POETS_CORNER_WRITE_PATH)) return "write";
  return "home";
}

export function PoetsCornerSidebar() {
  const pathname = usePathname();
  const active = activeMatch(pathname);

  return (
    <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 flex-col border-r border-[#2a2118]/10 bg-[#f7f1e8] p-4 lg:flex">
      <div className="mb-8 p-2">
        <p className="font-serif text-lg text-[#2a2118]" style={{ fontFamily: "var(--font-history-serif), Georgia, serif" }}>
          Poet&apos;s Corner
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8a5a42]">
          Manchester verse
        </p>
      </div>
      <nav aria-label="Poet's Corner sections" className="space-y-1">
        {items.map((item) => {
          const isActive = item.match === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block rounded-lg px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-[#2a2118] font-semibold text-[#f7f1e8]"
                  : "text-[#5c4a3a] hover:bg-[#efe6d8]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function PoetsCornerMobileNav() {
  const pathname = usePathname();
  const active = activeMatch(pathname);

  return (
    <nav
      aria-label="Poet's Corner sections"
      className="mb-8 flex gap-2 lg:hidden"
    >
      {items.map((item) => {
        const isActive = item.match === active;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              isActive
                ? "border-[#2a2118] bg-[#2a2118] text-[#f7f1e8]"
                : "border-[#2a2118]/15 bg-[#f7f1e8] text-[#2a2118]"
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
