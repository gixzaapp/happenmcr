import { McrOnLensHero, McrOnLensMap } from "@/components/mcr-on-lens";
import { ExploreMoreLinks, JsonLd } from "@/components/seo";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildLensPhotoItemListJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { getLensPhotos, getMapboxToken } from "@/lib/lens-photos";
import {
  lensPhotoToFeedCard,
  MCR_ON_LENS_LABEL,
  MCR_ON_LENS_MAP_DESCRIPTION,
  MCR_ON_LENS_MAP_KEYWORDS,
  MCR_ON_LENS_MAP_PATH,
  MCR_ON_LENS_OG_IMAGE,
  MCR_ON_LENS_PATH,
  MCR_ON_LENS_UPLOAD_PATH,
  toLensMapPins,
} from "@/lib/mcr-on-lens";
import { MCR_HISTORY_LABEL, MCR_HISTORY_PATH } from "@/lib/mcr-history";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";

export const dynamic = "force-dynamic";

const mapDescription = truncateSeoText(MCR_ON_LENS_MAP_DESCRIPTION);

export const metadata = buildPageMetadata({
  title: `Map · ${MCR_ON_LENS_LABEL}`,
  description: mapDescription,
  path: MCR_ON_LENS_MAP_PATH,
  keywords: [...MCR_ON_LENS_MAP_KEYWORDS],
  image: MCR_ON_LENS_OG_IMAGE,
  imageAlt: "Manchester community photo map on MCR on Lens",
});

type McrOnLensMapPageProps = {
  searchParams: { photo?: string | string[]; lat?: string | string[]; lng?: string | string[] };
};

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function parseFocus(
  searchParams: McrOnLensMapPageProps["searchParams"],
): { photoId: string; lat: number; lng: number } | null {
  const photoId = readParam(searchParams.photo);
  const lat = Number(readParam(searchParams.lat));
  const lng = Number(readParam(searchParams.lng));
  if (!photoId || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { photoId, lat, lng };
}

export default async function McrOnLensMapPage({ searchParams }: McrOnLensMapPageProps) {
  const [photos, accessToken] = await Promise.all([
    getLensPhotos(),
    Promise.resolve(getMapboxToken()),
  ]);
  const pins = toLensMapPins(photos);
  const focus = parseFocus(searchParams);
  const jsonLdPhotos = photos
    .filter(
      (photo) =>
        typeof photo.lat === "number" &&
        typeof photo.lng === "number" &&
        Number.isFinite(photo.lat) &&
        Number.isFinite(photo.lng),
    )
    .map((photo) => {
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

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: MCR_ON_LENS_LABEL, path: MCR_ON_LENS_PATH },
          { name: "Map", path: MCR_ON_LENS_MAP_PATH },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: `${MCR_ON_LENS_LABEL} map`,
          description: mapDescription,
          path: MCR_ON_LENS_MAP_PATH,
        })}
      />
      {jsonLdPhotos.length > 0 ? (
        <JsonLd
          data={buildLensPhotoItemListJsonLd(jsonLdPhotos, {
            name: `${MCR_ON_LENS_LABEL} map pins`,
            path: MCR_ON_LENS_MAP_PATH,
            description: mapDescription,
          })}
        />
      ) : null}
      <McrOnLensHero />
      <section className="mb-stack-lg" aria-labelledby="mcr-on-lens-map-heading">
        <div className="mb-6">
          <h2
            id="mcr-on-lens-map-heading"
            className="font-display text-headline-md text-industrial-black"
          >
            Manchester map
          </h2>
          <p className="mt-1 text-label-md text-secondary">
            {pins.length === 0
              ? "Community photo pins appear here once uploads include a location."
              : `${pins.length} photo${pins.length === 1 ? "" : "s"} pinned from the upload catalog.`}
          </p>
        </div>

        {accessToken ? (
          <McrOnLensMap accessToken={accessToken} pins={pins} focus={focus} />
        ) : (
          <div className="rounded-xl border border-dashed border-industrial-black/15 bg-surface-container-low px-6 py-16 text-center">
            <p className="font-display text-xl font-bold text-industrial-black">
              Mapbox token needed
            </p>
            <p className="mx-auto mt-2 max-w-md text-body-md text-secondary">
              Set <code className="text-sm">MAPBOX_ACCESS_TOKEN</code> in{" "}
              <code className="text-sm">apps/web/.env.local</code> to show the
              Manchester map.
            </p>
          </div>
        )}
      </section>
      <ExploreMoreLinks
        title="Explore more on HappenMCR"
        links={[
          { href: MCR_ON_LENS_PATH, label: "MCR on Lens feed" },
          { href: MCR_ON_LENS_UPLOAD_PATH, label: "Upload a photo" },
          { href: MCR_HISTORY_PATH, label: MCR_HISTORY_LABEL },
          { href: "/mcr-buzz", label: "MCR Buzz hub" },
          { href: "/events/today", label: "Events in Manchester today" },
        ]}
      />
    </>
  );
}
