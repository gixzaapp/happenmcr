import Script from "next/script";

/** Public GTM container id, e.g. GTM-XXXXXXX. Empty = analytics off. */
export function getGtmId(): string | null {
  const raw = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!raw) return null;
  if (!/^GTM-[A-Z0-9]+$/i.test(raw)) {
    console.warn(
      `[analytics] NEXT_PUBLIC_GTM_ID looks invalid (“${raw}”). Expected GTM-XXXXXXX.`,
    );
    return null;
  }
  return raw.toUpperCase();
}

/** Google Tag Manager — only renders when NEXT_PUBLIC_GTM_ID is set. */
export function GoogleTagManager() {
  const gtmId = getGtmId();
  if (!gtmId) return null;

  return (
    <Script
      id="gtm"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
      }}
    />
  );
}

/** GTM noscript fallback — place immediately after opening <body>. */
export function GoogleTagManagerNoscript() {
  const gtmId = getGtmId();
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
