"use client";

import { useEffect } from "react";
import { useDeck } from "@/store/useDeck";

// Fetches the project's Show & Decor custom acts, lineup, Event Flow
// program, and revenue/costing assumptions (plus the current user's role)
// from D1 as soon as any dashboard page mounts, so every page sees the same
// shared, server-backed data instead of a per-browser local copy.
export function CustomActsHydrator({ slug }: { slug: string }) {
  const hydrateCustomActs = useDeck((s) => s.hydrateCustomActs);
  const hydrateSharedState = useDeck((s) => s.hydrateSharedState);

  useEffect(() => {
    hydrateCustomActs(slug);
    hydrateSharedState(slug);
  }, [slug, hydrateCustomActs, hydrateSharedState]);

  return null;
}
