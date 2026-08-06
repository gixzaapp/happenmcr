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

function hostnameOf(request: NextRequest): string {
  const raw = request.headers.get("host") ?? request.nextUrl.host;
  return raw.split(":")[0]?.toLowerCase() ?? "";
}

function requestProto(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim().toLowerCase() ?? "https";
  return request.nextUrl.protocol.replace(":", "").toLowerCase();
}

/** 308 URL hygiene: https, apex host, no trailing slash. */
function seoRedirect(request: NextRequest): NextResponse | null {
  const host = hostnameOf(request);
  const isCanonicalFamily =
    host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`;

  const url = request.nextUrl.clone();
  let changed = false;

  if (isCanonicalFamily) {
    if (host === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      changed = true;
    }

    if (requestProto(request) === "http") {
      url.protocol = "https:";
      changed = true;
    }
  }

  // Strip trailing slash for all hosts (matches next.config trailingSlash: false).
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    changed = true;
  }

  if (!changed) return null;
  return NextResponse.redirect(url, 308);
}

export function middleware(request: NextRequest) {
  const redirected = seoRedirect(request);
  if (redirected) return redirected;

  if (request.method === "GET" && shouldTrack(request.nextUrl.pathname)) {
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
