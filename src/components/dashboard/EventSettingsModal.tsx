"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useDeck } from "@/store/useDeck";
import { EventMeta } from "@/data/runOfShow";
import { guestLabelFor } from "@/data/projectTemplates";

const fieldsFor = (
  guestLabel: string
): { key: keyof EventMeta; label: string; placeholder: string; area?: boolean }[] => [
  { key: "venue", label: "Venue", placeholder: "e.g. JW Marriott Phuket Resort & Spa" },
  { key: "date", label: "Date", placeholder: "e.g. Thursday 31 December 2026" },
  { key: "timing", label: "Timing", placeholder: "e.g. 19:00 – 01:00 (6 hours)" },
  { key: "guests", label: guestLabel, placeholder: "e.g. 200 adults + 30 children" },
  { key: "spaces", label: "Spaces", placeholder: "e.g. Ballroom → Lobby Pond" },
  { key: "theme", label: "Theme", placeholder: "e.g. Emerald & Gold, garden-in-bloom" },
  { key: "concept", label: "Concept", placeholder: "The story / shape of the night…", area: true },
];

export function EventSettingsModal({ onClose }: { onClose: () => void }) {
  const meta = useDeck((s) => s.meta);
  const updateEventMeta = useDeck((s) => s.updateEventMeta);
  const [draft, setDraft] = useState<EventMeta>({ ...meta });
  const FIELDS = fieldsFor(guestLabelFor(meta.eventType));

  const save = () => {
    updateEventMeta(draft);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gold-text">Edit event details</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
                {f.label}
              </span>
              <div className="mt-1">
                {f.area ? (
                  <textarea
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={4}
                    className="w-full text-[13px]"
                    style={{
                      background: "var(--bg-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "7px 10px",
                      color: "var(--text)",
                      resize: "vertical",
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full"
                  />
                )}
              </div>
            </label>
          ))}
        </div>

        <p className="text-[11px] text-[var(--text-faint)] mt-3">
          These show on the overview and present mode, and guide the AI slide copy. The
          project name is set when you create the project.
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn px-4 py-2">
            Cancel
          </button>
          <button onClick={save} className="btn btn-gold px-4 py-2">
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
