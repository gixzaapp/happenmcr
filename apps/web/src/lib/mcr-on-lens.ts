export type LensPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  description: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  uploader_name: string | null;
  uploader_image: string | null;
  like_count: number;
  liked: boolean;
  created_at: string;
};

export type LensMapPin = {
  id: string;
  lat: number;
  lng: number;
  imageUrl: string;
  title: string;
  location: string | null;
};

/** Display model for a feed card (real upload or design mock). */
export type LensFeedCard = {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  location: string;
  lat: number | null;
  lng: number | null;
  handle: string;
  avatarUrl: string;
  avatarInitial: string;
  tags: string[];
  likes: number;
  liked: boolean;
  comments: number;
};

export const LENS_REPORT_CATEGORIES = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright / not their photo" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "spam", label: "Spam or misleading" },
  { value: "other", label: "Other" },
] as const;

export type LensReportCategory = (typeof LENS_REPORT_CATEGORIES)[number]["value"];

export const MCR_ON_LENS_PATH = "/mcr-buzz/mcr-on-lens";
export const MCR_ON_LENS_UPLOAD_PATH = `${MCR_ON_LENS_PATH}/upload`;
export const MCR_ON_LENS_MAP_PATH = `${MCR_ON_LENS_PATH}/map`;
export const MCR_ON_LENS_LABEL = "MCR on Lens";

export const MCR_ON_LENS_HEADLINE = "MCR on Lens";

export const MCR_ON_LENS_TAGLINE =
  "See Manchester through the eyes of the community.";

export const MCR_ON_LENS_DESCRIPTION =
  "See Manchester through the eyes of the community — browse local photos, explore places on the map, and share your own view on HappenMCR.";

export const MCR_ON_LENS_KEYWORDS = [
  "MCR on Lens",
  "Manchester photos",
  "Manchester photography",
  "community photography Manchester",
  "Manchester photo map",
  "Northern Quarter photos",
  "Manchester community",
  "MCR Buzz",
  "HappenMCR",
] as const;

export const MCR_ON_LENS_MAP_DESCRIPTION =
  "Explore community photos pinned across Manchester on the MCR on Lens map — neighbourhoods, landmarks, and everyday city life.";

export const MCR_ON_LENS_MAP_KEYWORDS = [
  "MCR on Lens map",
  "Manchester photo map",
  "Manchester map photos",
  "Mapbox Manchester",
  "Greater Manchester photography",
  "MCR Buzz",
  "HappenMCR",
] as const;

export const MCR_ON_LENS_UPLOAD_DESCRIPTION =
  "Upload a photo and share Manchester through your lens — add a caption, location, and hashtags on HappenMCR.";

export const MCR_ON_LENS_UPLOAD_KEYWORDS = [
  "upload photo Manchester",
  "MCR on Lens upload",
  "share Manchester photo",
  "Manchester photography",
  "HappenMCR",
] as const;

/** Fallback share image when the feed has no uploads yet. */
export const MCR_ON_LENS_OG_IMAGE = "/images/hero-manchester.webp";

/** Latest upload timestamp — useful for sitemap lastmod. */
export function latestLensPhotoDate(photos: LensPhoto[]): Date | null {
  let latest = 0;
  for (const photo of photos) {
    const ms = new Date(photo.created_at).getTime();
    if (Number.isFinite(ms) && ms > latest) latest = ms;
  }
  return latest > 0 ? new Date(latest) : null;
}

/** Map page URL that focuses a photo pin (when coords exist). */
export function lensMapFocusUrl(
  card: Pick<LensFeedCard, "id" | "lat" | "lng">,
): string | null {
  if (
    card.lat == null ||
    card.lng == null ||
    !Number.isFinite(card.lat) ||
    !Number.isFinite(card.lng)
  ) {
    return null;
  }
  const params = new URLSearchParams({
    photo: card.id,
    lat: String(card.lat),
    lng: String(card.lng),
  });
  return `${MCR_ON_LENS_MAP_PATH}?${params.toString()}`;
}

const LENS_HASHTAG_RE = /#[a-zA-Z0-9_]+/g;

/** Split inline #tags from caption/description for badge row (mock card layout). */
export function parseLensHashtags(text: string): {
  description: string;
  tags: string[];
} {
  const tags = [
    ...new Set(
      (text.match(LENS_HASHTAG_RE) ?? []).map((tag) => tag.toLowerCase()),
    ),
  ];
  const description = text
    .replace(LENS_HASHTAG_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { description, tags };
}

export function lensPhotoToFeedCard(photo: LensPhoto): LensFeedCard {
  const caption = photo.caption?.trim() || "Manchester through the lens";
  const title =
    caption.length > 48 ? `${caption.slice(0, 45).trimEnd()}…` : caption;
  const rawDescription =
    photo.description?.trim() ||
    photo.caption?.trim() ||
    "Shared by the HappenMCR community.";
  const { description, tags } = parseLensHashtags(rawDescription);
  const uploaderName = photo.uploader_name?.trim() || "HappenMCR";
  const uploaderInitial = uploaderName.charAt(0).toUpperCase();

  return {
    id: photo.id,
    imageUrl: photo.image_url,
    title,
    description:
      description || "Shared by the HappenMCR community.",
    location: photo.location?.trim() || "Manchester",
    lat: photo.lat,
    lng: photo.lng,
    handle: uploaderName,
    avatarUrl: photo.uploader_image?.trim() || "",
    avatarInitial: uploaderInitial,
    tags,
    likes: photo.like_count ?? 0,
    liked: photo.liked ?? false,
    comments: 0,
  };
}

export function toLensMapPins(photos: LensPhoto[]): LensMapPin[] {
  return photos
    .filter(
      (photo): photo is LensPhoto & { lat: number; lng: number } =>
        typeof photo.lat === "number" &&
        typeof photo.lng === "number" &&
        Number.isFinite(photo.lat) &&
        Number.isFinite(photo.lng),
    )
    .map((photo) => ({
      id: photo.id,
      lat: photo.lat,
      lng: photo.lng,
      imageUrl: photo.image_url,
      title: photo.caption?.trim() || "Manchester photo",
      location: photo.location,
    }));
}
