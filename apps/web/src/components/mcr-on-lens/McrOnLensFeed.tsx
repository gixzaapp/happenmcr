import { McrOnLensPhotoCard } from "@/components/mcr-on-lens/McrOnLensPhotoCard";
import {
  lensPhotoToFeedCard,
  MOCK_LENS_FEED_CARD,
  type LensPhoto,
} from "@/lib/mcr-on-lens";

type McrOnLensFeedProps = {
  photos: LensPhoto[];
};

export function McrOnLensFeed({ photos }: McrOnLensFeedProps) {
  const cards = [
    MOCK_LENS_FEED_CARD,
    ...photos.map(lensPhotoToFeedCard),
  ];

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

      <div className="mx-auto grid max-w-lg gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <McrOnLensPhotoCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
