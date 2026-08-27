import Link from "next/link";
import { McrOnLensPhotoCard } from "@/components/mcr-on-lens/McrOnLensPhotoCard";
import {
  lensPhotoToFeedCard,
  MCR_ON_LENS_UPLOAD_PATH,
  type LensPhoto,
} from "@/lib/mcr-on-lens";

type McrOnLensFeedProps = {
  photos: LensPhoto[];
};

export function McrOnLensFeed({ photos }: McrOnLensFeedProps) {
  const cards = photos.map(lensPhotoToFeedCard);

  return (
    <section aria-label="Community photo feed" className="mb-stack-lg">
      <div className="mb-6">
        <h2 className="font-display text-headline-md text-industrial-black">
          Community feed
        </h2>
        <p className="text-label-md text-secondary">
          Latest photos from Manchester
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-industrial-black/15 bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-display text-headline-sm text-industrial-black">
            No photos yet
          </p>
          <p className="mt-2 text-sm text-secondary">
            Be the first to share Manchester through the lens.
          </p>
          <Link
            href={MCR_ON_LENS_UPLOAD_PATH}
            className="hard-shadow mt-6 inline-flex items-center gap-2 rounded-lg bg-bee-yellow px-6 py-3 font-display text-sm text-industrial-black transition-transform hover:-translate-y-0.5"
          >
            Upload a photo
            <span className="material-symbols-outlined text-lg">upload</span>
          </Link>
        </div>
      ) : (
        <div className="mx-auto grid max-w-lg gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <McrOnLensPhotoCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
