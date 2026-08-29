import Link from "next/link";
import { MCR_ON_LENS_UPLOAD_PATH } from "@/lib/mcr-on-lens";

export function McrOnLensUploadSignIn() {
  const loginHref = `/login?callbackUrl=${encodeURIComponent(MCR_ON_LENS_UPLOAD_PATH)}`;

  return (
    <section className="mb-stack-lg max-w-xl">
      <h2 className="font-display text-headline-md text-industrial-black">
        Upload a photo
      </h2>
      <p className="mt-2 text-body-md text-secondary">
        Sign in to share a moment from Manchester with the community.
      </p>
      <Link
        href={loginHref}
        className="hard-shadow mt-8 inline-flex items-center gap-2 rounded-lg bg-bee-yellow px-8 py-4 font-display text-headline-sm text-industrial-black transition-transform hover:-translate-y-0.5"
      >
        Sign in to upload
        <span className="material-symbols-outlined">login</span>
      </Link>
    </section>
  );
}
