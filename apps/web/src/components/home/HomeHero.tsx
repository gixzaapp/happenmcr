import Image from "next/image";
import Link from "next/link";
import type { Event } from "@happenmcr/types";
import { timingNav } from "@/lib/nav";
import { HappeningToday } from "./HappeningToday";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?auto=format&fit=crop&w=2000&q=80";

const timingIcons: Record<string, string> = {
  Today: "today",
  Weekend: "date_range",
  Free: "sell",
};

type HomeHeroProps = {
  todayEvents: Event[];
};

export function HomeHero({ todayEvents = [] }: HomeHeroProps) {
  return (
    <section className="relative flex min-h-[80vh] w-full items-center overflow-hidden bg-industrial-black">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt="Manchester city streets at night"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-industrial-black via-industrial-black/40 to-transparent" />
      </div>

      <div className="relative z-20 mx-auto grid w-full max-w-site grid-cols-1 gap-stack-lg px-grid-margin py-16 lg:grid-cols-2">
        <div className="flex flex-col justify-center motion-safe:animate-rise">
          <span className="mb-stack-sm inline-block w-fit bg-bee-yellow px-3 py-1 text-label-md text-industrial-black">
            MANCHESTER UNIFIED
          </span>
          <h1 className="mb-stack-md font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-canvas-white sm:text-headline-xl">
            DON&apos;T MISS <br />
            <span className="text-bee-yellow">THE BEAT.</span>
          </h1>

          <nav
            aria-label="Browse by when"
            className="mb-stack-md flex flex-wrap gap-3"
          >
            {timingNav.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hard-shadow inline-flex items-center gap-2 px-5 py-3 font-display text-sm font-extrabold uppercase tracking-widest transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] ${
                  index === 0
                    ? "bg-bee-yellow text-industrial-black"
                    : "border-2 border-bee-yellow bg-industrial-black/70 text-bee-yellow backdrop-blur-sm hover:bg-bee-yellow hover:text-industrial-black"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[1.25rem]"
                  aria-hidden
                >
                  {timingIcons[item.label] ?? "event"}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mb-stack-md max-w-lg text-body-lg text-canvas-white/80">
            What&apos;s on in Manchester — live music, nightlife, and more.
            From underground warehouse raves to community garden workshops, if
            it&apos;s happening, it&apos;s here.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/category/live-music"
              className="hard-shadow inline-flex items-center gap-2 rounded-lg bg-bee-yellow px-8 py-4 font-display text-headline-sm text-industrial-black"
            >
              Explore Gigs
              <span className="material-symbols-outlined" aria-hidden>
                arrow_forward
              </span>
            </Link>
            <Link
              href="/submit-event"
              className="inline-flex items-center rounded-lg border-2 border-canvas-white px-8 py-4 font-display text-headline-sm text-canvas-white transition-colors hover:bg-canvas-white hover:text-industrial-black"
            >
              Submit Event
            </Link>
          </div>
        </div>

        <div className="hidden flex-col justify-end lg:flex">
          <HappeningToday events={todayEvents} />
        </div>
      </div>
    </section>
  );
}
