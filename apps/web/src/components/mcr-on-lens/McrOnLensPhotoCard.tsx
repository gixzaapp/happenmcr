import Link from "next/link";
import { McrOnLensPhotoLightbox } from "@/components/mcr-on-lens/McrOnLensPhotoLightbox";
import { McrOnLensReportButton } from "@/components/mcr-on-lens/McrOnLensReportButton";
import { lensMapFocusUrl, type LensFeedCard } from "@/lib/mcr-on-lens";

type McrOnLensPhotoCardProps = {
  card: LensFeedCard;
};

export function McrOnLensPhotoCard({ card }: McrOnLensPhotoCardProps) {
  const mapUrl = lensMapFocusUrl(card);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-industrial-black/5">
      <McrOnLensPhotoLightbox imageUrl={card.imageUrl} title={card.title}>
        <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.imageUrl}
            alt={card.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-industrial-black/75 via-industrial-black/10 to-transparent"
          />

          <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-industrial-black/55 py-1 pl-1 pr-3 backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/30"
            />
            <span className="text-sm font-semibold text-white">{card.handle}</span>
          </div>

          <h3 className="pointer-events-none absolute bottom-4 left-4 right-16 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
            {card.title}
          </h3>
        </div>
      </McrOnLensPhotoLightbox>

      <div className="px-5 pb-4 pt-5">
        {mapUrl ? (
          <Link
            href={mapUrl}
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#C9A227] transition hover:text-industrial-black"
          >
            <span className="material-symbols-outlined text-base text-bee-yellow transition group-hover:text-industrial-black">
              location_on
            </span>
            <span className="underline-offset-2 group-hover:underline">
              {card.location}
            </span>
          </Link>
        ) : (
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#C9A227]">
            <span className="material-symbols-outlined text-base text-bee-yellow">
              location_on
            </span>
            {card.location}
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-secondary">
          {card.description}
        </p>

        {card.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[#EFE8D8] px-3 py-1.5 text-xs font-semibold text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-industrial-black/8 pt-4">
          <div className="flex items-center gap-5 text-sm font-semibold text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xl">
                favorite
              </span>
              {card.likes}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <McrOnLensReportButton card={card} />
            <button
              type="button"
              className="inline-flex text-bee-yellow transition hover:brightness-95"
              aria-label={`Share ${card.title}`}
            >
              <span className="material-symbols-outlined text-2xl">share</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
