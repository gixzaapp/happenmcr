export type NavItem = {
  href: string;
  label: string;
};

/** Primary nav — Stitch UX category vibes */
export const primaryNav: NavItem[] = [
  { href: "/category/live-music", label: "Gigs" },
  { href: "/category/electronic", label: "Nightlife" },
  { href: "/community", label: "Community" },
  { href: "/search?q=student", label: "Student" },
  { href: "/search?q=festival", label: "Festivals" },
];

/** Fast time-based discovery — homepage hero + footer */
export const timingNav: NavItem[] = [
  { href: "/events/today", label: "Today" },
  { href: "/events/weekend", label: "Weekend" },
  { href: "/events/free", label: "Free" },
];

export const footerNav: NavItem[] = [
  ...timingNav,
  { href: "/search", label: "Search" },
  { href: "/submit-event", label: "Submit Event" },
  { href: "#newsletter", label: "Newsletter" },
  { href: "/privacy", label: "Privacy" },
];
