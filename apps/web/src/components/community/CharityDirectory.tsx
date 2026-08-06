"use client";

import { useMemo, useState } from "react";

type Charity = {
  id: string;
  name: string;
  focus: string;
  description: string;
  badge: string;
  category: "Education" | "Environment" | "Homelessness" | "Art & Culture";
  color: string;
};

const FILTERS = [
  "All",
  "Education",
  "Environment",
  "Homelessness",
  "Art & Culture",
] as const;

const CHARITIES: Charity[] = [
  {
    id: "mcr-action",
    name: "MCR Action",
    focus: "Environmental Advocacy",
    description:
      "Leading the green revolution across Greater Manchester with urban reforestation and waste reduction programs.",
    badge: "12 Openings",
    category: "Environment",
    color: "bg-industrial-black text-bee-yellow",
  },
  {
    id: "lifeline-arts",
    name: "Lifeline Arts",
    focus: "Youth Development",
    description:
      "Providing creative outlets and music production workshops for underprivileged youth in the North West.",
    badge: "5 Openings",
    category: "Art & Culture",
    color: "bg-event-teal text-white",
  },
  {
    id: "booth-centre",
    name: "Booth Centre",
    focus: "Crisis Support",
    description:
      "A community centre for people affected by homelessness. Creative activities and skills training.",
    badge: "Partner",
    category: "Homelessness",
    color: "bg-event-purple text-white",
  },
  {
    id: "reading-rooms",
    name: "Northern Reading Rooms",
    focus: "Literacy & Learning",
    description:
      "Community tutoring and after-school study clubs helping young people stay confident in reading and maths.",
    badge: "8 Openings",
    category: "Education",
    color: "bg-primary text-white",
  },
];

export function CharityDirectory() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const visible = useMemo(
    () =>
      filter === "All"
        ? CHARITIES
        : CHARITIES.filter((charity) => charity.category === filter),
    [filter],
  );

  return (
    <section
      id="charities"
      className="mb-stack-lg scroll-mt-28 rounded-xl bg-surface p-6 sm:p-8"
    >
      <div className="mb-8">
        <h2 className="font-display text-headline-md text-industrial-black">
          Local Charity Directory
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-label-md transition-colors ${
                  active
                    ? "bg-industrial-black text-white"
                    : "border border-secondary/20 bg-white text-industrial-black hover:border-industrial-black"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((charity) => (
          <a
            key={charity.id}
            href="#"
            className="group rounded-lg border border-industrial-black/10 bg-white/80 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:bg-white hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="mb-4 flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold ${charity.color}`}
              >
                {charity.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold leading-none text-industrial-black">
                  {charity.name}
                </h3>
                <p className="mt-1 text-sm text-secondary">{charity.focus}</p>
              </div>
            </div>
            <p className="mb-4 line-clamp-2 text-body-md text-secondary">
              {charity.description}
            </p>
            <div className="flex items-center justify-between border-t border-secondary/10 pt-4">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                {charity.badge}
              </span>
              <span className="material-symbols-outlined text-secondary transition group-hover:text-industrial-black">
                open_in_new
              </span>
            </div>
          </a>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-secondary">No charities in this category yet.</p>
      ) : null}
    </section>
  );
}
