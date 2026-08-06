import { NextResponse, type NextRequest } from "next/server";

/** Apex host — www and http are 308'd here in production. */
const CANONICAL_HOST = "happenmcr.com";

const COOKIE_VID = "hmcr_vid";
const COOKIE_UV_DAY = "hmcr_uv";
const VID_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

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

/** Next.js <Link prefetch> and browser prefetch — must not count as visits. */
function isPrefetch(request: NextRequest): boolean {
  if (request.headers.get("next-router-prefetch") === "1") return true;
  if (request.headers.get("x-middleware-prefetch") === "1") return true;
  const purpose = request.headers.get("purpose")?.toLowerCase();
  if (purpose === "prefetch") return true;
  const secPurpose = request.headers.get("sec-purpose")?.toLowerCase();
  if (secPurpose === "prefetch") return true;
  return false;
}

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|wget|curl|python-requests|httpclient|headless|phantom|selenium|lighthouse|gtmetrix|pingdom|uptime|monitor|scanner|bytespider|petalbot|semrush|ahrefs|dotbot|gptbot|claudebot|anthropic|chatgpt|openai|perplexity|applebot|bingpreview|duckduckbot|yandex|baidu/i;

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua.trim()) return true;
  return BOT_UA.test(ua);
}

/**
 * Real user navigations: full document loads OR App Router client transitions.
 * Prefetches and non-navigation fetches are excluded elsewhere.
 */
function isUserNavigation(request: NextRequest): boolean {
  if (request.headers.has("next-router-prefetch")) return false;

  const dest = request.headers.get("sec-fetch-dest");
  // Ignore subresource loads when the browser labels them.
  if (
    dest &&
    dest !== "document" &&
    dest !== "empty" // App Router client navigations often use "empty"
  ) {
    return false;
  }

  const mode = request.headers.get("sec-fetch-mode");
  if (mode && mode !== "navigate" && mode !== "cors" && mode !== "same-origin") {
    return false;
  }

  // Full page load
  if (dest === "document") return true;

  // Client-side route change (RSC)
  if (request.headers.get("rsc") === "1") return true;
  if (request.headers.has("next-router-state-tree")) return true;

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) return true;

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

function londonYmd(reference = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
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

function cookieSecure(request: NextRequest): boolean {
  return requestProto(request) === "https" || hostnameOf(request) === CANONICAL_HOST;
}

/** Count at most one unique visitor per anonymous cookie per London calendar day. */
function trackUniqueVisit(request: NextRequest, response: NextResponse): void {
  if (
    request.method !== "GET" ||
    isPrefetch(request) ||
    isBot(request) ||
    !isUserNavigation(request) ||
    !shouldTrack(request.nextUrl.pathname)
  ) {
    return;
  }

  const today = londonYmd();
  const secure = cookieSecure(request);
  const cookieBase = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };

  let vid = request.cookies.get(COOKIE_VID)?.value;
  if (!vid) {
    vid = crypto.randomUUID();
    response.cookies.set(COOKIE_VID, vid, {
      ...cookieBase,
      maxAge: VID_MAX_AGE,
    });
  }

  const lastDay = request.cookies.get(COOKIE_UV_DAY)?.value;
  if (lastDay === today) return;

  response.cookies.set(COOKIE_UV_DAY, today, {
    ...cookieBase,
    maxAge: VID_MAX_AGE,
  });

  // Prefer public API URL — Edge middleware often cannot reach 127.0.0.1.
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    process.env.API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:4000";

  void fetch(`${apiBase}/stats/unique-visit`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
  }).catch(() => {
    // Ignore analytics failures
  });
}

export function middleware(request: NextRequest) {
  const redirected = seoRedirect(request);
  if (redirected) return redirected;

  const response = NextResponse.next();
  trackUniqueVisit(request, response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
