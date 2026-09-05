import {
  listMcrBuzzNavSections,
  mcrBuzzPath,
} from "@/lib/mcr-buzz";
import { MCR_HISTORY_LABEL, MCR_HISTORY_PATH } from "@/lib/mcr-history";
import { MCR_ON_LENS_LABEL, MCR_ON_LENS_PATH } from "@/lib/mcr-on-lens";

export type NavItem = {
  href: string;
  label: string;
};

export type NavDropdown = {
  label: string;
  children: NavItem[];
};

/** Primary nav — Stitch UX category vibes */
export const primaryNav: NavItem[] = [
  { href: "/category/live-music", label: "Gigs" },
  { href: "/category/nightlife", label: "Nightlife" },
  { href: "/community", label: "Community" },
  { href: "/category/festivals", label: "Festivals" },
];

/** Local Manchester buzz — children come from the MCR Buzz registry. */
export const mcrBuzzNav: NavDropdown = {
  label: "MCR Buzz",
  children: [
    ...listMcrBuzzNavSections().map((section) => ({
      href: mcrBuzzPath(section.slug),
      label: section.label,
    })),
    { href: MCR_HISTORY_PATH, label: MCR_HISTORY_LABEL },
    { href: MCR_ON_LENS_PATH, label: MCR_ON_LENS_LABEL },
  ],
};

/** Fast time-based discovery — homepage hero + footer */
export const timingNav: NavItem[] = [
  { href: "/events/today", label: "Today" },
  { href: "/events/weekend", label: "Weekend" },
  { href: "/events/free", label: "Free" },
];

export const footerNav: NavItem[] = [
  { href: "/whats-on-manchester", label: "What's On" },
  ...timingNav,
  { href: "/mcr-buzz", label: "MCR Buzz" },
  { href: "/search", label: "Search" },
  { href: "/submit-event", label: "Submit Event" },
  { href: "#newsletter", label: "Newsletter" },
  { href: "/privacy", label: "Privacy" },
];
