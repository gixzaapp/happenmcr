"use client";

import { HeaderAuth } from "@/components/auth/HeaderAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useNavSearchQuery } from "@/components/search/useNavSearchQuery";
import { mcrBuzzNav, primaryNav } from "@/lib/nav";
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

function McrBuzzDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1 font-display text-lg font-semibold transition duration-200 ${
          open
            ? "text-industrial-black"
            : "text-secondary hover:text-industrial-black"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {mcrBuzzNav.label}
        <span
          className={`material-symbols-outlined text-base transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={mcrBuzzNav.label}
        className={`absolute left-0 top-full z-50 mt-2 min-w-[12rem] origin-top rounded-lg border border-industrial-black/10 bg-canvas-white py-2 shadow-lg transition ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {mcrBuzzNav.children.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            role="menuitem"
            className="block px-4 py-2.5 font-display text-base font-semibold text-secondary transition hover:bg-surface-container-low hover:text-industrial-black"
            onClick={() => setOpen(false)}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
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
                key={`${item.href}-${item.label}`}
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
          <McrBuzzDropdown />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Suspense fallback={<div className="hidden h-10 w-48 lg:block" />}>
            <HeaderSearchField />
          </Suspense>

          <HeaderAuth />

          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
