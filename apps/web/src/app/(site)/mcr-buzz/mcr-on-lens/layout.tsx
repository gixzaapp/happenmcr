import {
  McrOnLensMobileNav,
  McrOnLensSidebar,
} from "@/components/mcr-on-lens";
import { MCR_ON_LENS_UPLOAD_PATH } from "@/lib/mcr-on-lens";
import Link from "next/link";

export default function McrOnLensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-site">
      <McrOnLensSidebar />
      <div className="min-w-0 flex-1 px-grid-margin py-8">
        <McrOnLensMobileNav />
        {children}
      </div>
      <Link
        href={MCR_ON_LENS_UPLOAD_PATH}
        className="fixed bottom-8 right-8 z-40 hidden h-16 w-16 items-center justify-center rounded-full bg-bee-yellow text-industrial-black shadow-2xl transition-transform hover:scale-110 md:flex"
        aria-label="Upload a photo"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
    </div>
  );
}
