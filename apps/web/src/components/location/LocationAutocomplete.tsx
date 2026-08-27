"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { GeocodeSuggestion } from "@/lib/geocode";
import { useLocationSearch } from "@/hooks/useLocationSearch";

export type SelectedLocation = {
  place_name: string;
  lat: number;
  lng: number;
  /** Full geocode suggestion for later map / storage use. */
  geocode: GeocodeSuggestion;
};

type LocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (location: SelectedLocation) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function LocationAutocomplete({
  value,
  onChange,
  onSelectLocation,
  id,
  disabled = false,
  placeholder = "Add location",
}: LocationAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { results, isLoading, error } = useLocationSearch(value);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const showDropdown =
    open &&
    !disabled &&
    value.trim().length >= 2 &&
    (isLoading || results.length > 0 || Boolean(error));

  function selectResult(suggestion: GeocodeSuggestion) {
    onChange(suggestion.place_name);
    onSelectLocation({
      place_name: suggestion.place_name,
      lat: suggestion.lat,
      lng: suggestion.lng,
      geocode: suggestion,
    });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bee-yellow">
          location_on
        </span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg border border-industrial-black/15 bg-canvas-white py-3 pl-11 pr-4 text-base outline-none focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60"
        />
      </div>

      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-industrial-black/10 bg-canvas-white py-1 shadow-lg"
        >
          {isLoading ? (
            <li className="px-4 py-3 text-sm text-secondary">Searching…</li>
          ) : null}
          {!isLoading && error ? (
            <li className="px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </li>
          ) : null}
          {!isLoading && !error && results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-secondary">No places found.</li>
          ) : null}
          {!isLoading &&
            !error &&
            results.map((suggestion) => (
              <li key={suggestion.id} role="option">
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-industrial-black transition hover:bg-surface-container-low"
                  onClick={() => selectResult(suggestion)}
                >
                  <span className="material-symbols-outlined mt-0.5 text-base text-bee-yellow">
                    place
                  </span>
                  <span>{suggestion.place_name}</span>
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
