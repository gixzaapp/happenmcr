type GtagParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a GA4 custom event when gtag is available. */
export function trackEvent(name: string, params?: GtagParams): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  const cleaned: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      cleaned[key] = value;
    }
  }

  window.gtag("event", name, cleaned);
}

const SCROLL_50_KEY = "happenmcr_ga_scroll_50";

export function hasFiredScroll50ThisSession(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(SCROLL_50_KEY) === "1";
  } catch {
    return false;
  }
}

export function markScroll50Fired(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_50_KEY, "1");
  } catch {
    // Ignore private-mode / blocked storage.
  }
}
