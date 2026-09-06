"use client";

import { useEffect, useRef } from "react";
import { getAdSenseClient } from "./GoogleAdSense";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/** In-feed unit from AdSense dashboard (HappenMCR feed). */
export const ADSENSE_IN_FEED_SLOT = "4623759330";
export const ADSENSE_IN_FEED_LAYOUT_KEY = "-6t+ed+2i-1n-4w";

type AdSenseInFeedProps = {
  className?: string;
};

/**
 * Fluid in-feed ad — matches event card column width via CSS grid.
 * Loader script lives in root layout; this only mounts the unit + push().
 */
export function AdSenseInFeed({ className = "" }: AdSenseInFeedProps) {
  const insRef = useRef<HTMLModElement>(null);
  const client = getAdSenseClient();

  useEffect(() => {
    const node = insRef.current;
    if (!client || !node) return;
    if (node.getAttribute("data-adsbygoogle-status")) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn("[adsense] in-feed push failed", error);
    }
  }, [client]);

  if (!client) return null;

  return (
    <aside
      className={`min-w-0 overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={ADSENSE_IN_FEED_SLOT}
        data-ad-format="fluid"
        data-ad-layout-key={ADSENSE_IN_FEED_LAYOUT_KEY}
      />
    </aside>
  );
}
