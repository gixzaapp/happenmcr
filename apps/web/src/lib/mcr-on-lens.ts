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
  handle: string;
  avatarUrl: string;
  tags: string[];
  likes: number;
  comments: number;
};

export const MCR_ON_LENS_PATH = "/mcr-buzz/mcr-on-lens";
export const MCR_ON_LENS_UPLOAD_PATH = `${MCR_ON_LENS_PATH}/upload`;
export const MCR_ON_LENS_MAP_PATH = `${MCR_ON_LENS_PATH}/map`;
export const MCR_ON_LENS_LABEL = "MCR on Lens";

/** Design-reference card so the feed layout is visible before real uploads. */
export const MOCK_LENS_FEED_CARD: LensFeedCard = {
  id: "mock-neon-nights-nq",
  imageUrl:
    "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?auto=format&fit=crop&w=1200&q=80",
  title: "Neon Nights in NQ",
  description:
    "Capturing the electric atmosphere as the street art comes alive under the city lights. The mix of old brick and new neon is unmatched.",
  location: "Northern Quarter, Manchester",
  handle: "@MCR_Explorer",
  avatarUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=96&q=80",
  tags: ["#MCRStreetArt", "#UrbanPulse"],
  likes: 248,
  comments: 42,
};

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
