"use client";

import { useId } from "react";

export interface CurvePoint {
  label: string; // x-axis label (e.g. time or slot)
  sublabel?: string; // small caption under the label
  energy: number; // 0–10
  highlight?: boolean; // gold peak marker
  tone?: "gold" | "emerald";
}

interface Props {
  points: CurvePoint[];
  height?: number;
  ghost?: CurvePoint[]; // optional reference curve drawn faint behind
  ghostLabel?: string;
  compact?: boolean;
}

// Catmull-Rom → cubic Bézier smoothing for a flowing curve through the points.
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function EnergyCurve({
  points,
  height = 260,
  ghost,
  ghostLabel,
  compact = false,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const W = 1000;
  const H = height;
  const padX = 34;
  const padTop = 24;
  const padBottom = compact ? 34 : 52;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const toXY = (arr: CurvePoint[]) =>
    arr.map((p, i) => ({
      x: padX + (arr.length === 1 ? innerW / 2 : (i / (arr.length - 1)) * innerW),
      y: padTop + innerH - (Math.max(0, Math.min(10, p.energy)) / 10) * innerH,
      p,
    }));

  const pts = toXY(points);
  const line = smoothPath(pts);
  const area =
    line +
    ` L ${pts[pts.length - 1]?.x ?? padX} ${padTop + innerH}` +
    ` L ${pts[0]?.x ?? padX} ${padTop + innerH} Z`;

  const ghostPts = ghost && ghost.length ? toXY(ghost) : null;
  const ghostLine = ghostPts ? smoothPath(ghostPts) : "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", overflow: "visible" }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold-bright)" stopOpacity="0.34" />
          <stop offset="55%" stopColor="var(--emerald)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--emerald)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--emerald-bright)" />
          <stop offset="100%" stopColor="var(--gold-bright)" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {[0, 2.5, 5, 7.5, 10].map((g) => {
        const y = padTop + innerH - (g / 10) * innerH;
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

      {/* ghost reference curve */}
      {ghostLine && (
        <path
          d={ghostLine}
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth={2}
          strokeDasharray="5 5"
          opacity={0.55}
        />
      )}

      {/* area + line */}
      <path d={area} fill={`url(#fill-${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#stroke-${gid})`}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* markers */}
      {pts.map((pt, i) => (
        <g key={i}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r={pt.p.highlight ? 7 : 4.5}
            fill={pt.p.highlight ? "var(--gold-bright)" : "var(--emerald-bright)"}
            stroke="var(--bg)"
            strokeWidth={2.5}
          />
          {pt.p.highlight && (
            <circle
              cx={pt.x}
              cy={pt.y}
              r={12}
              fill="none"
              stroke="var(--gold-bright)"
              strokeWidth={1}
              opacity={0.5}
            />
          )}
          <text
            x={pt.x}
            y={H - padBottom + 20}
            textAnchor="middle"
            fontSize={13}
            fontWeight={600}
            fill={pt.p.highlight ? "var(--gold-bright)" : "var(--text-dim)"}
          >
            {pt.p.label}
          </text>
          {!compact && pt.p.sublabel && (
            <text
              x={pt.x}
              y={H - padBottom + 37}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--text-faint)"
            >
              {pt.p.sublabel.length > 18
                ? pt.p.sublabel.slice(0, 17) + "…"
                : pt.p.sublabel}
            </text>
          )}
        </g>
      ))}

      {ghostLabel && ghostPts && (
        <text
          x={W - padX}
          y={padTop + 4}
          textAnchor="end"
          fontSize={11}
          fill="var(--text-faint)"
        >
          ┄ {ghostLabel}
        </text>
      )}
    </svg>
  );
}
