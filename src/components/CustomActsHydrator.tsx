"use client";

import { useEffect } from "react";
import { useDeck } from "@/store/useDeck";

// Fetches the project's Show & Decor custom acts, lineup, Event Flow
// program, revenue/costing assumptions, presentation slides, and timeline
// tasks (plus the current user's role) from D1 as soon as any dashboard
// page mounts, so every page sees the same shared, server-backed data
// instead of a per-browser local copy.
export function CustomActsHydrator({ slug }: { slug: string }) {
  const hydrateCustomActs = useDeck((s) => s.hydrateCustomActs);
  const hydrateSharedState = useDeck((s) => s.hydrateSharedState);
  const hydrateTasks = useDeck((s) => s.hydrateTasks);
  const hydrateMembers = useDeck((s) => s.hydrateMembers);

  useEffect(() => {
    hydrateCustomActs(slug);
    hydrateSharedState(slug);
    hydrateTasks(slug);
    hydrateMembers(slug);
  }, [slug, hydrateCustomActs, hydrateSharedState, hydrateTasks, hydrateMembers]);

  return null;
}
