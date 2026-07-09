"use client";

import { useDeck } from "@/store/useDeck";
import { findAct, Placement, PLACEMENT_LABELS } from "@/data/acts";
import { EnergyCurve } from "@/components/EnergyCurve";
import {
  analyzeLineup,
  curvePoints,
  lineupTotals,
  SLOT_ORDER,
} from "@/lib/analysis";
import { runOfShow } from "@/data/runOfShow";
import { thb, energyColor } from "@/lib/format";

// The JW confirmed lineup as a ghost reference curve.
const jwGhost = runOfShow
  .filter((b) => b.peak)
  .map((b) => ({ label: b.time, energy: b.energy }));

export function LineupPanel() {
  const lineup = useDeck((s) => s.lineup);
  const customActs = useDeck((s) => s.customActs);
  const removeItem = useDeck((s) => s.removeItem);
  const reorderSlot = useDeck((s) => s.reorderSlot);
  const clearLineup = useDeck((s) => s.clearLineup);

  const points = curvePoints(lineup, customActs);
  const warnings = analyzeLineup(lineup, customActs);
  const totals = lineupTotals(lineup, customActs);

  const move = (slot: Placement, uid: string, dir: -1 | 1) => {
    const uids = lineup.filter((i) => i.slot === slot).map((i) => i.uid);
    const idx = uids.indexOf(uid);
    const next = idx + dir;
    if (next < 0 || next >= uids.length) return;
    [uids[idx], uids[next]] = [uids[next], uids[idx]];
    reorderSlot(slot, uids);
  };

  return (
    <div className="space-y-3">
      {/* Live vibe curve */}
      <section className="panel px-4 py-4">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[12px] uppercase tracking-wide text-[var(--text-faint)]">
            Your vibe &amp; momentum
          </span>
          <span className="text-[11px] text-[var(--text-faint)]">
            {totals.count} acts
          </span>
        </div>
        {points.length > 0 ? (
          <EnergyCurve
            points={points}
            height={190}
            compact
            ghost={jwGhost}
            ghostLabel="JW peaks"
          />
        ) : (
          <div className="h-[150px] flex items-center justify-center text-[13px] text-[var(--text-faint)] text-center px-6">
            Add acts or generate a preset — the energy curve builds here.
          </div>
        )}
      </section>

      {/* Totals */}
      {totals.count > 0 && (
        <section className="grid grid-cols-3 gap-2">
          <Stat label="Talent cost" value={thb(totals.totalCost)} />
          <Stat label="Stage time" value={`${totals.totalDuration} min`} />
          <Stat label="Avg energy" value={`${totals.avgEnergy.toFixed(1)}/10`} />
        </section>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <section className="panel px-4 py-3 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex gap-2 text-[12.5px] leading-snug">
              <span
                style={{ color: w.level === "warn" ? "var(--warn)" : "var(--text-faint)" }}
              >
                {w.level === "warn" ? "▲" : "ⓘ"}
              </span>
              <span className="text-[var(--text-dim)]">{w.text}</span>
            </div>
          ))}
        </section>
      )}

      {/* Slots */}
      <section className="panel px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] uppercase tracking-wide text-[var(--text-faint)]">
            The lineup
          </span>
          {totals.count > 0 && (
            <button
              onClick={clearLineup}
              className="text-[11px] text-[var(--text-faint)] hover:text-[var(--danger)]"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-3">
          {SLOT_ORDER.map((slot) => {
            const items = lineup.filter((i) => i.slot === slot);
            return (
              <div key={slot}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide gold-text">
                    {PLACEMENT_LABELS[slot]}
                  </span>
                  <span className="flex-1 border-t hairline" />
                  <span className="text-[10px] text-[var(--text-faint)]">
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <div className="text-[11px] text-[var(--text-faint)] italic px-1 py-1">
                    empty
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item, idx) => {
                      const act = findAct(item.actId, customActs);
                      if (!act) return null;
                      return (
                        <div
                          key={item.uid}
                          className="panel-2 flex items-center gap-2 pl-2 pr-1.5 py-1.5"
                        >
                          <span
                            className="w-1 self-stretch rounded-full shrink-0"
                            style={{ background: energyColor(act.energy ?? 0) }}
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={act.photo}
                            alt=""
                            className="w-9 h-9 rounded object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate">
                              {act.name}
                            </div>
                            <div className="text-[10px] text-[var(--text-faint)]">
                              {act.energyLabel} · {act.durationMin}m
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => move(slot, item.uid, -1)}
                              disabled={idx === 0}
                              className="w-6 h-6 rounded text-[var(--text-faint)] hover:text-[var(--text)] disabled:opacity-25"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => move(slot, item.uid, 1)}
                              disabled={idx === items.length - 1}
                              className="w-6 h-6 rounded text-[var(--text-faint)] hover:text-[var(--text)] disabled:opacity-25"
                            >
                              ▼
                            </button>
                            <button
                              onClick={() => removeItem(item.uid)}
                              className="w-6 h-6 rounded text-[var(--text-faint)] hover:text-[var(--danger)]"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-2 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="text-[14px] font-semibold mt-0.5 gold-text">{value}</div>
    </div>
  );
}
