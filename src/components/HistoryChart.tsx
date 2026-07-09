"use client";

import { historyDerived } from "@/data/history";
import { thbShort } from "@/lib/format";

// Grouped bars (revenue vs cost) per year with a margin line overlaid, plus an
// optional projected year appended (the live 2026 plan).
export function HistoryChart({
  projected,
}: {
  projected?: { year: number; revenue: number; totalCost: number; margin: number };
}) {
  const rows = [
    ...historyDerived.map((y) => ({
      year: y.year,
      revenue: y.revenue,
      totalCost: y.totalCost,
      margin: y.margin,
      projected: false,
    })),
    ...(projected
      ? [{ ...projected, projected: true }]
      : []),
  ];

  const W = 1000;
  const H = 340;
  const padX = 20;
  const padTop = 24;
  const padBottom = 46;
  const innerH = H - padTop - padBottom;
  const maxVal = Math.max(...rows.map((r) => Math.max(r.revenue, r.totalCost))) * 1.08;
  const maxMargin = Math.max(...rows.map((r) => r.margin), 40);

  const groupW = (W - padX * 2) / rows.length;
  const barW = Math.min(46, groupW * 0.3);
  const yVal = (v: number) => padTop + innerH - (v / maxVal) * innerH;
  const yMargin = (m: number) =>
    padTop + innerH - (m / maxMargin) * innerH;

  const marginPts = rows.map((r, i) => ({
    x: padX + groupW * i + groupW / 2,
    y: yMargin(r.margin),
    r,
  }));
  const marginLine = marginPts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padTop + innerH - g * innerH;
          return (
            <line
              key={g}
              x1={padX}
              x2={W - padX}
              y1={y}
              y2={y}
              stroke="var(--border-soft)"
              strokeWidth={1}
              strokeDasharray="2 5"
            />
          );
        })}

        {rows.map((r, i) => {
          const cx = padX + groupW * i + groupW / 2;
          const revX = cx - barW - 3;
          const costX = cx + 3;
          return (
            <g key={r.year}>
              {/* revenue bar */}
              <rect
                x={revX}
                y={yVal(r.revenue)}
                width={barW}
                height={padTop + innerH - yVal(r.revenue)}
                rx={3}
                fill="var(--emerald)"
                opacity={r.projected ? 0.45 : 0.85}
                stroke={r.projected ? "var(--emerald-bright)" : "none"}
                strokeDasharray={r.projected ? "4 3" : undefined}
              />
              {/* cost bar */}
              <rect
                x={costX}
                y={yVal(r.totalCost)}
                width={barW}
                height={padTop + innerH - yVal(r.totalCost)}
                rx={3}
                fill="var(--danger)"
                opacity={r.projected ? 0.4 : 0.6}
                stroke={r.projected ? "var(--danger)" : "none"}
                strokeDasharray={r.projected ? "4 3" : undefined}
              />
              {/* year label */}
              <text
                x={cx}
                y={H - padBottom + 20}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill={r.projected ? "var(--gold-bright)" : "var(--text-dim)"}
              >
                {r.year}
                {r.projected ? " ⟡" : ""}
              </text>
              <text
                x={cx}
                y={H - padBottom + 36}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-faint)"
              >
                {r.projected ? "plan" : thbShort(r.revenue)}
              </text>
            </g>
          );
        })}

        {/* margin line */}
        <path
          d={marginLine}
          fill="none"
          stroke="var(--gold-bright)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {marginPts.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill="var(--gold-bright)"
              stroke="var(--bg)"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="var(--gold-bright)"
            >
              {p.r.margin.toFixed(1)}%
            </text>
          </g>
        ))}
      </svg>

      {/* legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-1 text-[11px] text-[var(--text-faint)]">
        <Legend color="var(--emerald)" label="Revenue" />
        <Legend color="var(--danger)" label="Total cost" />
        <Legend color="var(--gold-bright)" label="GOP margin %" line />
        {projected && <Legend color="var(--gold-bright)" label="⟡ 2026 plan (projected)" />}
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  line,
}: {
  color: string;
  label: string;
  line?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        style={{
          width: line ? 14 : 9,
          height: line ? 2.5 : 9,
          borderRadius: line ? 2 : 2,
          background: color,
        }}
      />
      {label}
    </span>
  );
}
