import {
  listMcrBuzzNavSections,
  mcrBuzzPath,
} from "@/lib/mcr-buzz";

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
  { href: "/category/electronic", label: "Nightlife" },
  { href: "/community", label: "Community" },
  { href: "/search?q=festival", label: "Festivals" },
];

/** Local Manchester buzz — children come from the MCR Buzz registry. */
export const mcrBuzzNav: NavDropdown = {
  label: "MCR Buzz",
  children: listMcrBuzzNavSections().map((section) => ({
    href: mcrBuzzPath(section.slug),
    label: section.label,
  })),
};

/** Fast time-based discovery — homepage hero + footer */
export const timingNav: NavItem[] = [
  { href: "/events/today", label: "Today" },
  { href: "/events/weekend", label: "Weekend" },
  { href: "/events/free", label: "Free" },
];

export const footerNav: NavItem[] = [
  ...timingNav,
  { href: "/mcr-buzz", label: "MCR Buzz" },
  { href: "/search", label: "Search" },
  { href: "/submit-event", label: "Submit Event" },
  { href: "#newsletter", label: "Newsletter" },
  { href: "/privacy", label: "Privacy" },
];
