"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Placement, ThemeKey, Act, NewActInput } from "@/data/acts";
import { VibeLevel } from "@/data/presets";
import { defaultFinancials, FinancialAssumptions, PackageTier } from "@/data/financials";
import { CostGroupKey } from "@/data/costStructure";
import { runOfShow, Beat } from "@/data/runOfShow";

export interface LineupItem {
  uid: string;
  slot: Placement;
  actId: string;
}

// Kept local (not imported from the server-only auth/queries module) so the
// client store never pulls in "server-only" code.
export type ProjectRole = "owner" | "editor" | "viewer";

const uid = () => Math.random().toString(36).slice(2, 9);

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

interface DeckState {
  lineup: LineupItem[];
  theme: ThemeKey | "mixed";
  vibe: VibeLevel;
  numShows: number;
  financials: FinancialAssumptions;
  videos: Record<string, string>;
  customActs: Act[];
  customActsLoaded: boolean;
  myRole: ProjectRole | null;
  program: Beat[];

  setVideo: (key: string, url: string) => void;
  addAct: (slot: Placement, actId: string) => void;
  removeItem: (uid: string) => void;
  reorderSlot: (slot: Placement, uids: string[]) => void;
  clearLineup: () => void;
  applySuggestion: (items: { slot: Placement; actId: string }[]) => void;

  setTheme: (t: ThemeKey | "mixed") => void;
  setVibe: (v: VibeLevel) => void;
  setNumShows: (n: number) => void;

  setTier: (id: string, patch: Partial<PackageTier>) => void;
  addTier: () => void;
  removeTier: (id: string) => void;
  setCostLine: (id: string, value: number) => void;
  setCostLineLabel: (id: string, label: string) => void;
  addCostLine: (group: CostGroupKey) => void;
  removeCostLine: (id: string) => void;
  resetFinancials: () => void;

