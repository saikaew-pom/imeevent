"use client";

import { useState } from "react";
import { TimelineFinding, FindingSeverity } from "@/data/tasks";
import { useDeck } from "@/store/useDeck";
import { useProjectSlug } from "@/components/ProjectProvider";

const SEVERITY_META: Record<FindingSeverity, { label: string; color: string }> = {
  risk: { label: "Risk", color: "var(--danger)" },
  gap: { label: "Gap", color: "var(--gold-bright)" },
  tip: { label: "Tip", color: "var(--emerald-bright)" },
};

export function TimelineReviewModal({
  onClose,
  onJumpToTask,
}: {
  onClose: () => void;
  onJumpToTask: (taskId: string) => void;
}) {
  const reviewTimeline = useDeck((s) => s.reviewTimeline);
  const PROJECT_SLUG = useProjectSlug();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [findings, setFindings] = useState<TimelineFinding[] | null>(null);

  const run = async () => {
    setLoading(true);
    setError("");
    const result = await reviewTimeline(PROJECT_SLUG);
    if (result.ok) setFindings(result.findings ?? []);
    else setError(result.error ?? "Review failed.");
    setLoading(false);
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
          <h3 className="text-lg font-semibold gold-text">✨ AI review — timeline</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>
        <p className="text-[12.5px] text-[var(--text-dim)] mb-4">
          Reads the full prep-task list for overdue items, missing assignees, and gaps.
          Advisory only — nothing changes automatically.
        </p>

        {findings === null ? (
          <div className="py-8 text-center">
            <button
              onClick={run}
              disabled={loading}
              className="btn btn-gold px-5 py-2.5 disabled:opacity-60"
            >
              {loading ? "Reviewing…" : "Run AI review"}
            </button>
            {error && (
              <p className="text-[12.5px] mt-3" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}
          </div>
        ) : findings.length === 0 ? (
          <p className="text-[13px] text-[var(--text-faint)] py-6 text-center">
            No issues found — the timeline looks solid.
          </p>
        ) : (
          <div className="space-y-2 mb-2">
            {findings.map((f, i) => (
              <div key={i} className="panel-2 px-3.5 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="chip py-0.5 px-1.5"
                    style={{
                      fontSize: 10,
                      color: SEVERITY_META[f.severity].color,
                      borderColor: SEVERITY_META[f.severity].color,
                    }}
                  >
                    {SEVERITY_META[f.severity].label}
                  </span>
                  <span className="text-[13px] font-semibold">{f.title}</span>
                </div>
                <p className="text-[12px] text-[var(--text-dim)] mt-1">{f.detail}</p>
                {f.taskId && (
                  <button
                    onClick={() => onJumpToTask(f.taskId!)}
                    className="text-[11px] emerald-text hover:underline mt-1.5"
                  >
                    Jump to task →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {findings !== null && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={run}
              disabled={loading}
              className="btn px-4 py-2 disabled:opacity-60"
            >
              {loading ? "Reviewing…" : "Run again"}
            </button>
            <button onClick={onClose} className="btn btn-gold px-4 py-2">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
