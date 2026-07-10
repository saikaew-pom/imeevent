"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Placement, ThemeKey, Act, NewActInput } from "@/data/acts";
import { VibeLevel } from "@/data/presets";
import { defaultFinancials, FinancialAssumptions, PackageTier } from "@/data/financials";
import { CostGroupKey } from "@/data/costStructure";
import { runOfShow, Beat } from "@/data/runOfShow";
import { Slide } from "@/data/slides";
import { ProjectTask, NewTaskInput, ProjectMember } from "@/data/tasks";
import { ProjectDocument, NewDocumentInput, SuggestedTask } from "@/data/documents";

export interface LineupItem {
  uid: string;
  slot: Placement;
  actId: string;
}

// Kept local (not imported from the server-only auth/queries module) so the
// client store never pulls in "server-only" code.
export type ProjectRole = "owner" | "editor" | "viewer";

const uid = () => Math.random().toString(36).slice(2, 9);
const isWritable = (role: ProjectRole | null) => role === "owner" || role === "editor";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

// Lineup/program/financials are shared project state (D1-backed) but change
// on every keystroke (cost line inputs, drag reorders, etc), so we push each
// key to the server on a short debounce instead of one request per edit.
type StateKey = "lineup" | "program" | "financials" | "presentation";
const persistTimers: Partial<Record<StateKey, ReturnType<typeof setTimeout>>> = {};

function schedulePersist(slug: string | null, key: StateKey, data: unknown) {
  if (!slug) return;
  const timer = persistTimers[key];
  if (timer) clearTimeout(timer);
  persistTimers[key] = setTimeout(() => {
    fetch("/api/builder/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, key, data }),
    }).catch(() => {});
  }, 600);
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
  projectSlug: string | null;
  sharedStateLoaded: boolean;
  program: Beat[];
  presentation: Slide[];
  slideGenerating: string | null; // beatId currently being generated, if any
  tasks: ProjectTask[];
  tasksLoaded: boolean;
  members: ProjectMember[];
  eventDate: string | null;
  documents: ProjectDocument[];
  documentsLoaded: boolean;

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

  // Lineup/program/financials, likewise D1-backed now. hydrateSharedState
  // fetches the saved copy (if any) and remembers the slug so every
  // mutating action below can push its own debounced update.
  hydrateSharedState: (slug: string) => Promise<void>;

  addProgramBeat: () => string;
  updateProgramBeat: (id: string, patch: Partial<Beat>) => void;
  removeProgramBeat: (id: string) => void;
  reorderProgram: (ids: string[]) => void;
  setBeatActs: (id: string, actIds: string[]) => void;
  resetProgram: () => void;

  // Presentation slides — one per Event Flow beat, drafted via MiniMax AI
  // then freely editable. Generation hits its own endpoint (an AI call, not
  // a plain state write); manual edits go through the same debounced-state
  // path as lineup/program/financials.
  generateSlide: (slug: string, beatId: string) => Promise<{ ok: boolean; error?: string }>;
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  removeSlide: (id: string) => void;

  // Project management timeline — prep tasks/deadlines, D1-backed per
  // project (own table, not the JSON-blob project_state), same async
  // create/update/delete pattern as custom acts.
  hydrateTasks: (slug: string) => Promise<void>;
  hydrateMembers: (slug: string) => Promise<void>;
  importPreset: (
    slug: string,
    presetId: string,
    eventDate: string
  ) => Promise<{ ok: boolean; error?: string; count?: number }>;
  addTask: (slug: string, input: NewTaskInput) => Promise<{ ok: boolean; error?: string }>;
  updateTask: (
    slug: string,
    id: string,
    input: NewTaskInput
  ) => Promise<{ ok: boolean; error?: string }>;
  removeTask: (slug: string, id: string) => Promise<{ ok: boolean; error?: string }>;

  // Project document library + AI task suggestions.
  hydrateDocuments: (slug: string) => Promise<void>;
  addDocument: (
    slug: string,
    input: NewDocumentInput
  ) => Promise<{ ok: boolean; error?: string }>;
  removeDocument: (slug: string, id: string) => Promise<{ ok: boolean; error?: string }>;
  suggestTasks: (
    slug: string
  ) => Promise<{ ok: boolean; error?: string; suggestions?: SuggestedTask[] }>;
  acceptSuggestions: (
    slug: string,
    suggestions: SuggestedTask[]
  ) => Promise<{ ok: boolean; added: number }>;
}

