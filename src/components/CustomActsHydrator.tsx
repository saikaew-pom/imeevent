"use client";

import { useEffect } from "react";
import { useDeck } from "@/store/useDeck";

// Fetches the project's Show & Decor custom acts (and the current user's
// role) from D1 as soon as any dashboard page mounts, so Builder, Revenue,
// Costing, Present, etc. all see the same shared, server-backed data.
export function CustomActsHydrator({ slug }: { slug: string }) {
  const hydrateCustomActs = useDeck((s) => s.hydrateCustomActs);

  useEffect(() => {
    hydrateCustomActs(slug);
  }, [slug, hydrateCustomActs]);

  return null;
}
