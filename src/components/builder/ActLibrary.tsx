"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Act,
  ThemeKey,
  THEME_LABELS,
  Placement,
  PLACEMENT_LABELS,
  ItemKind,
  NewActInput,
  allActsList,
} from "@/data/acts";
import { LibraryAct } from "@/data/companyLibrary";
import { useDeck } from "@/store/useDeck";
import { EnergyDots } from "@/components/EnergyBadge";
import { moneyShort } from "@/lib/format";
import { ItemFormModal } from "./ItemFormModal";
import { useProjectSlug } from "@/components/ProjectProvider";

const slotShort: Record<Placement, string> = {
  welcome: "W",
  opening: "O",
  mid: "M",
  finale: "F",
};

export function ActLibrary() {
  const addAct = useDeck((s) => s.addAct);
  const customActs = useDeck((s) => s.customActs);
  const myRole = useDeck((s) => s.myRole);
  const addCustomAct = useDeck((s) => s.addCustomAct);
  const updateCustomAct = useDeck((s) => s.updateCustomAct);
  const removeCustomAct = useDeck((s) => s.removeCustomAct);
  const fetchLibraryActs = useDeck((s) => s.fetchLibraryActs);
  const copyLibraryAct = useDeck((s) => s.copyLibraryAct);
  const canWrite = myRole === "owner" || myRole === "editor";
  const PROJECT_SLUG = useProjectSlug();

  const [q, setQ] = useState("");
  const [kindTab, setKindTab] = useState<ItemKind | "all">("all");
  const [themeFilter, setThemeFilter] = useState<ThemeKey | "all">("all");
  const [placeFilter, setPlaceFilter] = useState<Placement | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Act | null>(null);
  const [viewing, setViewing] = useState<Act | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState("");

  const isJW = PROJECT_SLUG === "jw-gala-garden-night";
  const all = useMemo(() => allActsList(customActs, isJW), [customActs, isJW]);

  const filtered = useMemo(() => {
    return all.filter((a) => {
      if (kindTab !== "all" && a.kind !== kindTab) return false;
      if (themeFilter !== "all" && !a.themes.includes(themeFilter)) return false;
      if (
        placeFilter !== "all" &&
        (a.kind !== "show" || !a.placement?.includes(placeFilter))
      )
        return false;
      if (q && !`${a.name} ${a.type}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [all, kindTab, q, themeFilter, placeFilter]);

  const themeKeys = Object.keys(THEME_LABELS) as ThemeKey[];
  const placeKeys = Object.keys(PLACEMENT_LABELS) as Placement[];

  const submitForm = async (input: NewActInput) => {
    setError("");
    // Editing an item that already has its own row (a fresh custom item, or
    // a built-in act that was already overridden before) -> update in place.
    // Editing a built-in act for the first time -> create an override row.
    const result =
      editing && (editing.custom || editing.overridden)
        ? await updateCustomAct(PROJECT_SLUG, editing.id, input)
        : await addCustomAct(PROJECT_SLUG, input, editing?.id);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
    return result;
  };

  const handleRemove = async (id: string) => {
    setError("");
    const result = await removeCustomAct(PROJECT_SLUG, id);
    if (!result.ok) setError(result.error ?? "Failed to remove item.");
  };

  return (
    <div>
      {/* Kind tabs + add button */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex gap-1 panel-2 p-1">
          {(["all", "show", "decor"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindTab(k)}
              className="nav-link"
              style={
                kindTab === k
                  ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                  : {}
              }
            >
              {k === "all" ? "All items" : k === "show" ? "Shows" : "Decor & Elements"}
            </button>
          ))}
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLibraryOpen(true)}
              className="btn py-1.5 px-3 text-[12.5px]"
            >
              Browse company library
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="btn btn-emerald py-1.5 px-3 text-[12.5px]"
            >
              + Add new item
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${all.length} items…`}
          className="w-48"
        />
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value as ThemeKey | "all")}
        >
          <option value="all">All themes</option>
          {themeKeys.map((t) => (
            <option key={t} value={t}>
              {THEME_LABELS[t]}
            </option>
          ))}
        </select>
        {kindTab !== "decor" && (
          <select
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value as Placement | "all")}
          >
            <option value="all">Any placement</option>
            {placeKeys.map((p) => (
              <option key={p} value={p}>
                {PLACEMENT_LABELS[p]}
              </option>
            ))}
          </select>
        )}
        <span className="text-[12px] text-[var(--text-faint)] ml-auto">
          {filtered.length} items
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filtered.map((a) => (
          <ActCard
            key={a.id}
            act={a}
            onAdd={canWrite ? (slot) => addAct(slot, a.id) : undefined}
            onView={() => setViewing(a)}
            onEdit={
              canWrite
                ? () => {
                    setEditing(a);
                    setFormOpen(true);
                  }
                : undefined
            }
            onRemove={canWrite && (a.custom || a.overridden) ? () => handleRemove(a.id) : undefined}
            removeLabel={a.overridden ? "↺ reset" : "✕"}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-[13px] text-[var(--text-faint)] text-center py-8">
            No items match — try a different filter, or add a new one.
          </div>
        )}
      </div>

      {formOpen && (
        <ItemFormModal
          initial={editing ?? undefined}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={submitForm}
        />
      )}

      {viewing && <ActPhotoModal act={viewing} onClose={() => setViewing(null)} />}

      {libraryOpen && (
        <BrowseLibraryActsModal
          onClose={() => setLibraryOpen(false)}
          onFetch={() => fetchLibraryActs(PROJECT_SLUG)}
          onCopy={(id) => copyLibraryAct(PROJECT_SLUG, id)}
        />
      )}
    </div>
  );
}

