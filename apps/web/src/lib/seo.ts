import type { Metadata } from "next";
import { getSiteUrl } from "./config";

export const SITE_NAME = "HappenMCR";

export const DEFAULT_DESCRIPTION =
  "Discover what's on in Manchester: live music, nightlife, free events, community, and more — updated daily on HappenMCR.";

export const DEFAULT_KEYWORDS = [
  "Manchester events",
  "what's on Manchester",
  "Manchester gigs",
  "Manchester nightlife",
  "Manchester free events",
  "HappenMCR",
] as const;

/** Default share image (App Router `opengraph-image`). */
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export type PageSeoOptions = {
  title: string;
  description: string;
  /**
   * Pathname used for canonical + og:url, e.g. `/events/today`.
   * Query strings are stripped from the canonical (use `index: false` for
   * parameterised URLs like search results).
   */
  path: string;
  keywords?: string | string[] | null;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  /** Defaults to true (index, follow). */
  index?: boolean;
  follow?: boolean;
  /**
   * When true, use `title` as-is (no `%s | HappenMCR` template).
   * Use for the homepage brand title.
   */
  absoluteTitle?: boolean;
};

function normalizeKeywords(
  keywords?: string | string[] | null,
): string[] | undefined {
  if (!keywords) return undefined;
  const list = (Array.isArray(keywords) ? keywords : keywords.split(","))
    .map((part) => part.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

/** Truncate copy for meta description / OG (default 160 chars). */
export function truncateSeoText(text: string, max = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

/** Absolute canonical URL — query/hash stripped to avoid duplicate signals. */
export function canonicalUrlForPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalized, getSiteUrl());
  url.search = "";
  url.hash = "";
  return url.toString();
}

/**
 * Build consistent Next.js Metadata for HappenMCR pages.
 * Sets title, description, keywords, canonical, robots, Open Graph, and Twitter.
 */
export function buildPageMetadata(options: PageSeoOptions): Metadata {
  const {
    title,
    description,
    path,
    image,
    imageAlt,
    type = "website",
    index = true,
    follow = true,
    absoluteTitle = false,
  } = options;

  const canonicalUrl = canonicalUrlForPath(path);
  const keywords =
    normalizeKeywords(options.keywords) ?? [...DEFAULT_KEYWORDS];
  const brandedTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const ogImage = image?.trim() || DEFAULT_OG_IMAGE_PATH;
  const ogImageAlt = imageAlt?.trim() || title;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
      },
    },
    openGraph: {
      title: brandedTitle,
      description,
      url: canonicalUrl,
      type,
      locale: "en_GB",
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          alt: ogImageAlt,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [ogImage],
    },
  };
}
