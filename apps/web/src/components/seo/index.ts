/**
 * SEO helpers for HappenMCR (App Router).
 * Use `buildPageMetadata` from page `metadata` / `generateMetadata`.
 */
export {
  buildPageMetadata,
  canonicalUrlForPath,
  truncateSeoText,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE_PATH,
  HOME_TITLE,
  SITE_NAME,
  type PageSeoOptions,
} from "@/lib/seo";
export { JsonLd } from "./JsonLd";
export { ExploreMoreLinks, type ExploreMoreLink } from "./ExploreMoreLinks";
export {
  categoryExploreLinks,
  categoryLinksFromEvents,
  eventExploreLinks,
  venueExploreLinks,
  venueLinksFromEvents,
} from "./internalLinks";
export {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEventItemListJsonLd,
  buildEventJsonLd,
  buildLensPhotoItemListJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  homeBreadcrumb,
  type ArticleJsonLdOptions,
  type BreadcrumbItem,
  type CollectionPageJsonLdOptions,
  type LensPhotoJsonLdItem,
} from "@/lib/jsonld";
