"use client";

import { useEffect, useState } from "react";
import type { GeocodeResponse, GeocodeSuggestion } from "@/lib/geocode";

type UseLocationSearchResult = {
  results: GeocodeSuggestion[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Debounced Mapbox forward-geocode autosuggest via `/geocode`.
 */
export function useLocationSearch(query: string): UseLocationSearchResult {
  const [results, setResults] = useState<GeocodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/geocode?query=${encodeURIComponent(trimmed)}`,
        );
        const body = (await response.json()) as GeocodeResponse;

        if (cancelled) return;

        if (!response.ok) {
          setResults([]);
          setError(body.error || "Could not look up locations.");
          return;
        }

        setResults(body.data ?? []);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Could not look up locations.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return { results, isLoading, error };
}
