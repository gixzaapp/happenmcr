import type { Metadata } from "next";
import { McrOnLensFeed, McrOnLensHero } from "@/components/mcr-on-lens";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildLensPhotoItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { getLensPhotos } from "@/lib/lens-photos";
import {
  lensPhotoToFeedCard,
  MCR_ON_LENS_DESCRIPTION,
  MCR_ON_LENS_HEADLINE,
  MCR_ON_LENS_KEYWORDS,
  MCR_ON_LENS_LABEL,
  MCR_ON_LENS_MAP_PATH,
  MCR_ON_LENS_OG_IMAGE,
  MCR_ON_LENS_PATH,
  MCR_ON_LENS_UPLOAD_PATH,
} from "@/lib/mcr-on-lens";
import { MCR_HISTORY_LABEL, MCR_HISTORY_PATH } from "@/lib/mcr-history";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";

export const dynamic = "force-dynamic";

const lensDescription = truncateSeoText(MCR_ON_LENS_DESCRIPTION);

function lensPhotoJsonLdItems(photos: Awaited<ReturnType<typeof getLensPhotos>>) {
  return photos.map((photo) => {
    const card = lensPhotoToFeedCard(photo);
    return {
      id: photo.id,
      imageUrl: photo.image_url,
      name: card.title,
      description: card.description,
      location: photo.location,
      lat: photo.lat,
      lng: photo.lng,
    };
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const photos = await getLensPhotos();
  const ogImage = photos[0]?.image_url?.trim() || MCR_ON_LENS_OG_IMAGE;

  return buildPageMetadata({
    title: `${MCR_ON_LENS_HEADLINE} · MCR Buzz`,
    description: lensDescription,
    path: MCR_ON_LENS_PATH,
    keywords: [...MCR_ON_LENS_KEYWORDS],
    image: ogImage,
    imageAlt: "Community photo from Manchester on MCR on Lens",
    type: "website",
  });
}

export default async function McrOnLensHomePage() {
  const session = await auth();
  const photos = await getLensPhotos(session?.user?.id);
  const jsonLdPhotos = lensPhotoJsonLdItems(photos);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: MCR_ON_LENS_LABEL, path: MCR_ON_LENS_PATH },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: MCR_ON_LENS_HEADLINE,
          description: lensDescription,
          path: MCR_ON_LENS_PATH,
        })}
      />
      {jsonLdPhotos.length > 0 ? (
        <JsonLd
          data={buildLensPhotoItemListJsonLd(jsonLdPhotos, {
            name: `${MCR_ON_LENS_LABEL} photo feed`,
            path: MCR_ON_LENS_PATH,
            description: lensDescription,
          })}
        />
      ) : null}
      <McrOnLensHero />
      <McrOnLensFeed photos={photos} />
      <ExploreMoreLinks
        title="Explore more on HappenMCR"
        links={[
          { href: "/mcr-buzz", label: "MCR Buzz hub" },
          { href: MCR_HISTORY_PATH, label: MCR_HISTORY_LABEL },
          { href: MCR_ON_LENS_MAP_PATH, label: "MCR on Lens map" },
          { href: MCR_ON_LENS_UPLOAD_PATH, label: "Upload a photo" },
          { href: "/events/today", label: "Events in Manchester today" },
        ]}
      />
    </>
  );
}
