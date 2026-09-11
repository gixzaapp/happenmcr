"use client";

import { useEffect } from "react";
import {
  hasFiredScroll50ThisSession,
  markScroll50Fired,
  trackEvent,
} from "./track";

/**
 * Fires `scroll_50_percent` once per browser session when the page
 * is scrolled past ~50% of document height.
 */
export function ScrollDepthTracker() {
  useEffect(() => {
    if (hasFiredScroll50ThisSession()) return;

    function onScroll() {
      if (hasFiredScroll50ThisSession()) return;

      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = window.scrollY / scrollable;
      if (progress < 0.5) return;

      markScroll50Fired();
      trackEvent("scroll_50_percent");
      window.removeEventListener("scroll", onScroll);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
