"use client";

import { useDeck } from "@/store/useDeck";
import { lineupTotals } from "@/lib/analysis";
import { computePnL } from "@/lib/pnl";
import { COST_GROUPS, CostGroupKey } from "@/data/costStructure";
import { histGroupSubtotal, histSummary } from "@/data/history";
import { Waterfall } from "@/components/Waterfall";
import { HoverCard, InfoDot } from "@/components/HoverCard";
import { thb, thbShort, pct } from "@/lib/format";
import Link from "next/link";

export default function CostingPage() {
  const financials = useDeck((s) => s.financials);
  const setTier = useDeck((s) => s.setTier);
  const setCostLine = useDeck((s) => s.setCostLine);
  const setCostLineLabel = useDeck((s) => s.setCostLineLabel);
  const addCostLine = useDeck((s) => s.addCostLine);
  const removeCostLine = useDeck((s) => s.removeCostLine);
  const resetFinancials = useDeck((s) => s.resetFinancials);
  const lineup = useDeck((s) => s.lineup);
  const customActs = useDeck((s) => s.customActs);

  const showActs = lineupTotals(lineup, customActs).totalCost;
  const pnl = computePnL(financials, showActs);

  const groupTotal = (k: CostGroupKey) =>
    pnl.groupTotals.find((g) => g.key === k)?.value ?? 0;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="chip mb-2">Module 03b · Deep Dive</div>
          <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">
            2026 Costing Deep Dive
          </h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-2xl">
            The full cost structure on the five like-for-like line items. Edit any
            sub-item and watch GOP move in real time — every line is benchmarked
            against the 2025 actual.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/revenue" className="btn">
            ← Summary
          </Link>
          <button onClick={resetFinancials} className="btn">
            Reset
          </button>
        </div>
      </div>

      {/* Live KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Kpi label="Revenue" value={thb(pnl.totalRevenue)} tone="emerald" />
        <Kpi label="Total cost" value={thb(pnl.totalCost)} tone="danger" />
        <Kpi
          label="GOP"
          value={thb(pnl.grossProfit)}
          tone={pnl.grossProfit >= 0 ? "gold" : "danger"}
        />
        <Kpi label="GOP margin" value={pct(pnl.marginPct)} tone="gold" />
        <Kpi label="Cost / guest" value={thb(pnl.costPerGuest)} tone="emerald" />
      </section>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
        {/* Editors */}
        <div className="space-y-3">
          {/* Package revenue */}
          <section className="panel px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold emerald-text">Package revenue</h3>
              <span className="text-[11px] text-[var(--text-faint)]">
                {pnl.pax} guests
              </span>
            </div>
            <div className="grid grid-cols-[1fr_100px_70px] gap-2 text-[10px] uppercase tracking-wide text-[var(--text-faint)] px-1 mb-1">
              <span>Package</span>
              <span className="text-right">Price</span>
              <span className="text-right">Qty</span>
            </div>
            {financials.tiers.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_100px_70px] gap-2 items-center mb-2"
              >
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => setTier(t.id, { name: e.target.value })}
                  className="text-[13px]"
                />
                <input
                  type="number"
                  value={t.priceTHB}
                  onChange={(e) => setTier(t.id, { priceTHB: Number(e.target.value) })}
                  className="text-right text-[13px]"
                />
                <input
                  type="number"
                  value={t.qty}
                  onChange={(e) => setTier(t.id, { qty: Number(e.target.value) })}
                  className="text-right text-[13px]"
                />
              </div>
            ))}
            <div className="flex justify-between text-[13px] pt-2 border-t hairline font-semibold">
              <span>Total revenue</span>
              <span className="emerald-text">{thb(pnl.totalRevenue)}</span>
            </div>
          </section>

          {/* Cost groups */}
          {COST_GROUPS.map((g) => {
            const lines = financials.costLines.filter((l) => l.group === g.key);
            const plan = groupTotal(g.key);
            const actual2025 = histGroupSubtotal(g.key, 2);
            const delta = plan - actual2025;
            return (
              <section key={g.key} className="panel px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center">
                      <HoverCard
                        width={300}
                        trigger={
                          <h3 className="text-sm font-semibold cursor-help border-b border-dotted border-[var(--border)]">
                            {g.label}
                          </h3>
                        }
                        content={
                          <span className="text-[11.5px] text-[var(--text-dim)] leading-relaxed">
                            {g.description}
                          </span>
                        }
                      />
                    </div>
                    <div className="text-[11px] text-[var(--text-faint)] mt-1">
                      2025 actual {thbShort(actual2025)} ·{" "}
                      <span
                        style={{
                          color: delta > 0 ? "var(--danger)" : "var(--emerald-bright)",
                        }}
                      >
                        {delta >= 0 ? "+" : ""}
                        {thbShort(delta)} vs plan
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold gold-text">
                      {thbShort(plan)}
                    </div>
                    <div className="text-[10px] text-[var(--text-faint)]">
                      {pct(pnl.totalCost ? (plan / pnl.totalCost) * 100 : 0)} of cost
                    </div>
                  </div>
                </div>

                {/* synced show-acts line for production */}
                {g.key === "production" && (
                  <div className="grid grid-cols-[1fr_120px_24px] gap-2 items-center mb-1.5">
                    <span className="text-[12.5px] text-[var(--text-dim)] flex items-center">
                      Show acts (from lineup)
                      <InfoDot
                        width={240}
                        text="Live sum of the acts in your Entertainment Builder. Edit it on the Builder page."
                      />
                    </span>
                    <span className="text-right text-[12.5px] text-[var(--text-faint)] tabular-nums pr-2">
                      {showActs > 0 ? thb(showActs) : "—"}
                    </span>
                    <Link
                      href="/builder"
                      className="text-[11px] emerald-text text-center hover:underline"
                      title="Edit lineup"
                    >
                      ↗
                    </Link>
                  </div>
                )}

                {lines.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[1fr_120px_24px] gap-2 items-center mb-1.5"
                  >
                    <span className="flex items-center min-w-0">
                      <input
                        type="text"
                        value={l.label}
                        onChange={(e) => setCostLineLabel(l.id, e.target.value)}
                        className="text-[12.5px] w-full"
                        style={{ border: "none", background: "transparent", padding: "2px 0" }}
                      />
                      {l.note && <InfoDot text={l.note} />}
                    </span>
                    <input
                      type="number"
                      value={l.value}
                      onChange={(e) => setCostLine(l.id, Number(e.target.value))}
                      className="text-right text-[12.5px]"
                    />
                    <button
                      onClick={() => removeCostLine(l.id)}
                      className="text-[var(--text-faint)] hover:text-[var(--danger)] text-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addCostLine(g.key)}
                  className="text-[11px] emerald-text hover:underline mt-1"
                >
                  + Add line
                </button>
              </section>
            );
          })}
        </div>

        {/* Live results (sticky) */}
        <div className="lg:sticky lg:top-[72px] space-y-3">
          <section className="panel px-5 py-5">
            <h3 className="text-sm font-semibold gold-text mb-2">P&amp;L waterfall</h3>
            <Waterfall pnl={pnl} />
          </section>

          <section className="panel px-5 py-5">
            <h3 className="text-sm font-semibold emerald-text mb-3">
              Plan vs 2025 actual
            </h3>
            <CompareRow label="Revenue" plan={pnl.totalRevenue} actual={histSummary.revenue[2]} higherIsGood />
            <CompareRow label="Operating cost" plan={pnl.operatingCost} actual={histSummary.operatingCost[2]} />
            <CompareRow label="F&B cost" plan={pnl.fnbCost} actual={histSummary.fnbCost[2]} />
            <CompareRow label="Total cost" plan={pnl.totalCost} actual={histSummary.totalCost[2]} />
            <CompareRow label="GOP" plan={pnl.grossProfit} actual={histSummary.gop[2]} higherIsGood />
            <div className="flex justify-between items-center pt-2 mt-1 border-t hairline">
              <span className="text-[12px] text-[var(--text-dim)]">GOP margin</span>
              <span className="text-[13px]">
                <span className="font-semibold" style={{ color: marginColor(pnl.marginPct) }}>
                  {pct(pnl.marginPct)}
                </span>
                <span className="text-[var(--text-faint)]">
                  {" "}
                  vs {pct(histSummary.margin[2])}
                </span>
              </span>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <MiniStat
              label={`Break-even ${pnl.primaryTierName.toLowerCase()}`}
              value={Math.ceil(pnl.breakEvenQty).toString()}
            />
            <MiniStat label="Ent. % of rev" value={pct(pnl.entertainmentPctRev)} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "gold" | "danger";
}) {
  const color =
    tone === "emerald"
      ? "var(--emerald-bright)"
      : tone === "gold"
      ? "var(--gold-bright)"
      : "var(--danger)";
  return (
    <div className="panel px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="text-lg md:text-xl font-semibold mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function CompareRow({
  label,
  plan,
  actual,
  higherIsGood,
}: {
  label: string;
  plan: number;
  actual: number;
  higherIsGood?: boolean;
}) {
  const delta = plan - actual;
  const good = higherIsGood ? delta >= 0 : delta <= 0;
  return (
    <div className="flex justify-between items-center py-1 text-[12.5px]">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="flex items-center gap-2">
        <span className="tabular-nums">{thbShort(plan)}</span>
        <span
          className="text-[10px] tabular-nums w-16 text-right"
          style={{ color: good ? "var(--emerald-bright)" : "var(--danger)" }}
        >
          {delta >= 0 ? "+" : ""}
          {thbShort(delta)}
        </span>
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-2 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="text-[15px] font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function marginColor(m: number) {
  if (m < 5) return "var(--danger)";
  if (m < 15) return "var(--warn)";
  return "var(--emerald-bright)";
}
