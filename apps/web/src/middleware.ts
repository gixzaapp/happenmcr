import { NextResponse, type NextRequest } from "next/server";

/** Apex host — www and http are 308'd here in production. */
const CANONICAL_HOST = "happenmcr.com";

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
 * One hop to https://happenmcr.com{path}{search} — never keep www, never keep http.
 * Build Location from Host / X-Forwarded-* — never from nextUrl's
 * internal upstream host (often `localhost:3000` behind nginx).
 */
function seoRedirect(request: NextRequest): NextResponse | null {
  const host = hostnameOf(request);
  const isCanonicalFamily =
    host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`;

  if (!isCanonicalFamily) return null;

  let pathname = request.nextUrl.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.replace(/\/+$/, "") || "/";
  }

  const incomingProto = requestProto(request);
  const needsRedirect =
    host !== CANONICAL_HOST ||
    incomingProto !== "https" ||
    pathname !== request.nextUrl.pathname;

  if (!needsRedirect) return null;

  const destination = `https://${CANONICAL_HOST}${pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(destination, 308);
}

export function middleware(request: NextRequest) {
  const redirected = seoRedirect(request);
  if (redirected) return redirected;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|ads\\.txt|robots\\.txt|sitemap\\.xml).*)",
  ],
};