export const useDeck = create<DeckState>()(
  persist(
    (set, get) => {
      const persistLineup = () => schedulePersist(get().projectSlug, "lineup", get().lineup);
      const persistProgram = () => schedulePersist(get().projectSlug, "program", get().program);
      const persistFinancials = () =>
        schedulePersist(get().projectSlug, "financials", get().financials);
      const persistPresentation = () =>
        schedulePersist(get().projectSlug, "presentation", get().presentation);

      return {
        lineup: [],
        theme: "mixed",
        vibe: "balanced",
        numShows: 3,
        financials: { ...defaultFinancials },
        videos: {},
        customActs: [],
        customActsLoaded: false,
        myRole: null,
        projectSlug: null,
        sharedStateLoaded: false,
        program: runOfShow.map((b) => ({ ...b })),
        presentation: [],
        slideGenerating: null,
        tasks: [],
        tasksLoaded: false,
        members: [],
        eventDate: null,
        documents: [],
        documentsLoaded: false,

        setVideo: (key, url) => set((s) => ({ videos: { ...s.videos, [key]: url } })),

        addAct: (slot, actId) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({ lineup: [...s.lineup, { uid: uid(), slot, actId }] }));
          persistLineup();
        },

        removeItem: (id) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({ lineup: s.lineup.filter((i) => i.uid !== id) }));
          persistLineup();
        },

        reorderSlot: (slot, uids) => {
          if (!isWritable(get().myRole)) return;
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
          });
          persistLineup();
        },

        clearLineup: () => {
          if (!isWritable(get().myRole)) return;
          set({ lineup: [] });
          persistLineup();
        },

        applySuggestion: (items) => {
          if (!isWritable(get().myRole)) return;
          set({ lineup: items.map((i) => ({ uid: uid(), ...i })) });
          persistLineup();
        },

        setTheme: (t) => set({ theme: t }),
        setVibe: (v) => set({ vibe: v }),
        setNumShows: (n) => set({ numShows: Math.max(1, Math.min(5, n)) }),

        setTier: (id, patch) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              tiers: s.financials.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
            },
          }));
          persistFinancials();
        },

        addTier: () => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              tiers: [
                ...s.financials.tiers,
                { id: uid(), name: "New tier", priceTHB: 10000, qty: 0 },
              ],
            },
          }));
          persistFinancials();
        },

        removeTier: (id) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              tiers: s.financials.tiers.filter((t) => t.id !== id),
            },
          }));
          persistFinancials();
        },

        setCostLine: (id, value) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              costLines: s.financials.costLines.map((l) => (l.id === id ? { ...l, value } : l)),
            },
          }));
          persistFinancials();
        },

        setCostLineLabel: (id, label) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              costLines: s.financials.costLines.map((l) => (l.id === id ? { ...l, label } : l)),
            },
          }));
          persistFinancials();
        },

        addCostLine: (group) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              costLines: [
                ...s.financials.costLines,
                { id: uid(), group, label: "New item", value: 0 },
              ],
            },
          }));
          persistFinancials();
        },

        removeCostLine: (id) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            financials: {
              ...s.financials,
              costLines: s.financials.costLines.filter((l) => l.id !== id),
            },
          }));
          persistFinancials();
        },

        resetFinancials: () => {
          if (!isWritable(get().myRole)) return;
          set({
            financials: {
              tiers: defaultFinancials.tiers.map((t) => ({ ...t })),
              costLines: defaultFinancials.costLines.map((l) => ({ ...l })),
            },
          });
          persistFinancials();
        },

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
            persistLineup();
            persistProgram();
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to remove item." };
          }
        },

        hydrateSharedState: async (slug) => {
          try {
            const data = await apiJson<{
              role: ProjectRole;
              lineup: LineupItem[] | null;
              program: Beat[] | null;
              financials: FinancialAssumptions | null;
              presentation: Slide[] | null;
            }>(`/api/builder/state?slug=${encodeURIComponent(slug)}`);
            set({
              projectSlug: slug,
              myRole: data.role,
              sharedStateLoaded: true,
              ...(data.lineup !== null ? { lineup: data.lineup } : {}),
              ...(data.program !== null ? { program: data.program } : {}),
              ...(data.financials !== null ? { financials: data.financials } : {}),
              ...(data.presentation !== null ? { presentation: data.presentation } : {}),
            });
          } catch {
            set({ projectSlug: slug, sharedStateLoaded: true });
          }
        },

        addProgramBeat: () => {
          if (!isWritable(get().myRole)) return "";
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
          persistProgram();
          return id;
        },

        updateProgramBeat: (id, patch) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            program: s.program.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          }));
          persistProgram();
        },

        removeProgramBeat: (id) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({ program: s.program.filter((b) => b.id !== id) }));
          persistProgram();
        },

        reorderProgram: (ids) => {
          if (!isWritable(get().myRole)) return;
          set((s) => {
            const map = new Map(s.program.map((b) => [b.id, b]));
            const reordered = ids
              .map((id) => map.get(id))
              .filter((b): b is Beat => Boolean(b));
            return { program: reordered };
          });
          persistProgram();
        },

        setBeatActs: (id, actIds) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            program: s.program.map((b) => (b.id === id ? { ...b, linkedActs: actIds } : b)),
          }));
          persistProgram();
        },

        resetProgram: () => {
          if (!isWritable(get().myRole)) return;
          set({ program: runOfShow.map((b) => ({ ...b })) });
          persistProgram();
        },

        generateSlide: async (slug, beatId) => {
          if (!isWritable(get().myRole)) return { ok: false, error: "Read-only access." };
          set({ slideGenerating: beatId });
          try {
            const data = await apiJson<{ slide: Slide }>("/api/builder/presentation/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, beatId }),
            });
            set((s) => ({
              presentation: [...s.presentation.filter((sl) => sl.beatId !== beatId), data.slide],
            }));
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Generation failed." };
          } finally {
            set({ slideGenerating: null });
          }
        },

        updateSlide: (id, patch) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({
            presentation: s.presentation.map((sl) =>
              sl.id === id ? { ...sl, ...patch, aiGenerated: false } : sl
            ),
          }));
          persistPresentation();
        },

        removeSlide: (id) => {
          if (!isWritable(get().myRole)) return;
          set((s) => ({ presentation: s.presentation.filter((sl) => sl.id !== id) }));
          persistPresentation();
        },

        hydrateTasks: async (slug) => {
          try {
            const data = await apiJson<{
              role: ProjectRole;
              tasks: ProjectTask[];
              eventDate: string | null;
            }>(`/api/builder/tasks?slug=${encodeURIComponent(slug)}`);
            set({
              tasks: data.tasks,
              myRole: data.role,
              tasksLoaded: true,
              eventDate: data.eventDate,
            });
          } catch {
            set({ tasksLoaded: true });
          }
        },

        importPreset: async (slug, presetId, eventDate) => {
          try {
            const data = await apiJson<{ tasks: ProjectTask[]; eventDate: string }>(
              "/api/builder/tasks/import",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, presetId, eventDate }),
              }
            );
            set((s) => ({ tasks: [...s.tasks, ...data.tasks], eventDate: data.eventDate }));
            return { ok: true, count: data.tasks.length };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Import failed." };
          }
        },

        hydrateMembers: async (slug) => {
          try {
            const data = await apiJson<{ members: ProjectMember[] }>(
              `/api/builder/members?slug=${encodeURIComponent(slug)}`
            );
            set({ members: data.members });
          } catch {
            // Non-critical — assignee picker just shows no options.
          }
        },

        addTask: async (slug, input) => {
          try {
            const data = await apiJson<{ task: ProjectTask }>("/api/builder/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, input }),
            });
            set((s) => ({ tasks: [...s.tasks, data.task] }));
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to add task." };
          }
        },

        updateTask: async (slug, id, input) => {
          try {
            await apiJson(`/api/builder/tasks/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, input }),
            });
            await get().hydrateTasks(slug);
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to save task." };
          }
        },

        removeTask: async (slug, id) => {
          try {
            await apiJson(`/api/builder/tasks/${id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            });
            set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to remove task." };
          }
        },

        hydrateDocuments: async (slug) => {
          try {
            const data = await apiJson<{ role: ProjectRole; documents: ProjectDocument[] }>(
              `/api/builder/documents?slug=${encodeURIComponent(slug)}`
            );
            set({ documents: data.documents, myRole: data.role, documentsLoaded: true });
          } catch {
            set({ documentsLoaded: true });
          }
        },

        addDocument: async (slug, input) => {
          try {
            const data = await apiJson<{ document: ProjectDocument }>("/api/builder/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, input }),
            });
            set((s) => ({ documents: [data.document, ...s.documents] }));
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to add document." };
          }
        },

        removeDocument: async (slug, id) => {
          try {
            await apiJson(`/api/builder/documents/${id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            });
            set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to remove document." };
          }
        },

        suggestTasks: async (slug) => {
          try {
            const data = await apiJson<{ suggestions: SuggestedTask[] }>(
              "/api/builder/documents/suggest",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
              }
            );
            return { ok: true, suggestions: data.suggestions };
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : "AI suggestion failed." };
          }
        },

        acceptSuggestions: async (slug, suggestions) => {
          let added = 0;
          for (const s of suggestions) {
            const result = await get().addTask(slug, {
              title: s.title,
              description: s.description,
              category: s.category as NewTaskInput["category"],
              status: "todo",
              dueDate: s.dueDate,
            });
            if (result.ok) added++;
          }
          return { ok: added > 0, added };
        },
      };
    },
    {
      name: "jw-deck-v5",
      version: 5,
      // customActs/myRole/etc are server-synced (D1), not persisted locally —
      // lineup/program/financials/presentation are also server-synced, but
      // kept out of localStorage too since the server is now the source of truth.
      partialize: (state) => {
        const {
          customActs,
          myRole,
          customActsLoaded,
          projectSlug,
          sharedStateLoaded,
          lineup,
          program,
          financials,
          presentation,
          slideGenerating,
          tasks,
          tasksLoaded,
          members,
          eventDate,
          documents,
          documentsLoaded,
          ...rest
        } = state;
        void customActs;
        void myRole;
        void customActsLoaded;
        void projectSlug;
        void sharedStateLoaded;
        void lineup;
        void program;
        void financials;
        void presentation;
        void slideGenerating;
        void tasks;
        void tasksLoaded;
        void members;
        void eventDate;
        void documents;
        void documentsLoaded;
        return rest;
      },
      // v1: ensure VVIP tier exists. v2: ensure customActs/program exist for
      // state persisted before those were added. v3: custom acts moved to D1.
      // v4: lineup/program/financials moved to D1 too. v5: presentation
      // slides added, likewise server-synced — drop any stale local copies.
      migrate: (persisted, version) => {
        const s = persisted as {
          financials?: { tiers?: PackageTier[] };
          customActs?: Act[];
          program?: Beat[];
          lineup?: LineupItem[];
          presentation?: Slide[];
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
        if (version < 4) {
          delete s.program;
          delete s.lineup;
          delete s.financials;
        }
        if (version < 5) {
          delete s.presentation;
        }
        return s as unknown;
      },
    }
  )
);
