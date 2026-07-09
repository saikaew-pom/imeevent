"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDeck } from "@/store/useDeck";
import { eventMeta } from "@/data/runOfShow";
import { EnergyCurve, CurvePoint } from "@/components/EnergyCurve";
import { curvePoints, lineupTotals, orderedLineup } from "@/lib/analysis";
import { liveBeatEnergy } from "@/lib/programEnergy";
import { computePnL } from "@/lib/pnl";
import { finaleConcepts, goldenBloom } from "@/data/finale";
import { thb, pct } from "@/lib/format";

export default function PresentPage() {
  const [i, setI] = useState(0);
  const lineup = useDeck((s) => s.lineup);
  const financials = useDeck((s) => s.financials);
  const program = useDeck((s) => s.program);
  const customActs = useDeck((s) => s.customActs);

  const totals = lineupTotals(lineup, customActs);
  const pnl = computePnL(financials, totals.totalCost);
  const ordered = orderedLineup(lineup, customActs);

  const flowPoints: CurvePoint[] = program.map((b) => ({
    label: b.time,
    energy: liveBeatEnergy(b, customActs),
    highlight: Boolean(b.peak),
  }));
  const myPoints = curvePoints(lineup, customActs);

  const slides = [
    // 0 — Title
    <Slide key="title" center>
      <div className="chip mb-6">{eventMeta.venue} · NYE 2026</div>
      <h1 className="font-display italic text-5xl md:text-7xl gold-gradient leading-[1.05] mb-5">
        JW Gala Garden Night
      </h1>
      <p className="text-lg text-[var(--text-dim)] max-w-2xl">
        {eventMeta.date} · {eventMeta.timing}
      </p>
      <p className="text-[14px] text-[var(--text-faint)] mt-2">
        {eventMeta.guests} · {eventMeta.theme}
      </p>
    </Slide>,

    // 1 — Concept + flow curve
    <Slide key="flow">
      <SlideTitle kicker="The concept" title="One rising curve, four peaks" />
      <p className="text-[15px] text-[var(--text-dim)] max-w-4xl leading-relaxed mb-6">
        {eventMeta.concept}
      </p>
      <div className="panel px-6 py-6">
        <EnergyCurve points={flowPoints} height={300} compact />
      </div>
    </Slide>,

    // 2 — The show / lineup
    <Slide key="lineup">
      <SlideTitle
        kicker="The show"
        title={
          ordered.length > 0
            ? `${totals.count}-act lineup · ${totals.totalDuration} min on stage`
            : "Build a lineup to present it here"
        }
      />
      {ordered.length > 0 ? (
        <>
          <div className="panel px-6 py-5 mb-4">
            <EnergyCurve points={myPoints} height={230} compact />
          </div>
          <div className="flex flex-wrap gap-2">
            {ordered.map((o) => (
              <span key={o.uid} className="chip">
                {o.act.name}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[var(--text-faint)]">
          Head to the Show &amp; Decor Builder and generate a lineup — it appears
          here live.
        </p>
      )}
    </Slide>,

    // 3 — Finale
    <Slide key="finale">
      <SlideTitle kicker="The finale" title={goldenBloom.title} />
      <div className="grid md:grid-cols-2 gap-6 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finaleConcepts[1].image}
          alt="Golden Bloom"
          className="w-full rounded-2xl border hairline"
        />
        <div>
          <p className="text-[15px] text-[var(--text-dim)] leading-relaxed mb-4">
            {goldenBloom.concept}
          </p>
          <ul className="space-y-1.5">
            {goldenBloom.successCriteria.slice(0, 3).map((s) => (
              <li key={s} className="flex gap-2 text-[13px] text-[var(--text-dim)]">
                <span className="emerald-text">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Slide>,

    // 4 — Numbers
    <Slide key="numbers">
      <SlideTitle kicker="The numbers" title="Revenue model at a glance" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigStat label="Revenue" value={thb(pnl.totalRevenue)} tone="emerald" />
        <BigStat label="Total cost" value={thb(pnl.totalCost)} tone="danger" />
        <BigStat label="Gross profit" value={thb(pnl.grossProfit)} tone="gold" />
        <BigStat label="Margin" value={pct(pnl.marginPct)} tone="gold" />
      </div>
      <p className="text-[13px] text-[var(--text-faint)] mt-6">
        {pnl.pax} guests · entertainment {thb(pnl.entertainment)} (
        {pct(pnl.entertainmentPctRev)} of revenue) · break-even at{" "}
        {Math.ceil(pnl.breakEvenQty)} {pnl.primaryTierName.toLowerCase()}. Planning
        estimates — costs are editable placeholders.
      </p>
    </Slide>,
  ];

  const n = slides.length;
  const go = useCallback(
    (d: number) => setI((x) => Math.max(0, Math.min(n - 1, x + d))),
    [n]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex-1 overflow-y-auto">{slides[i]}</div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t hairline">
        <Link href="/" className="btn py-1.5 px-3 text-[12px]">
          ✕ Exit
        </Link>
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: idx === i ? "var(--gold-bright)" : "var(--border)",
                width: idx === i ? 20 : 8,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn py-1.5 px-3" onClick={() => go(-1)} disabled={i === 0}>
            ←
          </button>
          <span className="text-[12px] text-[var(--text-faint)] w-10 text-center">
            {i + 1}/{n}
          </span>
          <button
            className="btn btn-gold py-1.5 px-3"
            onClick={() => go(1)}
            disabled={i === n - 1}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function Slide({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`mx-auto max-w-[1200px] px-8 py-12 min-h-full flex flex-col fade-up ${
        center ? "items-center justify-center text-center" : "justify-center"
      }`}
    >
      {children}
    </div>
  );
}

function SlideTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[12px] uppercase tracking-widest emerald-text mb-2">
        {kicker}
      </div>
      <h2 className="font-display italic text-3xl md:text-5xl gold-gradient leading-tight">
        {title}
      </h2>
    </div>
  );
}

function BigStat({
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
    <div className="panel px-5 py-6">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-semibold mt-2" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
