import {
  EventsBrowseMobileNav,
  EventsBrowseSidebar,
} from "@/components/events/EventsBrowseNav";

export default function EventsBrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-site gap-0 px-grid-margin lg:gap-8">
      <EventsBrowseSidebar />
      <div className="min-w-0 flex-1 py-12 sm:py-16">
        <EventsBrowseMobileNav />
        {children}
        <p className="mt-12 text-xs leading-relaxed text-secondary">
          Images belong to their respective organisers and are used for event
          promotion purposes only.
        </p>
      </div>
    </div>
  );
}
