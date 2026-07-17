"use client";

import { useRef } from "react";
import { useDeck } from "@/store/useDeck";
import { lineupTotals } from "@/lib/analysis";
import { computePnL } from "@/lib/pnl";
import { COST_GROUPS, CostGroupKey } from "@/data/costStructure";
import { histGroupSubtotal, histSummary } from "@/data/history";
import { Waterfall } from "@/components/Waterfall";
import { HoverCard, InfoDot } from "@/components/HoverCard";
import { ExportSaveButtons } from "@/components/ExportSaveButtons";
import { MoneyInput } from "@/components/MoneyInput";
import { money, moneyShort, thbShort, pct, CURRENCIES } from "@/lib/format";
import { guestLabelFor } from "@/data/projectTemplates";
import Link from "next/link";
import { useProjectSlug } from "@/components/ProjectProvider";

export default function CostingPage() {
  const slug = useProjectSlug();
  const base = `/p/${slug}`;
  // The 2023–2025 historical benchmark is JW's own production actuals — it
  // only means anything on JW's project. Every other project simply plans
  // without a historical comparison until it has its own history.
  const isJW = slug === "jw-gala-garden-night";
  const contentRef = useRef<HTMLDivElement>(null);
  const financials = useDeck((s) => s.financials);
  const setTier = useDeck((s) => s.setTier);
  const setCostLine = useDeck((s) => s.setCostLine);
  const setCostLineLabel = useDeck((s) => s.setCostLineLabel);
  const addCostLine = useDeck((s) => s.addCostLine);
  const removeCostLine = useDeck((s) => s.removeCostLine);
  const resetFinancials = useDeck((s) => s.resetFinancials);
  const setCurrency = useDeck((s) => s.setCurrency);
  const lineup = useDeck((s) => s.lineup);
  const customActs = useDeck((s) => s.customActs);
  const myRole = useDeck((s) => s.myRole);
  const canWrite = myRole === "owner" || myRole === "editor";
  const meta = useDeck((s) => s.meta);
  const guestLabel = guestLabelFor(meta.eventType);

  const showActs = lineupTotals(lineup, customActs).totalCost;
  const pnl = computePnL(financials, showActs);
  const m = (n: number) => money(n, pnl.currency);
  const mShort = (n: number) => moneyShort(n, pnl.currency);

  const groupTotal = (k: CostGroupKey) =>
    pnl.groupTotals.find((g) => g.key === k)?.value ?? 0;

  // Per-day/function spend breakdown — only shown when at least one cost
  // line carries a day tag (e.g. Indian wedding functions); a flat single-day
  // project's costLines never have this field, so nothing changes for JW.
  const daySpend = new Map<number, number>();
  for (const l of financials.costLines) {
    if (l.day !== undefined) daySpend.set(l.day, (daySpend.get(l.day) ?? 0) + l.value);
  }
  const wholeEventSpend = financials.costLines
    .filter((l) => l.day === undefined)
    .reduce((s, l) => s + l.value, 0);

  return (
    <div ref={contentRef} className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="chip mb-2">Module 03b · Deep Dive</div>
          <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">
            2026 Costing Deep Dive
          </h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-2xl">
            The full cost structure on the five like-for-like line items. Edit any
            sub-item and watch GOP move in real time
            {isJW ? " — every line is benchmarked against the 2025 actual." : "."}
          </p>
        </div>
        <div className="flex gap-2 items-center" data-export-hide>
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--text-faint)]">
            Currency
            <select
              value={pnl.currency}
              disabled={!canWrite}
              onChange={(e) => setCurrency(e.target.value as typeof pnl.currency)}
              className="text-[12.5px]"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.symbol}
                </option>
              ))}
            </select>
          </label>
          <Link href={`${base}/revenue`} className="btn">
            ← Summary
          </Link>
          {canWrite && (
            <button onClick={resetFinancials} className="btn">
              Reset
            </button>
          )}
          <ExportSaveButtons
            targetRef={contentRef}
            filename={`${slug}-costing.pdf`}
            canWrite={canWrite}
          />
        </div>
      </div>

      {/* Live KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Kpi label="Revenue" value={m(pnl.totalRevenue)} tone="emerald" />
        <Kpi label="Total cost" value={m(pnl.totalCost)} tone="danger" />
        <Kpi
          label="GOP"
          value={m(pnl.grossProfit)}
          tone={pnl.grossProfit >= 0 ? "gold" : "danger"}
        />
        <Kpi label="GOP margin" value={pct(pnl.marginPct)} tone="gold" />
        <Kpi label={`Cost / ${guestLabel.replace(/s$/i, "").toLowerCase()}`} value={m(pnl.costPerGuest)} tone="emerald" />
      </section>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
        {/* Editors */}
        <fieldset disabled={!canWrite} className="space-y-3 border-0 p-0 m-0">
          {/* Package revenue */}
          <section className="panel px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold emerald-text">Package revenue</h3>
              <span className="text-[11px] text-[var(--text-faint)]">
                {pnl.pax} {guestLabel.toLowerCase()}
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
                <MoneyInput
                  value={t.priceTHB}
                  onChange={(v) => setTier(t.id, { priceTHB: v })}
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
              <span className="emerald-text">{m(pnl.totalRevenue)}</span>
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
                    {isJW && (
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
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold gold-text">
                      {mShort(plan)}
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
                      {showActs > 0 ? m(showActs) : "—"}
                    </span>
                    <Link
                      href={`${base}/builder`}
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
                    <MoneyInput
                      value={l.value}
                      onChange={(v) => setCostLine(l.id, v)}
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
        </fieldset>

        {/* Live results (sticky) */}
        <div className="lg:sticky lg:top-[72px] space-y-3">
          <section className="panel px-5 py-5">
            <h3 className="text-sm font-semibold gold-text mb-2">P&amp;L waterfall</h3>
            <Waterfall pnl={pnl} />
          </section>

          {daySpend.size > 0 && (
            <section className="panel px-5 py-5">
              <h3 className="text-sm font-semibold emerald-text mb-3">Spend by day</h3>
              <div className="space-y-1.5">
                {Array.from(daySpend.entries())
                  .sort((a, b) => a[0] - b[0])
                  .map(([day, value]) => (
                    <div key={day} className="flex justify-between items-center text-[12.5px]">
                      <span className="text-[var(--text-dim)]">Day {day}</span>
                      <span className="font-semibold">{m(value)}</span>
                    </div>
                  ))}
                {wholeEventSpend > 0 && (
                  <div className="flex justify-between items-center text-[12.5px] pt-1.5 mt-1 border-t hairline">
                    <span className="text-[var(--text-faint)]">Whole-event (not day-specific)</span>
                    <span className="font-semibold">{m(wholeEventSpend)}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {isJW && (
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
          )}

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
