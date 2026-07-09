"use client";

import { useDeck } from "@/store/useDeck";
import { lineupTotals } from "@/lib/analysis";
import { computePnL } from "@/lib/pnl";
import {
  historyAverages,
  lastYear,
  historyInsights,
  histSummary,
  histGroupItems,
  YEARS,
} from "@/data/history";
import { COST_GROUPS, CostGroupKey } from "@/data/costStructure";
import { HistoryChart } from "@/components/HistoryChart";
import { HoverCard } from "@/components/HoverCard";
import { thb, thbShort, pct } from "@/lib/format";

export function HistorySection() {
  const financials = useDeck((s) => s.financials);
  const lineup = useDeck((s) => s.lineup);
  const customActs = useDeck((s) => s.customActs);
  const showActs = lineupTotals(lineup, customActs).totalCost;
  const pnl = computePnL(financials, showActs);

  const projected = {
    year: 2026,
    revenue: pnl.totalRevenue,
    totalCost: pnl.totalCost,
    margin: pnl.marginPct,
  };

  const marginVsLast = pnl.marginPct - lastYear.margin;
  const marginVsAvg = pnl.marginPct - historyAverages.margin;
  const entVsAvg = pnl.entertainmentPctRev - historyAverages.entPctRevenue;

  // 2026 sub-items per group (production includes the live show-acts line).
  const group2026Items = (key: CostGroupKey) => {
    const items = financials.costLines
      .filter((l) => l.group === key)
      .map((l) => ({ label: l.label, value: l.value }));
    if (key === "production" && showActs > 0)
      items.unshift({ label: "Show acts (your lineup)", value: showActs });
    return items;
  };
  const group2026Total = (key: CostGroupKey) =>
    pnl.groupTotals.find((g) => g.key === key)?.value ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display italic text-2xl md:text-3xl gold-gradient">
          Like-for-like: 2023–2025 actuals vs the 2026 plan
        </h2>
        <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-3xl">
          Real actuals (ex-tax) from the NYE P&amp;L, on the same five cost line
          items as the plan. Hover any cost line to see what&apos;s inside. The 2026
          column is your live plan.
        </p>
      </div>

      <section className="panel px-5 py-5">
        <HistoryChart projected={projected} />
      </section>

      {/* Benchmark cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Bench
          label="2026 plan margin"
          value={pct(pnl.marginPct)}
          sub={`vs 2025: ${signed(marginVsLast)}`}
          good={marginVsLast >= 0}
        />
        <Bench
          label="vs 3-yr avg margin"
          value={pct(historyAverages.margin)}
          sub={`plan is ${signed(marginVsAvg)}`}
          good={marginVsAvg >= 0}
        />
        <Bench
          label="Entertainment % rev"
          value={pct(pnl.entertainmentPctRev)}
          sub={`3-yr avg ${pct(historyAverages.entPctRevenue)} · ${signed(entVsAvg)}`}
          good={entVsAvg <= 0}
        />
        <Bench
          label="Revenue / guest"
          value={thb(pnl.revenuePerGuest)}
          sub={`3-yr avg ${thb(historyAverages.revPerPax)}`}
          good={pnl.revenuePerGuest >= historyAverages.revPerPax}
        />
      </section>

      {/* Like-for-like table */}
      <section className="panel px-5 py-5 overflow-x-auto">
        <table className="w-full text-[13px] min-w-[680px]">
          <thead>
            <tr className="text-[var(--text-faint)] text-left">
              <th className="font-medium py-2 pr-3">Line item</th>
              {YEARS.map((y) => (
                <th key={y} className="font-medium py-2 px-3 text-right">
                  {y}
                </th>
              ))}
              <th className="font-semibold gold-text py-2 px-3 text-right">2026 ⟡</th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <Row
              label="Total revenue (ex-tax)"
              values={histSummary.revenue}
              plan={pnl.totalRevenue}
              strong
              tone="emerald"
            />
            {/* Cost groups */}
            {COST_GROUPS.map((g) => (
              <GroupRow
                key={g.key}
                gkey={g.key}
                label={g.label}
                description={g.description}
                values={YEARS.map((_, i) => sumGroup(g.key, i)) as number[]}
                plan={group2026Total(g.key)}
                items2025={histGroupItems(g.key, 2)}
                items2026={group2026Items(g.key)}
              />
            ))}
            <Row
              label="Total cost"
              values={histSummary.totalCost}
              plan={pnl.totalCost}
              strong
              tone="danger"
            />
            <Row
              label="GOP"
              values={histSummary.gop}
              plan={pnl.grossProfit}
              strong
              tone="gold"
            />
            <tr style={{ background: "rgba(217,180,90,0.05)" }}>
              <td className="py-2 pr-3 font-semibold gold-text">GOP margin</td>
              {histSummary.margin.map((m, i) => (
                <td
                  key={i}
                  className="py-2 px-3 text-right font-semibold"
                  style={{ color: marginColor(m) }}
                >
                  {pct(m)}
                </td>
              ))}
              <td
                className="py-2 px-3 text-right font-semibold"
                style={{ color: marginColor(pnl.marginPct) }}
              >
                {pct(pnl.marginPct)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[11px] text-[var(--text-faint)] mt-2">
          Memo: each prior year also carried a ฿248,962 rebate for the previous New
          Year, booked outside GOP. Hover a cost line to read its breakdown.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        {historyInsights.map((ins) => (
          <div key={ins.title} className="panel px-5 py-4">
            <h4 className="text-[13px] font-semibold gold-text mb-1.5">{ins.title}</h4>
            <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">
              {ins.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function sumGroup(key: CostGroupKey, yi: number) {
  return histGroupItems(key, yi).reduce((s, it) => s + it.value, 0);
}

function Row({
  label,
  values,
  plan,
  strong,
  tone,
}: {
  label: string;
  values: readonly number[];
  plan: number;
  strong?: boolean;
  tone?: "emerald" | "danger" | "gold";
}) {
  const color =
    tone === "emerald"
      ? "var(--emerald-bright)"
      : tone === "danger"
      ? "var(--danger)"
      : tone === "gold"
      ? "var(--gold-bright)"
      : "var(--text)";
  return (
    <tr className="border-t hairline">
      <td className={`py-2 pr-3 ${strong ? "font-semibold" : ""}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2 px-3 text-right text-[var(--text-dim)]">
          {thbShort(v)}
        </td>
      ))}
      <td
        className="py-2 px-3 text-right font-semibold"
        style={{ color }}
      >
        {thbShort(plan)}
      </td>
    </tr>
  );
}

function GroupRow({
  label,
  description,
  values,
  plan,
  items2025,
  items2026,
}: {
  gkey: CostGroupKey;
  label: string;
  description: string;
  values: number[];
  plan: number;
  items2025: { label: string; value: number }[];
  items2026: { label: string; value: number }[];
}) {
  return (
    <tr className="border-t hairline">
      <td className="py-2 pr-3">
        <HoverCard
          width={320}
          trigger={
            <span className="cursor-help border-b border-dotted border-[var(--border)]">
              {label}
            </span>
          }
          content={
            <div>
              <div className="text-[11.5px] text-[var(--text-dim)] leading-relaxed mb-2">
                {description}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)] mb-1">
                Breakdown · 2025 → 2026
              </div>
              <div className="space-y-0.5">
                {mergeItems(items2025, items2026).map((it, i) => (
                  <div key={i} className="flex justify-between gap-3 text-[11px]">
                    <span className="text-[var(--text-dim)] truncate">{it.label}</span>
                    <span className="text-[var(--text-faint)] shrink-0 tabular-nums">
                      {thbShort(it.v2025)} → {thbShort(it.v2026)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-2 px-3 text-right text-[var(--text-dim)]">
          {thbShort(v)}
        </td>
      ))}
      <td className="py-2 px-3 text-right font-semibold gold-text">
        {thbShort(plan)}
      </td>
    </tr>
  );
}

// Merge 2025 and 2026 sub-items by label for the hover breakdown.
function mergeItems(
  a: { label: string; value: number }[],
  b: { label: string; value: number }[]
) {
  const map = new Map<string, { label: string; v2025: number; v2026: number }>();
  for (const it of a)
    map.set(it.label, { label: it.label, v2025: it.value, v2026: 0 });
  for (const it of b) {
    const ex = map.get(it.label);
    if (ex) ex.v2026 = it.value;
    else map.set(it.label, { label: it.label, v2025: 0, v2026: it.value });
  }
  return [...map.values()].filter((x) => x.v2025 !== 0 || x.v2026 !== 0);
}

function Bench({
  label,
  value,
  sub,
  good,
}: {
  label: string;
  value: string;
  sub: string;
  good: boolean;
}) {
  return (
    <div className="panel px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="text-xl font-semibold mt-1">{value}</div>
      <div
        className="text-[11px] mt-0.5"
        style={{ color: good ? "var(--emerald-bright)" : "var(--danger)" }}
      >
        {good ? "▲" : "▼"} {sub}
      </div>
    </div>
  );
}

function marginColor(m: number) {
  if (m < 5) return "var(--danger)";
  if (m < 15) return "var(--warn)";
  return "var(--emerald-bright)";
}

function signed(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)} pts`;
}
