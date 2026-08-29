import { McrOnLensFeed, McrOnLensHero } from "@/components/mcr-on-lens";
import { JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import { getLensPhotos } from "@/lib/lens-photos";
import {
  MCR_ON_LENS_LABEL,
  MCR_ON_LENS_PATH,
} from "@/lib/mcr-on-lens";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: `${MCR_ON_LENS_LABEL} · MCR Buzz`,
  description:
    "See Manchester through the eyes of the community — photos, places, and people on HappenMCR.",
  path: MCR_ON_LENS_PATH,
  keywords: [
    "MCR on Lens",
    "MCR Buzz",
    "Manchester community",
    "Manchester photography",
    "HappenMCR",
  ],
});

export default async function McrOnLensHomePage() {
  const session = await auth();
  const photos = await getLensPhotos(session?.user?.id);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: MCR_ON_LENS_LABEL, path: MCR_ON_LENS_PATH },
        ])}
      />
      <McrOnLensHero />
      <McrOnLensFeed photos={photos} />
    </>
  );
}
