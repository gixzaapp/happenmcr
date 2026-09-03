import {
  MCR_ON_LENS_HEADLINE,
  MCR_ON_LENS_TAGLINE,
} from "@/lib/mcr-on-lens";

const ICONS = [
  { name: "photo_camera", label: "Capture", fill: 0 },
  { name: "location_on", label: "Places", fill: 0 },
  { name: "group", label: "Community", fill: 1 },
] as const;

/** Centered brand header for MCR on Lens — matches the design mock. */
export function McrOnLensHero() {
  return (
    <section className="relative mb-6 overflow-hidden rounded-xl px-4 py-4 sm:py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(232,120,34,0.08),transparent_55%),radial-gradient(ellipse_at_top,rgba(120,100,160,0.06),transparent_50%)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-industrial-black sm:text-4xl">
          {MCR_ON_LENS_HEADLINE}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-secondary sm:text-base">
          {MCR_ON_LENS_TAGLINE}
        </p>
        <div
          className="mt-3 flex items-center justify-center gap-6 sm:gap-8"
          aria-hidden
        >
          {ICONS.map((icon) => (
            <span
              key={icon.name}
              className="material-symbols-outlined text-[1.75rem] leading-none sm:text-[2rem]"
              style={{
                color: "#E87822",
                fontVariationSettings: `'FILL' ${icon.fill}`,
              }}
              title={icon.label}
            >
              {icon.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