function ActCard({
  act,
  onAdd,
  onView,
  onEdit,
  onRemove,
  removeLabel = "✕",
}: {
  act: Act;
  onAdd?: (slot: Placement) => void;
  onView: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const isShow = act.kind === "show";
  const currency = useDeck((s) => s.financials.currency ?? "THB");
  return (
    <div className="panel-2 overflow-hidden group flex flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
          }
        }}
        title="View photo & description"
        className="relative h-28 overflow-hidden cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={act.photo}
          alt={act.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-14"
          style={{
            background: "linear-gradient(transparent, rgba(10,15,13,0.9))",
          }}
        />
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          {!isShow && (
            <span className="chip py-0.5 px-1.5" style={{ fontSize: 9 }}>
              decor
            </span>
          )}
          {act.overridden && (
            <span
              className="chip py-0.5 px-1.5"
              style={{ fontSize: 9, color: "var(--gold-bright)" }}
            >
              edited
            </span>
          )}
          {act.requiresDark && (
            <span
              className="chip py-0.5 px-1.5"
              style={{ fontSize: 9, color: "#8fb8d9" }}
            >
              ◗ dark
            </span>
          )}
        </div>
        <div className="absolute bottom-1.5 left-2 right-2">
          <div className="text-[12px] font-semibold leading-tight truncate">
            {act.name}
          </div>
        </div>
      </div>

      <div className="px-2.5 py-2 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-faint)] truncate">
            {act.type}
          </span>
          {isShow && act.energy !== undefined && <EnergyDots energy={act.energy} />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-faint)]">
            {moneyShort(act.costTHB, currency)} · {act.durationMin}m
          </span>
          {(onEdit || onRemove) && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="text-[10px] text-[var(--text-faint)] hover:text-[var(--gold-bright)]"
                >
                  ✎ edit
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="text-[10px] text-[var(--text-faint)] hover:text-[var(--danger)]"
                >
                  {removeLabel}
                </button>
              )}
            </div>
          )}
        </div>
        {/* add-to-slot buttons — shows only; decor items aren't slotted */}
        {isShow && onAdd && (
          <div className="flex gap-1 mt-auto">
            {(["welcome", "opening", "mid", "finale"] as Placement[]).map((slot) => {
              const rec = act.placement?.includes(slot);
              return (
                <button
                  key={slot}
                  onClick={() => onAdd(slot)}
                  title={`Add to ${slot}${rec ? " (recommended)" : ""}`}
                  className="flex-1 text-[11px] font-semibold py-1 rounded-md border transition-colors"
                  style={{
                    borderColor: rec ? "var(--gold)" : "var(--border)",
                    color: rec ? "var(--gold-bright)" : "var(--text-faint)",
                    background: rec ? "rgba(217,180,90,0.08)" : "transparent",
                  }}
                >
                  {slotShort[slot]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActPhotoModal({ act, onClose }: { act: Act; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 btn px-3 py-1.5 z-10">
        ✕
      </button>
      <div
        className="max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col items-center fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={act.photo}
          alt={act.name}
          className="max-h-[60vh] w-auto rounded-xl border hairline"
        />
        <div className="panel px-5 py-4 mt-3 w-full">
          <h3 className="text-lg font-semibold gold-text mb-1">{act.name}</h3>
          <p className="text-[12px] text-[var(--text-faint)] mb-2">
            {act.type}
            {act.kind === "show" && act.energy !== undefined && ` · energy ${act.energy}/10`}
          </p>
          <p className="text-[13.5px] text-[var(--text-dim)] leading-relaxed">
            {act.description || "No description yet."}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BrowseLibraryActsModal({
  onClose,
  onFetch,
  onCopy,
}: {
  onClose: () => void;
  onFetch: () => Promise<{ ok: boolean; items?: LibraryAct[]; error?: string }>;
  onCopy: (id: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [items, setItems] = useState<LibraryAct[] | null>(null);
  const [error, setError] = useState("");
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const currency = useDeck((s) => s.financials.currency ?? "THB");

  useEffect(() => {
    let cancelled = false;
    onFetch().then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items ?? []);
      else setError(result.error ?? "Failed to load company library.");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async (id: string) => {
    setCopyingId(id);
    setError("");
    const result = await onCopy(id);
    setCopyingId(null);
    if (result.ok) setCopiedIds((s) => new Set(s).add(id));
    else setError(result.error ?? "Copy failed.");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold gold-text">Browse company library</h3>
            <p className="text-[12px] text-[var(--text-faint)] mt-0.5">
              Copy a show or decor item from your company&apos;s shared library into this
              project.
            </p>
          </div>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        {error && (
          <p className="text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        {items === null ? (
          <p className="text-[13px] text-[var(--text-faint)] py-8 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[13px] text-[var(--text-faint)] py-8 text-center">
            Nothing in your company library yet. Add items from the{" "}
            <a href="/library" className="emerald-text hover:underline">
              Library
            </a>{" "}
            page.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {items.map((item) => (
              <div key={item.id} className="panel-2 overflow-hidden flex flex-col">
                <div className="relative h-28 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photo}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {item.kind === "decor" && (
                    <span
                      className="absolute top-1.5 right-1.5 chip py-0.5 px-1.5"
                      style={{ fontSize: 9 }}
                    >
                      decor
                    </span>
                  )}
                </div>
                <div className="px-2.5 py-2 flex-1 flex flex-col gap-1.5">
                  <div className="text-[12px] font-semibold leading-tight truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-faint)] truncate">
                      {item.type}
                    </span>
                    {item.kind === "show" && item.energy !== undefined && (
                      <EnergyDots energy={item.energy} />
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-faint)]">
                    {moneyShort(item.costTHB, currency)} · {item.durationMin}m
                  </span>
                  <button
                    onClick={() => handleCopy(item.id)}
                    disabled={copyingId === item.id || copiedIds.has(item.id)}
                    className="btn btn-emerald w-full mt-auto py-1 text-[11px] disabled:opacity-60"
                  >
                    {copiedIds.has(item.id)
                      ? "✓ Copied"
                      : copyingId === item.id
                      ? "Copying…"
                      : "Copy to project"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
