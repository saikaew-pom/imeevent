"use client";

import { useState } from "react";
import { EVENT_PRESETS } from "@/data/eventPresets";

export function PresetPickerModal({
  existingCount,
  defaultEventDate,
  onClose,
  onImport,
}: {
  existingCount: number;
  defaultEventDate: string | null;
  onClose: () => void;
  onImport: (
    presetId: string,
    eventDate: string
  ) => Promise<{ ok: boolean; error?: string; count?: number }>;
}) {
  const [selected, setSelected] = useState<string>(EVENT_PRESETS[0].id);
  const [eventDate, setEventDate] = useState(defaultEventDate ?? "");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const preset = EVENT_PRESETS.find((p) => p.id === selected);

  const submit = async () => {
    if (!eventDate) {
      setError("Please set the event date first.");
      return;
    }
    setError("");
    setImporting(true);
    const result = await onImport(selected, eventDate);
    setImporting(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Import failed.");
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
          <h3 className="text-lg font-semibold gold-text">Start from a preset</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>
        <p className="text-[12.5px] text-[var(--text-dim)] mb-4">
          Pick an event type and set the date — a full task list is generated with
          deadlines counting back from your event.
        </p>

        <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
          {EVENT_PRESETS.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className="panel-2 text-left px-3.5 py-3 transition-colors"
                style={
                  active
                    ? { borderColor: "var(--gold)", background: "rgba(217,180,90,0.08)" }
                    : {}
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span className="text-[13.5px] font-semibold">{p.name}</span>
                </div>
                <div className="text-[11.5px] text-[var(--text-faint)] leading-snug">
                  {p.description}
                </div>
                <div className="text-[10.5px] text-[var(--text-faint)] mt-1.5">
                  {p.tasks.length} tasks · {p.leadLabel}
                </div>
              </button>
            );
          })}
        </div>

        <label className="block mb-4">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            Event date
          </span>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full mt-1"
          />
        </label>

        {existingCount > 0 && (
          <p className="text-[11.5px] text-[var(--text-faint)] mb-3">
            These {preset?.tasks.length ?? 0} tasks will be <strong>added</strong> to your{" "}
            {existingCount} existing task{existingCount === 1 ? "" : "s"} (nothing is
            deleted).
          </p>
        )}

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
            onClick={submit}
            disabled={importing}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {importing
              ? "Importing…"
              : `Import ${preset?.tasks.length ?? 0} tasks`}
          </button>
        </div>
      </div>
    </div>
  );
}
