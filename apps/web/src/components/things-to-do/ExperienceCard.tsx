import Image from "next/image";
import {
  experienceDisplayDescription,
  formatExperiencePrice,
  getExperienceCategory,
  isLicensedPartnerContent,
  providerLabel,
  resolveAffiliateUrl,
  type Experience,
} from "@/lib/things-to-do";
import { AffiliateOutboundLink } from "./AffiliateOutboundLink";

type ExperienceCardProps = {
  experience: Experience;
  titleAs?: "h2" | "h3";
};

export function ExperienceCard({
  experience,
  titleAs = "h3",
}: ExperienceCardProps) {
  const TitleTag = titleAs;
  const category = getExperienceCategory(experience.category);
  const priceLabel = formatExperiencePrice(experience);
  const bookingUrl = resolveAffiliateUrl(experience);
  const description = experienceDisplayDescription(experience);
  const licensed = isLicensedPartnerContent(experience);

  return (
    <article
      className="group flex h-full flex-col text-left"
      // Keep partner unique copy out of search snippets / index surfaces.
      data-nosnippet={licensed ? true : undefined}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-industrial-black">
        {experience.imageUrl ? (
          <Image
            src={experience.imageUrl}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-container-low px-4 text-center font-display text-sm font-semibold text-secondary">
            {experience.title}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pt-4">
        {category ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {category.label}
          </p>
        ) : null}
        <TitleTag className="font-display text-lg font-semibold leading-snug tracking-tight text-industrial-black">
          {experience.title}
        </TitleTag>
        <p className="text-sm text-secondary">{experience.location}</p>
        {description ? (
          <p className="text-sm leading-relaxed text-secondary">{description}</p>
        ) : licensed ? (
          <p className="text-sm leading-relaxed text-secondary">
            Book on {providerLabel(experience.provider)} for full details,
            availability, and pricing.
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <div className="text-xs text-secondary">
            <span className="font-semibold text-industrial-black">
              {providerLabel(experience.provider)}
            </span>
            {priceLabel ? (
              <span className="ml-2 text-primary">{priceLabel}</span>
            ) : null}
          </div>
          {bookingUrl ? (
            <AffiliateOutboundLink
              href={bookingUrl}
              provider={experience.provider}
              experienceId={experience.id}
              experienceTitle={experience.title}
              className="inline-flex items-center gap-1 font-display text-sm font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4 transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bee-yellow"
            >
              {experience.provider === "viator"
                ? "Book on Viator"
                : experience.provider === "fever"
                  ? "Book experience"
                  : "View experience"}
              <span className="material-symbols-outlined text-base" aria-hidden>
                open_in_new
              </span>
            </AffiliateOutboundLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
