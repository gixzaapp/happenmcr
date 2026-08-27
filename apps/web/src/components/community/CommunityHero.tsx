import Image from "next/image";

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=80";

type CommunityHeroProps = {
  submitAnchorId?: string;
};

export function CommunityHero({ submitAnchorId = "submit-project" }: CommunityHeroProps) {
  return (
    <section className="mb-stack-lg">
      <h1 className="industrial-line mb-4 font-display text-5xl font-extrabold tracking-tight text-industrial-black sm:text-headline-xl">
        Grit &amp; Goodness.
      </h1>
      <p className="mb-8 max-w-2xl text-body-lg text-secondary">
        Connecting Manchester&apos;s heartbeat with the hands that build it.
        Discover workshops, find your place in local volunteering, and support
        the charities that keep the city moving.
      </p>

      <div
        id={submitAnchorId}
        className="relative flex h-[300px] scroll-mt-28 items-center overflow-hidden bg-industrial-black p-8 sm:p-12"
      >
        <Image
          src={BANNER_IMAGE}
          alt="Community volunteers working together outdoors"
          fill
          priority
          sizes="(max-width: 1440px) 100vw, 1100px"
          className="object-cover opacity-50"
        />
        <div className="relative z-10 max-w-lg">
          <h2 className="mb-4 font-display text-3xl font-bold leading-tight text-bee-yellow sm:text-headline-lg">
            Got a local project? We&apos;ll back it.
          </h2>
          <a
            href="mailto:hello@happenmcr.com?subject=Submit%20a%20Community%20Project"
            className="inline-flex items-center gap-2 bg-bee-yellow px-8 py-3 text-label-md font-bold text-industrial-black transition-transform hover:scale-105"
          >
            Submit Your Project
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  );
}
