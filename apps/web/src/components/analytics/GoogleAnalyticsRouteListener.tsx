"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Sends GA4 page_view on App Router navigations (initial + client transitions).
 * Base gtag config uses send_page_view: false to avoid double-counting.
 */
export function GoogleAnalyticsRouteListener({
  measurementId,
}: {
  measurementId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || typeof window === "undefined") return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    const send = (): boolean => {
      if (typeof window.gtag !== "function") return false;
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
        send_to: measurementId,
      });
      return true;
    };

    if (send()) return;

    const interval = window.setInterval(() => {
      if (send()) window.clearInterval(interval);
    }, 100);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 8_000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [measurementId, pathname, searchParams]);

  return null;
}
