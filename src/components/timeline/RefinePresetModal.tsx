"use client";

import { useState } from "react";
import { SuggestedTask } from "@/data/documents";
import { ImportedPreset } from "@/data/eventPresets";
import { SuggestionsModal } from "./SuggestionsModal";

// Two-phase flow in one control:
//  1. compose — pick an imported preset + write a brief, then "Propose changes"
//  2. review  — the AI's full replacement list, reviewed via SuggestionsModal;
//     accepting REPLACES the preset's current tasks with the ticked ones.
// Only one overlay is on screen at a time (compose OR review), never nested.
export function RefinePresetModal({
  presets,
  onClose,
  onPropose,
  onApply,
}: {
  presets: ImportedPreset[];
  onClose: () => void;
  onPropose: (
    presetId: string,
    brief: string
  ) => Promise<{ ok: boolean; suggestions?: SuggestedTask[]; error?: string }>;
  onApply: (
    presetId: string,
    accepted: SuggestedTask[]
  ) => Promise<{ ok: boolean; added?: number }>;
}) {
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedTask[] | null>(null);

  const selected = presets.find((p) => p.id === presetId);

  const propose = async () => {
    if (!presetId) return;
    setError("");
    setLoading(true);
    const result = await onPropose(presetId, brief);
    setLoading(false);
    if (result.ok) setSuggestions(result.suggestions ?? []);
    else setError(result.error ?? "Refine failed.");
  };

  // Review phase — hand off to the shared suggestions modal with refine copy.
  if (suggestions !== null) {
    return (
      <SuggestionsModal
        suggestions={suggestions}
        title={`Refined ${selected?.name ?? "preset"} tasks`}
        subtitle={`This will REPLACE the ${selected?.count ?? 0} current ${
          selected?.name ?? "preset"
        } task${selected?.count === 1 ? "" : "s"} with the ticked ones below. Nothing else on your timeline changes.`}
        acceptLabel={(n) => `Replace with ${n} task${n === 1 ? "" : "s"}`}
        emptyText="The AI returned no tasks. Close and try a different brief."
        onClose={onClose}
        onAccept={async (accepted) => {
          const r = await onApply(presetId, accepted);
          return { ok: r.ok, added: r.added ?? 0 };
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold gold-text">✨ Refine a preset</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>
        <p className="text-[12.5px] text-[var(--text-dim)] mb-4">
          Tell the AI how to adjust an imported preset — it proposes a full replacement
          list you review before anything changes.
        </p>

        <label className="block mb-3">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            Preset to refine
          </span>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="w-full mt-1"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name} ({p.count} task{p.count === 1 ? "" : "s"})
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            What should change?
          </span>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder="e.g. Push everything two weeks later, add a rehearsal-dinner day, and drop the fireworks tasks — we're indoors."
            className="w-full mt-1 text-[13px]"
            style={{
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              color: "var(--text)",
              resize: "vertical",
            }}
          />
        </label>

        {error && (
          <p className="text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn px-4 py-2">
            Cancel
          </button>
          <button
            onClick={propose}
            disabled={loading || !presetId}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Propose changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
