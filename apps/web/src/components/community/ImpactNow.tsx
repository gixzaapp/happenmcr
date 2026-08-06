import Image from "next/image";
import Link from "next/link";
import { buildEventPath, type Event } from "@happenmcr/types";
import { EventSymbolicPoster } from "@/components/events/EventSymbolicPoster";
import { formatEventDate } from "@/lib/format";
import { shouldUseSymbolicEventImage } from "@/lib/source";

type ImpactNowProps = {
  workshop: Event | null;
};

const FALLBACK_WORKSHOP_IMAGE =
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80";

export function ImpactNow({ workshop }: ImpactNowProps) {
  const title = workshop?.title ?? "Sustainable Carpentry 101";
  const description =
    workshop?.description ??
    "Learn to build and repair with the Salford Makers. All tools provided, no experience needed.";
  const href = workshop ? buildEventPath(workshop) : "/search?q=workshop";
  const image = workshop?.image_url || FALLBACK_WORKSHOP_IMAGE;
  const when = workshop ? formatEventDate(workshop.start_time) : "Date TBC";
  const where = workshop?.venue_name ?? "Salford Depot";
  const useSymbolic = workshop
    ? shouldUseSymbolicEventImage(workshop.source)
    : false;

  return (
    <section id="workshops" className="mb-stack-lg scroll-mt-28">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-md text-industrial-black">
            Impact Now
          </h2>
          <p className="text-label-md text-secondary">
            Immediate volunteering and workshops
          </p>
        </div>
        <Link
          href="/search?q=workshop"
          className="hidden items-center gap-1 text-label-md font-bold text-primary sm:flex"
        >
          View All
          <span className="material-symbols-outlined text-base">
            arrow_outward
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Link
          href={href}
          className="group relative h-[400px] overflow-hidden lg:col-span-8"
        >
          {useSymbolic ? (
            <EventSymbolicPoster
              title={title}
              className="absolute inset-0 p-8"
              titleClassName="max-w-xl text-2xl sm:text-4xl line-clamp-4"
            />
          ) : (
            <>
              <Image
                src={image}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-industrial-black to-transparent opacity-80" />
            </>
          )}
          <div className="absolute left-4 top-4 z-10 bg-event-teal px-3 py-1 text-label-md uppercase tracking-wider text-white">
            Workshop
          </div>
          <div className="absolute bottom-8 left-8 right-8 z-10">
            {!useSymbolic ? (
              <h3 className="mb-2 font-display text-2xl font-bold text-white sm:text-headline-lg">
                {title}
              </h3>
            ) : null}
            <p className="mb-4 max-w-md text-body-md text-canvas-white line-clamp-2">
              {description}
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1 text-label-md text-bee-yellow">
                <span className="material-symbols-outlined text-base">
                  calendar_today
                </span>
                {when}
              </span>
              <span className="flex items-center gap-1 text-label-md text-bee-yellow">
                <span className="material-symbols-outlined text-base">
                  location_on
                </span>
                {where}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <div
            id="volunteering"
            className="scroll-mt-28 border-l-4 border-event-purple bg-surface-container-low p-6 transition-colors hover:bg-surface-container"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="text-label-md uppercase tracking-widest text-event-purple">
                Charity Spotlight
              </span>
              <span className="material-symbols-outlined text-secondary">
                arrow_forward
              </span>
            </div>
            <h3 className="mb-2 font-display text-headline-sm text-industrial-black">
              Mustard Tree Warehouse
            </h3>
            <p className="mb-4 text-body-md text-secondary">
              Helping combat poverty through furniture, food, and community
              training.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-label-md font-bold text-industrial-black"
            >
              Donate Now
              <span className="material-symbols-outlined text-sm">payments</span>
            </a>
          </div>

          <div className="relative overflow-hidden bg-industrial-black p-6 text-white">
            <h3 className="mb-4 font-display text-headline-sm text-bee-yellow">
              Quick Fix
            </h3>
            <p className="mb-6 text-body-md">
              Need a volunteer for a quick 2-hour task? Our micro-volunteering
              board connects you instantly.
            </p>
            <Link
              href="/search?q=volunteer"
              className="inline-block border-b-2 border-bee-yellow pb-1 text-label-md font-bold"
            >
              Start Browsing
            </Link>
            <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-10">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "120px" }}
              >
                bolt
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
