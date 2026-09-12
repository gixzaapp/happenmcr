"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const COOKIE_UV_DAY = "hmcr_uv";
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
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
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

let inFlight = false;

/**
 * Count a unique visitor only when real browser JS runs (same bar as GA).
 * Once per London calendar day per browser cookie.
 */
export function UniqueVisitBeacon() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!shouldTrackPath(pathname)) return;
    if (typeof window === "undefined") return;
    if (inFlight) return;

    const today = londonYmd();
    if (readCookie(COOKIE_UV_DAY) === today) return;

    inFlight = true;
    void (async () => {
      try {
        const res = await fetch(`${apiBase()}/stats/unique-visit`, {
          method: "POST",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          credentials: "omit",
        });
        if (!res.ok) return;
        writeCookie(COOKIE_UV_DAY, today);
      } catch {
        // Ignore analytics failures.
      } finally {
        inFlight = false;
      }
    })();
  }, [pathname]);

  return null;
}
