"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, type FormEvent } from "react";
import { useNavSearchQuery } from "@/components/search/useNavSearchQuery";
import { primaryNav } from "@/lib/nav";
import { MobileNav } from "./MobileNav";

function HeaderSearchField() {
  const router = useRouter();
  const [query, setQuery] = useNavSearchQuery();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={onSearch} role="search" className="relative hidden lg:block">
      <label className="sr-only" htmlFor="header-search-q">
        Search events
      </label>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
        search
      </span>
      <input
        id="header-search-q"
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search events..."
        autoComplete="off"
        className="rounded-lg border border-industrial-black/10 bg-surface-container-low py-2 pl-10 pr-4 font-sans text-sm font-semibold outline-none focus:ring-1 focus:ring-bee-yellow"
      />
    </form>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary/20 bg-canvas-white">
      <nav className="mx-auto flex max-w-site items-center justify-between px-grid-margin py-4">
        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tighter text-industrial-black sm:text-[32px] sm:leading-none"
        >
          Happen<span className="text-bee-yellow">MCR</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {primaryNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-display text-lg font-semibold transition duration-200 ${
                  active ||
                  (item.href === "/community" && pathname.startsWith("/community"))
                    ? "text-industrial-black"
                    : "text-secondary hover:text-industrial-black"
                }`}
                aria-current={
                  active ||
                  (item.href === "/community" && pathname.startsWith("/community"))
                    ? "page"
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Suspense fallback={<div className="hidden h-10 w-48 lg:block" />}>
            <HeaderSearchField />
          </Suspense>

          <button
            type="button"
            className="hard-shadow hidden rounded-lg bg-bee-yellow px-6 py-2 text-sm font-semibold tracking-wide text-industrial-black transition-all sm:inline-flex"
          >
            Sign In
          </button>

          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
