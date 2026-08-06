"use client";

import { useEffect, useState } from "react";

type SearchFormProps = {
  initialQuery?: string;
  autoFocus?: boolean;
};

export function SearchForm({
  initialQuery = "",
  autoFocus = false,
}: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex w-full flex-col gap-3 sm:flex-row"
    >
      <label className="sr-only" htmlFor="search-q">
        Search events
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search events, venues, categories…"
        autoFocus={autoFocus}
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-industrial-black/10 bg-surface-container-low px-4 py-3 text-base text-industrial-black outline-none transition placeholder:text-secondary focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow"
      />
      <button
        type="submit"
        className="hard-shadow inline-flex items-center justify-center rounded-lg bg-bee-yellow px-5 py-3 text-sm font-semibold text-industrial-black transition hover:-translate-y-0.5"
      >
        Search
      </button>
    </form>
  );
}
