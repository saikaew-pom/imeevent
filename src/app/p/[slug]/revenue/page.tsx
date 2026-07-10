"use client";

import { useRef, useState } from "react";
import { useDeck } from "@/store/useDeck";
import { lineupTotals } from "@/lib/analysis";
import { computePnL, PnL } from "@/lib/pnl";
import { COST_GROUPS } from "@/data/costStructure";
import { Waterfall } from "@/components/Waterfall";
import { HistorySection } from "@/components/revenue/HistorySection";
import { HoverCard } from "@/components/HoverCard";
import { ExportSaveButtons } from "@/components/ExportSaveButtons";
import { thb, thbShort, pct } from "@/lib/format";
import Link from "next/link";
import { useProjectSlug } from "@/components/ProjectProvider";

export default function RevenuePage() {
  const base = `/p/${useProjectSlug()}`;
  const contentRef = useRef<HTMLDivElement>(null);
  const financials = useDeck((s) => s.financials);
  const setTier = useDeck((s) => s.setTier);
  const addTier = useDeck((s) => s.addTier);
  const removeTier = useDeck((s) => s.removeTier);
  const resetFinancials = useDeck((s) => s.resetFinancials);
  const lineup = useDeck((s) => s.lineup);
  const customActs = useDeck((s) => s.customActs);
  const myRole = useDeck((s) => s.myRole);
  const canWrite = myRole === "owner" || myRole === "editor";
  const primary = financials.tiers[0];

  const showActs = lineupTotals(lineup, customActs).totalCost;
  const pnl = computePnL(financials, showActs);

  const [scenarios, setScenarios] = useState<{ name: string; pnl: PnL }[]>([]);
  const snapshot = () => {
    const name = String.fromCharCode(65 + scenarios.length);
    setScenarios((s) => (s.length >= 3 ? s : [...s, { name, pnl }]));
  };

  return (
    <div ref={contentRef} className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="chip mb-2">Module 03 · Revenue vs Costing</div>
          <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">
            Revenue Simulator
          </h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-2xl">
            Package revenue, cost by line item, and margin — benchmarked against the
            2023–2025 actuals. Edit the full cost structure in the{" "}
            <Link href={`${base}/costing`} className="emerald-text hover:underline">
              Costing deep dive
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2" data-export-hide>
          {canWrite && (
            <button onClick={resetFinancials} className="btn">
              Reset assumptions
            </button>
          )}
          <ExportSaveButtons
            targetRef={contentRef}
            filename="jw-gala-revenue.pdf"
            canWrite={canWrite}
          />
        </div>
      </div>

      {/* KPI row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="Total revenue" value={thb(pnl.totalRevenue)} tone="emerald" />
        <Kpi label="Total cost" value={thb(pnl.totalCost)} tone="danger" />
        <Kpi
          label="Gross profit"
          value={thb(pnl.grossProfit)}
          tone={pnl.grossProfit >= 0 ? "gold" : "danger"}
        />
        <Kpi label="GOP margin" value={pct(pnl.marginPct)} tone="gold" />
      </section>

      <div className="grid lg:grid-cols-[380px_1fr] gap-4 items-start">
        {/* Inputs */}
        <section className="panel px-5 py-5 space-y-4">
          {/* Package tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold emerald-text">Package tiers</h3>
              <span className="text-[11px] text-[var(--text-faint)]">
                {pnl.pax} guests · {thb(pnl.totalRevenue)}
              </span>
            </div>
            <fieldset disabled={!canWrite} className="space-y-2 border-0 p-0 m-0">
              <div className="grid grid-cols-[1fr_84px_58px_24px] gap-2 text-[10px] uppercase tracking-wide text-[var(--text-faint)] px-1">
                <span>Package</span>
                <span className="text-right">Price</span>
                <span className="text-right">Qty</span>
                <span />
              </div>
              {financials.tiers.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_84px_58px_24px] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => setTier(t.id, { name: e.target.value })}
                    className="text-[12.5px]"
                  />
                  <input
                    type="number"
                    value={t.priceTHB}
                    onChange={(e) => setTier(t.id, { priceTHB: Number(e.target.value) })}
                    className="text-right text-[12.5px]"
                  />
                  <input
                    type="number"
                    value={t.qty}
                    onChange={(e) => setTier(t.id, { qty: Number(e.target.value) })}
                    className="text-right text-[12.5px]"
                  />
                  <button
                    onClick={() => removeTier(t.id)}
                    disabled={financials.tiers.length <= 1}
                    className="text-[var(--text-faint)] hover:text-[var(--danger)] disabled:opacity-25 text-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addTier}
                className="text-[12px] emerald-text hover:underline mt-1"
              >
                + Add package tier
              </button>
              <p className="text-[11px] text-[var(--text-faint)] pt-1">
                Add or remove tiers to model your package structure.
              </p>
            </fieldset>
          </div>

          {/* Cost summary by line item (read-only, edit in deep dive) */}
          <div className="pt-3 border-t hairline">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                Cost by line item
              </h3>
              <Link href={`${base}/costing`} className="text-[11px] emerald-text hover:underline">
                edit →
              </Link>
            </div>
            <div className="space-y-1.5">
              {COST_GROUPS.map((g) => {
                const val = pnl.groupTotals.find((x) => x.key === g.key)?.value ?? 0;
                return (
                  <div
                    key={g.key}
                    className="flex items-center justify-between text-[12.5px]"
                  >
                    <HoverCard
                      width={280}
                      trigger={
                        <span className="text-[var(--text-dim)] cursor-help border-b border-dotted border-[var(--border)]">
                          {g.label}
                        </span>
                      }
                      content={
                        <span className="text-[11.5px] text-[var(--text-dim)] leading-relaxed">
                          {g.description}
                        </span>
                      }
                    />
                    <span className="tabular-nums">{thbShort(val)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-[12.5px] pt-1.5 border-t hairline font-semibold">
                <span>Total cost</span>
                <span className="tabular-nums" style={{ color: "var(--danger)" }}>
                  {thb(pnl.totalCost)}
                </span>
              </div>
            </div>
            {showActs > 0 && (
              <p className="text-[11px] text-[var(--text-faint)] pt-2">
                Includes {thb(showActs)} show acts from your{" "}
                <Link href={`${base}/builder`} className="emerald-text hover:underline">
                  lineup
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        {/* Outputs */}
        <div className="space-y-4">
          <section className="panel px-5 py-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold gold-text">P&amp;L waterfall</h3>
              <span className="text-[11px] text-[var(--text-faint)]">
                {pnl.pax} guests · {thb(pnl.revenuePerGuest)}/guest revenue
              </span>
            </div>
            <Waterfall pnl={pnl} />
          </section>

          {/* what-if sliders */}
          <section className="panel px-5 py-5">
            <h3 className="text-sm font-semibold emerald-text mb-3">
              What-if · {primary?.name ?? "primary tier"}
            </h3>
            {primary && (
              <fieldset disabled={!canWrite} className="border-0 p-0 m-0">
                <Slider
                  label={`${primary.name} guests`}
                  min={0}
                  max={350}
                  value={primary.qty}
                  onChange={(v) => setTier(primary.id, { qty: v })}
                  display={String(primary.qty)}
                />
                <Slider
                  label={`${primary.name} price`}
                  min={8000}
                  max={30000}
                  step={500}
                  value={primary.priceTHB}
                  onChange={(v) => setTier(primary.id, { priceTHB: v })}
                  display={thbShort(primary.priceTHB)}
                />
              </fieldset>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <MiniStat label="Cost / guest" value={thb(pnl.costPerGuest)} />
              <MiniStat
                label={`Break-even ${pnl.primaryTierName.toLowerCase()}`}
                value={Math.ceil(pnl.breakEvenQty).toString()}
              />
              <MiniStat label="Ent. % of rev" value={pct(pnl.entertainmentPctRev)} />
            </div>
          </section>

          {/* Scenarios */}
          <section className="panel px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold gold-text">Scenario compare</h3>
              <div className="flex gap-2">
                <button
                  className="btn py-1.5 px-3 text-[12px]"
                  onClick={snapshot}
                  disabled={scenarios.length >= 3}
                >
                  + Snapshot current
                </button>
                {scenarios.length > 0 && (
                  <button
                    className="btn py-1.5 px-3 text-[12px]"
                    onClick={() => setScenarios([])}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {scenarios.length === 0 ? (
              <p className="text-[12px] text-[var(--text-faint)]">
                Snapshot the current model, change the lineup or assumptions, then
                snapshot again to compare up to three scenarios side by side.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[var(--text-faint)] text-left">
                      <th className="font-medium py-1.5 pr-3">Metric</th>
                      {scenarios.map((s) => (
                        <th key={s.name} className="font-semibold gold-text py-1.5 px-3">
                          {s.name}
                        </th>
                      ))}
                      <th className="font-semibold emerald-text py-1.5 px-3">Live</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Revenue", (x: PnL) => thb(x.totalRevenue)],
                        ["Entertainment", (x: PnL) => thb(x.entertainment)],
                        ["Total cost", (x: PnL) => thb(x.totalCost)],
                        ["Gross profit", (x: PnL) => thb(x.grossProfit)],
                        ["Margin", (x: PnL) => pct(x.marginPct)],
                      ] as [string, (x: PnL) => string][]
                    ).map(([label, fn], ri) => (
                      <tr key={ri} className="border-t hairline">
                        <td className="py-1.5 pr-3 text-[var(--text-dim)]">{label}</td>
                        {scenarios.map((s) => (
                          <td key={s.name} className="py-1.5 px-3">
                            {fn(s.pnl)}
                          </td>
                        ))}
                        <td className="py-1.5 px-3 emerald-text">{fn(pnl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-faint)] mt-6">
        All figures are planning estimates. Package price/qty and the full cost
        structure are editable; costs seed off the 2025 actuals.
      </p>

      {/* Historical benchmark */}
      <div className="mt-10 pt-8 border-t hairline">
        <HistorySection />
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
    <div className="panel px-4 py-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="text-xl md:text-2xl font-semibold mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[var(--text-dim)]">{label}</span>
        <span className="gold-text font-semibold">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
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
