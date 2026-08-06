import { NewsletterForm } from "./NewsletterForm";

export function Newsletter() {
  return (
    <section
      id="newsletter"
      className="relative overflow-hidden bg-industrial-black py-24 text-canvas-white"
    >
      <div className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 select-none opacity-10">
        <span className="font-display text-[20rem] font-bold leading-none tracking-tighter">
          MCR
        </span>
      </div>
      <div className="relative z-10 mx-auto max-w-2xl px-grid-margin text-center">
        <span className="material-symbols-outlined mb-6 text-5xl text-bee-yellow">
          mail
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold sm:text-headline-lg">
          NEVER MISS OUT
        </h2>
        <p className="mb-10 text-body-lg text-canvas-white/70">
          Get the weekly shortlist of the absolute best events happening in
          Manchester, delivered every Thursday morning. No spam, just the good
          stuff.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}
