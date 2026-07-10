"use client";

import { useEffect } from "react";
import { useDeck } from "@/store/useDeck";

// Fetches the project's Show & Decor custom acts, lineup, Event Flow
// program, revenue/costing assumptions, presentation slides, timeline
// tasks, the media library, and talent references (plus the current user's
// role) from D1 as soon as any dashboard page mounts, so every page sees
// the same shared, server-backed data instead of a per-browser local copy.
export function CustomActsHydrator({ slug }: { slug: string }) {
  const hydrateCustomActs = useDeck((s) => s.hydrateCustomActs);
  const hydrateSharedState = useDeck((s) => s.hydrateSharedState);
  const hydrateTasks = useDeck((s) => s.hydrateTasks);
  const hydrateMembers = useDeck((s) => s.hydrateMembers);
  const hydrateDocuments = useDeck((s) => s.hydrateDocuments);
  const hydrateMediaAssets = useDeck((s) => s.hydrateMediaAssets);
  const hydrateTalent = useDeck((s) => s.hydrateTalent);

  useEffect(() => {
    hydrateCustomActs(slug);
    hydrateSharedState(slug);
    hydrateTasks(slug);
    hydrateMembers(slug);
    hydrateDocuments(slug);
    hydrateMediaAssets(slug);
    hydrateTalent(slug);
  }, [
    slug,
    hydrateCustomActs,
    hydrateSharedState,
    hydrateTasks,
    hydrateMembers,
    hydrateDocuments,
    hydrateMediaAssets,
    hydrateTalent,
  ]);

  return null;
}
