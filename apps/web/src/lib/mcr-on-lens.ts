export type LensPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  description: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
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
  tags: string[];
  likes: number;
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

export function lensPhotoToFeedCard(photo: LensPhoto): LensFeedCard {
  const caption = photo.caption?.trim() || "Manchester through the lens";
  const title =
    caption.length > 48 ? `${caption.slice(0, 45).trimEnd()}…` : caption;
  const description =
    photo.description?.trim() ||
    photo.caption?.trim() ||
    "Shared by the HappenMCR community.";

  return {
    id: photo.id,
    imageUrl: photo.image_url,
    title,
    description,
    location: photo.location?.trim() || "Manchester",
    lat: photo.lat,
    lng: photo.lng,
    handle: "@happenmcr",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&q=80",
    tags: [],
    likes: 0,
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
