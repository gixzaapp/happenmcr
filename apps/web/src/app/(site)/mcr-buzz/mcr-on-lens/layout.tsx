import {
  McrOnLensMobileNav,
  McrOnLensSidebar,
  McrOnLensUploadFab,
} from "@/components/mcr-on-lens";

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
      <McrOnLensUploadFab />
    </div>
  );
}