  // Custom acts / decor now live in D1, scoped per project — these are async
  // and hit the API rather than mutating local state directly.
  hydrateCustomActs: (slug: string) => Promise<void>;
  addCustomAct: (
    slug: string,
    input: NewActInput,
    baseActId?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateCustomAct: (
    slug: string,
    id: string,
    input: NewActInput
  ) => Promise<{ ok: boolean; error?: string }>;
  removeCustomAct: (slug: string, id: string) => Promise<{ ok: boolean; error?: string }>;

  addProgramBeat: () => string;
  updateProgramBeat: (id: string, patch: Partial<Beat>) => void;
  removeProgramBeat: (id: string) => void;
  reorderProgram: (ids: string[]) => void;
  setBeatActs: (id: string, actIds: string[]) => void;
  resetProgram: () => void;
}

export const useDeck = create<DeckState>()(
  persist(
    (set, get) => ({
      lineup: [],
      theme: "mixed",
      vibe: "balanced",
      numShows: 3,
      financials: { ...defaultFinancials },
      videos: {},
      customActs: [],
      customActsLoaded: false,
      myRole: null,
      program: runOfShow.map((b) => ({ ...b })),

      setVideo: (key, url) =>
        set((s) => ({ videos: { ...s.videos, [key]: url } })),

      addAct: (slot, actId) =>
        set((s) => ({ lineup: [...s.lineup, { uid: uid(), slot, actId }] })),

      removeItem: (id) =>
        set((s) => ({ lineup: s.lineup.filter((i) => i.uid !== id) })),

      reorderSlot: (slot, uids) =>
        set((s) => {
          const reordered = uids
            .map((u) => s.lineup.find((i) => i.uid === u))
            .filter((i): i is LineupItem => Boolean(i));
          // Rebuild the full lineup, substituting the reordered items in the
          // first position where this slot appears; keep other slots in place.
          const result: LineupItem[] = [];
          let placed = false;
          for (const item of s.lineup) {
            if (item.slot === slot) {
              if (!placed) {
                result.push(...reordered);
                placed = true;
              }
            } else {
              result.push(item);
            }
          }
          if (!placed) result.push(...reordered);
          return { lineup: result };
        }),

      clearLineup: () => set({ lineup: [] }),

      applySuggestion: (items) =>
        set({ lineup: items.map((i) => ({ uid: uid(), ...i })) }),

      setTheme: (t) => set({ theme: t }),
      setVibe: (v) => set({ vibe: v }),
      setNumShows: (n) => set({ numShows: Math.max(1, Math.min(5, n)) }),

      setTier: (id, patch) =>
        set((s) => ({
          financials: {
            ...s.financials,
            tiers: s.financials.tiers.map((t) =>
              t.id === id ? { ...t, ...patch } : t
            ),
          },
        })),

      addTier: () =>
        set((s) => ({
          financials: {
            ...s.financials,
            tiers: [
              ...s.financials.tiers,
              { id: uid(), name: "New tier", priceTHB: 10000, qty: 0 },
            ],
          },
        })),

      removeTier: (id) =>
        set((s) => ({
          financials: {
            ...s.financials,
            tiers: s.financials.tiers.filter((t) => t.id !== id),
          },
        })),

      setCostLine: (id, value) =>
        set((s) => ({
          financials: {
            ...s.financials,
            costLines: s.financials.costLines.map((l) =>
              l.id === id ? { ...l, value } : l
            ),
          },
        })),

      setCostLineLabel: (id, label) =>
        set((s) => ({
          financials: {
            ...s.financials,
            costLines: s.financials.costLines.map((l) =>
              l.id === id ? { ...l, label } : l
            ),
          },
        })),

      addCostLine: (group) =>
        set((s) => ({
          financials: {
            ...s.financials,
            costLines: [
              ...s.financials.costLines,
              { id: uid(), group, label: "New item", value: 0 },
            ],
          },
        })),

      removeCostLine: (id) =>
        set((s) => ({
          financials: {
            ...s.financials,
            costLines: s.financials.costLines.filter((l) => l.id !== id),
          },
        })),

      resetFinancials: () =>
        set({
          financials: {
            tiers: defaultFinancials.tiers.map((t) => ({ ...t })),
            costLines: defaultFinancials.costLines.map((l) => ({ ...l })),
          },
        }),

      hydrateCustomActs: async (slug) => {
        try {
          const data = await apiJson<{ role: ProjectRole; acts: Act[] }>(
            `/api/builder/acts?slug=${encodeURIComponent(slug)}`
          );
          set({ customActs: data.acts, myRole: data.role, customActsLoaded: true });
        } catch {
          set({ customActsLoaded: true });
        }
      },

      addCustomAct: async (slug, input, baseActId) => {
        try {
          const data = await apiJson<{ act: Act }>("/api/builder/acts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, input, baseActId }),
          });
          set((s) => ({
            customActs: baseActId
              ? [...s.customActs.filter((a) => a.id !== data.act.id), data.act]
              : [...s.customActs, data.act],
          }));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Failed to add item." };
        }
      },

      updateCustomAct: async (slug, id, input) => {
        try {
          await apiJson(`/api/builder/acts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, input }),
          });
          // Refetch to stay in sync with server-computed fields (energy label etc).
          await get().hydrateCustomActs(slug);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Failed to save item." };
        }
      },

      removeCustomAct: async (slug, id) => {
        try {
          await apiJson(`/api/builder/acts/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          set((s) => ({
            customActs: s.customActs.filter((a) => a.id !== id),
            // Also drop it from any lineup slots and program links so nothing
            // dangles on a deleted custom act.
            lineup: s.lineup.filter((i) => i.actId !== id),
            program: s.program.map((b) => ({
              ...b,
              linkedActs: b.linkedActs?.filter((aid) => aid !== id),
            })),
          }));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Failed to remove item." };
        }
      },

      addProgramBeat: () => {
        const id = `custom-${uid()}`;
        const beat: Beat = {
          id,
          time: "00:00",
          durationMin: 15,
          segment: "New Program",
          location: "",
          energy: 5,
          what: "",
          lead: "",
          linkedActs: [],
          custom: true,
        };
        set((s) => ({ program: [...s.program, beat] }));
        return id;
      },

      updateProgramBeat: (id, patch) =>
        set((s) => ({
          program: s.program.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      removeProgramBeat: (id) =>
        set((s) => ({ program: s.program.filter((b) => b.id !== id) })),

      reorderProgram: (ids) =>
        set((s) => {
          const map = new Map(s.program.map((b) => [b.id, b]));
          const reordered = ids
            .map((id) => map.get(id))
            .filter((b): b is Beat => Boolean(b));
          return { program: reordered };
        }),

      setBeatActs: (id, actIds) =>
        set((s) => ({
          program: s.program.map((b) =>
            b.id === id ? { ...b, linkedActs: actIds } : b
          ),
        })),

      resetProgram: () => set({ program: runOfShow.map((b) => ({ ...b })) }),
    }),
    {
      name: "jw-deck-v3",
      version: 3,
      // customActs/myRole/customActsLoaded are server-synced (D1), not
      // persisted locally — they're refetched fresh via hydrateCustomActs().
      partialize: (state) => {
        const { customActs, myRole, customActsLoaded, ...rest } = state;
        void customActs;
        void myRole;
        void customActsLoaded;
        return rest;
      },
      // v1: ensure VVIP tier exists. v2: ensure customActs/program exist for
      // state persisted before those were added. v3: custom acts moved to D1
      // (server-synced), so drop any stale locally-persisted copies.
      migrate: (persisted, version) => {
        const s = persisted as {
          financials?: { tiers?: PackageTier[] };
          customActs?: Act[];
          program?: Beat[];
        };
        if (
          version < 1 &&
          s?.financials?.tiers &&
          !s.financials.tiers.some((t) => t.id === "vvip")
        ) {
          s.financials.tiers = [
            { id: "vvip", name: "VVIP Package", priceTHB: 20000, qty: 20 },
            ...s.financials.tiers,
          ];
        }
        if (version < 2) {
          if (!s.customActs) s.customActs = [];
          if (!s.program) s.program = runOfShow.map((b) => ({ ...b }));
        }
        if (version < 3) {
          delete s.customActs;
        }
        return s as unknown;
      },
    }
  )
);
