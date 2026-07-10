"use client";

import { useState } from "react";
import { SuggestedTask } from "@/data/documents";
import { CATEGORY_LABELS, TaskCategory } from "@/data/tasks";

export function SuggestionsModal({
  suggestions,
  onClose,
  onAccept,
}: {
  suggestions: SuggestedTask[];
  onClose: () => void;
  onAccept: (accepted: SuggestedTask[]) => Promise<{ ok: boolean; added: number }>;
}) {
  const [checked, setChecked] = useState<boolean[]>(suggestions.map(() => true));
  const [adding, setAdding] = useState(false);

  const toggle = (i: number) =>
    setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));

  const selectedCount = checked.filter(Boolean).length;

  const accept = async () => {
    const accepted = suggestions.filter((_, i) => checked[i]);
    if (accepted.length === 0) return;
    setAdding(true);
    await onAccept(accepted);
    setAdding(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold gold-text">AI-suggested tasks</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>
        <p className="text-[12.5px] text-[var(--text-dim)] mb-4">
          From your documents. Untick anything you don&apos;t want, then add the rest.
        </p>

        {suggestions.length === 0 ? (
          <p className="text-[13px] text-[var(--text-faint)] py-6 text-center">
            The AI didn&apos;t find any new tasks in your documents.
          </p>
        ) : (
          <div className="space-y-2 mb-5">
            {suggestions.map((s, i) => (
              <label
                key={i}
                className="panel-2 flex gap-3 px-3.5 py-3 cursor-pointer items-start"
              >
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggle(i)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold">{s.title}</span>
                    <span className="chip py-0.5 px-1.5" style={{ fontSize: 10 }}>
                      {CATEGORY_LABELS[s.category as TaskCategory] ?? s.category}
                    </span>
                    {s.dueDate && (
                      <span className="text-[11px] text-[var(--text-faint)]">
                        due {s.dueDate}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <div className="text-[11.5px] text-[var(--text-faint)] mt-0.5">
                      {s.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn px-4 py-2">
            Cancel
          </button>
          {suggestions.length > 0 && (
            <button
              onClick={accept}
              disabled={adding || selectedCount === 0}
              className="btn btn-gold px-4 py-2 disabled:opacity-60"
            >
              {adding ? "Adding…" : `Add ${selectedCount} task${selectedCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
