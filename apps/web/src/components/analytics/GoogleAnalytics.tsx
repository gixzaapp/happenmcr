import { Suspense } from "react";
import Script from "next/script";
import { GoogleAnalyticsRouteListener } from "./GoogleAnalyticsRouteListener";

/**
 * HappenMCR GA4 Measurement ID — matches the Google Analytics dashboard snippet.
 * Optional override: NEXT_PUBLIC_GA_MEASUREMENT_ID
 */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-ST4TDRNEKL";

export function getGaMeasurementId(): string | null {
  if (!/^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)) {
    console.warn(
      `[analytics] Invalid GA4 id (“${GA_MEASUREMENT_ID}”). Expected G-XXXXXXXX.`,
    );
    return null;
  }
  return GA_MEASUREMENT_ID.toUpperCase();
}

/** Google Analytics 4 (gtag.js) — sitewide Google tag. */
export function GoogleAnalytics() {
  const measurementId = getGaMeasurementId();
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: false });`,
        }}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsRouteListener measurementId={measurementId} />
      </Suspense>
    </>
  );
}
