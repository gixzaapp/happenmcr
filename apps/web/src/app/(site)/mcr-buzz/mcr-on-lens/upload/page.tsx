import { McrOnLensHero, McrOnLensUploadForm } from "@/components/mcr-on-lens";
import { McrOnLensUploadSignIn } from "@/components/mcr-on-lens/McrOnLensUploadSignIn";
import { JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import {
  MCR_ON_LENS_LABEL,
  MCR_ON_LENS_PATH,
  MCR_ON_LENS_UPLOAD_PATH,
} from "@/lib/mcr-on-lens";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `Upload · ${MCR_ON_LENS_LABEL}`,
  description:
    "Upload a photo and share Manchester through your lens on HappenMCR.",
  path: MCR_ON_LENS_UPLOAD_PATH,
  keywords: [
    "MCR on Lens",
    "upload photo Manchester",
    "Manchester photography",
    "HappenMCR",
  ],
});

export default async function McrOnLensUploadPage() {
  const session = await auth();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: MCR_ON_LENS_LABEL, path: MCR_ON_LENS_PATH },
          { name: "Upload", path: MCR_ON_LENS_UPLOAD_PATH },
        ])}
      />
      <McrOnLensHero />
      {session?.user ? <McrOnLensUploadForm /> : <McrOnLensUploadSignIn />}
    </>
  );
}
