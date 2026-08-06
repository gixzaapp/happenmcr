import Link from "next/link";
import { footerNav } from "@/lib/nav";

const socialLinks = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.263 5.706L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.75 8.44-4.91 8.44-9.93Z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.8a4.84 4.84 0 0 1-1-.11Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54C0 23.24.78 24 1.77 24h20.45c.98 0 1.78-.76 1.78-1.73V1.73C24 .76 23.2 0 22.23 0Z" />
      </svg>
    ),
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-secondary/10 bg-industrial-black">
      <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-8 px-grid-margin py-stack-lg md:flex-row">
        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tighter text-canvas-white sm:text-[32px] sm:leading-none"
        >
          Happen<span className="text-bee-yellow">MCR</span>
        </Link>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          {footerNav.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-body-md text-secondary-fixed-dim transition-colors hover:text-bee-yellow"
            >
              {item.label}
            </Link>
          ))}
          <span className="text-body-md text-secondary-fixed-dim">
            Submit Event
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/search"
            className="text-secondary-fixed-dim transition-colors hover:text-bee-yellow"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-3xl">search</span>
          </Link>
          <a
            href="#newsletter"
            className="text-secondary-fixed-dim transition-colors hover:text-bee-yellow"
            aria-label="Newsletter"
          >
            <span className="material-symbols-outlined text-3xl">mail</span>
          </a>
          <a
            href="mailto:hello@happenmcr.com"
            className="text-secondary-fixed-dim transition-colors hover:text-bee-yellow"
            aria-label="Email"
          >
            <span className="material-symbols-outlined text-3xl">
              alternate_email
            </span>
          </a>
        </div>
      </div>

      <div className="border-t border-secondary/10">
        <div className="mx-auto flex max-w-site flex-col items-center gap-4 px-grid-margin py-8">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-canvas-white">
            Follow us on
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-canvas-white/15 text-secondary-fixed-dim transition-colors hover:border-bee-yellow hover:text-bee-yellow"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
