import { NextResponse, type NextRequest } from "next/server";

/** Apex host — www and http are 308'd here in production. */
const CANONICAL_HOST = "happenmcr.com";

const SKIP_PREFIXES = [
  "/_next",
  "/favicon",
  "/getmethevisitorcount",
  "/robots.txt",
  "/sitemap",
];

function shouldTrack(pathname: string): boolean {
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }
  if (
    /\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|map|txt|xml|json)$/i.test(
      pathname,
    )
  ) {
    return false;
  }
  return true;
}

/** Next.js <Link prefetch> and browser prefetch — must not count as pageviews. */
function isPrefetch(request: NextRequest): boolean {
  if (request.headers.get("next-router-prefetch") === "1") return true;
  if (request.headers.get("x-middleware-prefetch") === "1") return true;
  const purpose = request.headers.get("purpose")?.toLowerCase();
  if (purpose === "prefetch") return true;
  const secPurpose = request.headers.get("sec-purpose")?.toLowerCase();
  if (secPurpose === "prefetch") return true;
  return false;
}

function hostnameOf(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const raw =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  return raw.split(":")[0]?.toLowerCase() ?? "";
}

function requestProto(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().toLowerCase() || "https";
  }
  return request.nextUrl.protocol.replace(":", "").toLowerCase();
}

/**
 * 308 URL hygiene for production hostnames.
 * Build the Location from Host / X-Forwarded-* — never from nextUrl's
 * internal upstream host (often `localhost:3000` behind nginx).
 */
function seoRedirect(request: NextRequest): NextResponse | null {
  const host = hostnameOf(request);
  const isCanonicalFamily =
    host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`;

  if (!isCanonicalFamily) return null;

  const targetHost = CANONICAL_HOST;
  const incomingProto = requestProto(request);
  const targetProto = incomingProto === "http" ? "https" : incomingProto;

  let pathname = request.nextUrl.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.replace(/\/+$/, "") || "/";
  }

  const needsRedirect =
    host !== targetHost ||
    incomingProto === "http" ||
    pathname !== request.nextUrl.pathname;

  if (!needsRedirect) return null;

  const destination = new URL(
    `${pathname}${request.nextUrl.search}`,
    `${targetProto}://${targetHost}`,
  );
  return NextResponse.redirect(destination, 308);
}

export function middleware(request: NextRequest) {
  const redirected = seoRedirect(request);
  if (redirected) return redirected;

  if (
    request.method === "GET" &&
    !isPrefetch(request) &&
    shouldTrack(request.nextUrl.pathname)
  ) {
    const apiBase =
      process.env.API_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "http://localhost:4000";

    void fetch(`${apiBase}/stats/pageview`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
    }).catch(() => {
      // Ignore analytics failures
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
