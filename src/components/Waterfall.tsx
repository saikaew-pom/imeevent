"use client";

import { PnL } from "@/lib/pnl";
import { costGroupMeta } from "@/data/costStructure";
import { thbShort } from "@/lib/format";

// A P&L waterfall: revenue bar, then each main cost line item steps down,
// ending at gross profit.
export function Waterfall({ pnl }: { pnl: PnL }) {
  const steps: { label: string; delta: number; kind: "rev" | "cost" | "profit" }[] =
    [
      { label: "Revenue", delta: pnl.totalRevenue, kind: "rev" },
      ...pnl.groupTotals.map((g) => ({
        label: costGroupMeta(g.key).label.split(" ")[0].replace(",", ""),
        delta: -g.value,
        kind: "cost" as const,
      })),
      { label: "Gross profit", delta: pnl.grossProfit, kind: "profit" },
    ];

  const peak = Math.max(pnl.totalRevenue, 1);
  const W = 1000;
  const H = 300;
  const padTop = 20;
  const padBottom = 60;
  const innerH = H - padTop - padBottom;
  const n = steps.length;
  const gap = 14;
  const barW = (W - gap * (n + 1)) / n;
  const yFor = (v: number) => padTop + innerH - (v / peak) * innerH;

  let running = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <line
        x1={0}
        x2={W}
        y1={padTop + innerH}
        y2={padTop + innerH}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {steps.map((s, i) => {
        const x = gap + i * (barW + gap);
        let top: number, bottom: number, color: string;
        if (s.kind === "rev") {
          top = yFor(s.delta);
          bottom = yFor(0);
          running = s.delta;
          color = "var(--emerald)";
        } else if (s.kind === "profit") {
          top = yFor(Math.max(s.delta, 0));
          bottom = yFor(0);
          color = s.delta >= 0 ? "var(--gold)" : "var(--danger)";
        } else {
          const before = running;
          running = running + s.delta; // delta negative
          top = yFor(before);
          bottom = yFor(running);
          color = "var(--danger)";
        }
        const h = Math.max(2, bottom - top);
        return (
          <g key={i}>
            <rect
              x={x}
              y={top}
              width={barW}
              height={h}
              rx={3}
              fill={color}
              opacity={s.kind === "cost" ? 0.55 : 0.85}
            />
            <text
              x={x + barW / 2}
              y={top - 5}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="var(--text-dim)"
            >
              {thbShort(Math.abs(s.delta))}
            </text>
            <text
              x={x + barW / 2}
              y={H - padBottom + 18}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--text-faint)"
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
