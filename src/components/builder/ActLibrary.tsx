"use client";

import { useMemo, useState } from "react";
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
import { useDeck } from "@/store/useDeck";
import { EnergyDots } from "@/components/EnergyBadge";
import { thbShort } from "@/lib/format";
import { ItemFormModal } from "./ItemFormModal";

const slotShort: Record<Placement, string> = {
  welcome: "W",
  opening: "O",
  mid: "M",
  finale: "F",
};

export function ActLibrary() {
  const addAct = useDeck((s) => s.addAct);
  const customActs = useDeck((s) => s.customActs);
  const addCustomAct = useDeck((s) => s.addCustomAct);
  const updateCustomAct = useDeck((s) => s.updateCustomAct);
  const removeCustomAct = useDeck((s) => s.removeCustomAct);

  const [q, setQ] = useState("");
  const [kindTab, setKindTab] = useState<ItemKind | "all">("all");
  const [themeFilter, setThemeFilter] = useState<ThemeKey | "all">("all");
  const [placeFilter, setPlaceFilter] = useState<Placement | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Act | null>(null);

  const all = useMemo(() => allActsList(customActs), [customActs]);

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

  const submitForm = (input: NewActInput) => {
    if (editing) updateCustomAct(editing.id, buildPatch(input));
    else addCustomAct(input);
    setEditing(null);
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
            onAdd={(slot) => addAct(slot, a.id)}
            onEdit={
              a.custom
                ? () => {
                    setEditing(a);
                    setFormOpen(true);
                  }
                : undefined
            }
            onRemove={a.custom ? () => removeCustomAct(a.id) : undefined}
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
    </div>
  );
}

function buildPatch(input: NewActInput): Partial<Act> {
  return {
    name: input.name,
    type: input.type,
    description: input.description,
    kind: input.kind,
    themes: input.themes,
    requiresDark: input.requiresDark,
    durationMin: input.durationMin,
    costTHB: input.costTHB,
    photo: input.photo,
    photos: input.photo ? [input.photo] : undefined,
    energy: input.kind === "show" ? input.energy : undefined,
    energyLabel:
      input.kind === "show" && input.energy !== undefined
        ? energyLabelLocal(input.energy)
        : undefined,
    placement: input.kind === "show" ? input.placement : undefined,
  };
}

function energyLabelLocal(n: number) {
  if (n <= 3) return "Low";
  if (n <= 5) return "Medium";
  if (n <= 8) return "High";
  return "Very High";
}

function ActCard({
  act,
  onAdd,
  onEdit,
  onRemove,
}: {
  act: Act;
  onAdd: (slot: Placement) => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const isShow = act.kind === "show";
  return (
    <div className="panel-2 overflow-hidden group flex flex-col">
      <div className="relative h-28 overflow-hidden">
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
            {thbShort(act.costTHB)} · {act.durationMin}m
          </span>
          {act.custom && (
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="text-[10px] text-[var(--text-faint)] hover:text-[var(--gold-bright)]"
              >
                ✎ edit
              </button>
              <button
                onClick={onRemove}
                className="text-[10px] text-[var(--text-faint)] hover:text-[var(--danger)]"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {/* add-to-slot buttons — shows only; decor items aren't slotted */}
        {isShow && (
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
