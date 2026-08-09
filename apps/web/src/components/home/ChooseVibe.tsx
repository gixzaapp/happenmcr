import Image from "next/image";
import Link from "next/link";

export type VibeCard = {
  href: string;
  label: string;
  countLabel: string;
  image: string;
};

type ChooseVibeProps = {
  vibes: VibeCard[];
};

export function ChooseVibe({ vibes }: ChooseVibeProps) {
  return (
    <section className="bg-surface-container-low py-stack-lg">
      <div className="mx-auto max-w-site px-grid-margin">
        <h2 className="mb-3 text-center font-display text-3xl font-bold tracking-tight text-industrial-black sm:text-headline-lg">
          CHOOSE YOUR VIBE
        </h2>
        <p className="mx-auto mb-stack-md max-w-2xl text-center text-base text-secondary">
          Browse live music Manchester gigs, nightlife, workshops, and student
          events — then jump into today&apos;s listings.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {vibes.map((vibe) => (
            <Link
              key={vibe.href}
              href={vibe.href}
              className="group relative flex h-80 items-end overflow-hidden rounded-xl border-2 border-transparent p-6 transition-all hover:border-bee-yellow"
            >
              <Image
                src={vibe.image}
                alt={`${vibe.label} events in Manchester`}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover brightness-50 transition-transform duration-700 group-hover:scale-110"
              />
              <div className="relative z-10 w-full">
                <h3 className="mb-2 font-display text-2xl font-bold text-canvas-white sm:text-headline-md">
                  {vibe.label}
                </h3>
                <div className="flex items-center justify-between text-bee-yellow">
                  <span className="text-label-md">{vibe.countLabel}</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
