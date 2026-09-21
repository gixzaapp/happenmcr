"use client";

import { useEffect, useRef } from "react";

const ADSTERRA_SCRIPT_SRC =
  "https://pl31437125.profitableratecpmnetwork.com/e9720fe49c13eef975e9aef604085079/invoke.js";
const ADSTERRA_SCRIPT_ID = "adsterra-invoke-e9720fe49c13";
export const ADSTERRA_CONTAINER_ID =
  "container-e9720fe49c13eef975e9aef604085079";

type AdsterraInFeedProps = {
  className?: string;
};

/**
 * Adsterra native/in-feed unit (Plan B while AdSense is pending).
 * One container id per page — mount only once.
 */
export function AdsterraInFeed({ className = "" }: AdsterraInFeedProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (document.getElementById(ADSTERRA_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = ADSTERRA_SCRIPT_ID;
    script.async = true;
    script.dataset.cfasync = "false";
    script.src = ADSTERRA_SCRIPT_SRC;
    document.body.appendChild(script);
  }, []);

  return (
    <aside
      className={`min-w-0 overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <div id={ADSTERRA_CONTAINER_ID} />
    </aside>
  );
}
