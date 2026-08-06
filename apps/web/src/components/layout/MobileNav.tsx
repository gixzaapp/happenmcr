"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Suspense,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { useNavSearchQuery } from "@/components/search/useNavSearchQuery";
import { primaryNav } from "@/lib/nav";

function MobileSearchField({ onSubmitted }: { onSubmitted: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useNavSearchQuery();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    onSubmitted();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={onSearch} className="mt-6" role="search">
      <label className="sr-only" htmlFor="mobile-search-q">
        Search events
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
          search
        </span>
        <input
          id="mobile-search-q"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events..."
          autoComplete="off"
          className="w-full rounded-lg border border-industrial-black/10 bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-bee-yellow"
        />
      </div>
    </form>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-industrial-black/10 text-industrial-black"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="material-symbols-outlined">
          {open ? "close" : "menu"}
        </span>
      </button>

      <div
        className={`fixed inset-0 z-40 bg-industrial-black/50 transition ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <nav
        id={panelId}
        aria-label="Mobile"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-canvas-white p-6 shadow-xl transition duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
          Menu
        </p>
        <ul className="mt-6 flex flex-col gap-1">
          {primaryNav.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-3 font-display text-lg font-semibold transition ${
                    active
                      ? "bg-bee-yellow text-industrial-black"
                      : "text-industrial-black hover:bg-surface-container-low"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Suspense fallback={null}>
          <MobileSearchField onSubmitted={() => setOpen(false)} />
        </Suspense>
      </nav>
    </div>
  );
}
