"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MCR_ON_LENS_UPLOAD_PATH } from "@/lib/mcr-on-lens";

export function McrOnLensUploadFab() {
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <Link
      href={MCR_ON_LENS_UPLOAD_PATH}
      className="fixed bottom-8 right-8 z-40 hidden h-16 w-16 items-center justify-center rounded-full bg-bee-yellow text-industrial-black shadow-2xl transition-transform hover:scale-110 md:flex"
      aria-label="Upload a photo"
    >
      <span className="material-symbols-outlined text-3xl">add</span>
    </Link>
  );
}

export function McrOnLensUploadCta() {
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <Link
      href={MCR_ON_LENS_UPLOAD_PATH}
      className="hard-shadow mt-6 inline-flex items-center gap-2 rounded-lg bg-bee-yellow px-6 py-3 font-display text-sm text-industrial-black transition-transform hover:-translate-y-0.5"
    >
      Upload a photo
      <span className="material-symbols-outlined text-lg">upload</span>
    </Link>
  );
}
