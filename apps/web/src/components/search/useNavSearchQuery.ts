"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Header search value: syncs with `/search?q=…`, clears on other routes
 * (Gigs, Community, Today, home, etc.).
 */
export function useNavSearchQuery() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  return [query, setQuery] as const;
}
