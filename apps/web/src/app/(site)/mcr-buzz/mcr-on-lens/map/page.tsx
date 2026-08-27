import { McrOnLensHero, McrOnLensMap } from "@/components/mcr-on-lens";
import { JsonLd } from "@/components/seo";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import { getLensPhotos, getMapboxToken } from "@/lib/lens-photos";
import {
  MCR_ON_LENS_LABEL,
  MCR_ON_LENS_MAP_PATH,
  MCR_ON_LENS_PATH,
  toLensMapPins,
} from "@/lib/mcr-on-lens";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: `Map · ${MCR_ON_LENS_LABEL}`,
  description:
    "Explore community photos pinned across Manchester on the MCR on Lens map.",
  path: MCR_ON_LENS_MAP_PATH,
  keywords: [
    "MCR on Lens map",
    "Manchester photo map",
    "Mapbox Manchester",
    "HappenMCR",
  ],
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
      <McrOnLensHero />
      <section className="mb-stack-lg">
        <div className="mb-6">
          <h2 className="font-display text-headline-md text-industrial-black">
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
    </>
  );
}
