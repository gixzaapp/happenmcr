"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Must NOT reuse old middleware cookie `hmcr_uv` — that one is httpOnly and JS can't read it. */
const COOKIE_UV_DAY = "hmcr_uv_js";
const STORAGE_UV_DAY = "happenmcr_uv_day";
const STORAGE_LOCK = "happenmcr_uv_lock";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SKIP_PREFIXES = [
  "/getmethevisitorcount",
  "/auth",
  "/robots.txt",
  "/sitemap",
];

function londonYmd(reference = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function alreadyCountedToday(today: string): boolean {
  try {
    if (window.localStorage.getItem(STORAGE_UV_DAY) === today) return true;
  } catch {
    // private mode
  }
  return readCookie(COOKIE_UV_DAY) === today;
}

function markCountedToday(today: string): void {
  try {
    window.localStorage.setItem(STORAGE_UV_DAY, today);
  } catch {
    // ignore
  }
  writeCookie(COOKIE_UV_DAY, today);
}

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com/api"
  );
}

function shouldTrackPath(pathname: string): boolean {
  return !SKIP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Count a unique visitor only when real browser JS runs.
 * Once per London calendar day — localStorage + JS-readable cookie
 * (never the old httpOnly `hmcr_uv`, which JS cannot see).
 */
export function UniqueVisitBeacon() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!shouldTrackPath(pathname)) return;
    if (typeof window === "undefined") return;

    const today = londonYmd();
    if (alreadyCountedToday(today)) return;

    try {
      if (sessionStorage.getItem(STORAGE_LOCK) === today) return;
      sessionStorage.setItem(STORAGE_LOCK, today);
    } catch {
      // ignore
    }

    void (async () => {
      try {
        // Re-check after await scheduling (React Strict Mode / fast remount).
        if (alreadyCountedToday(today)) return;

        const res = await fetch(`${apiBase()}/stats/unique-visit`, {
          method: "POST",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          credentials: "omit",
        });
        if (!res.ok) {
          try {
            sessionStorage.removeItem(STORAGE_LOCK);
          } catch {
            // ignore
          }
          return;
        }
        markCountedToday(today);
      } catch {
        try {
          sessionStorage.removeItem(STORAGE_LOCK);
        } catch {
          // ignore
        }
      }
    })();
  }, [pathname]);

  return null;
}
