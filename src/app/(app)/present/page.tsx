"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useDeck } from "@/store/useDeck";
import { eventMeta, Beat } from "@/data/runOfShow";
import { EnergyCurve, CurvePoint } from "@/components/EnergyCurve";
import { curvePoints, lineupTotals, orderedLineup } from "@/lib/analysis";
import { liveBeatEnergy } from "@/lib/programEnergy";
import { computePnL } from "@/lib/pnl";
import { finaleConcepts, goldenBloom } from "@/data/finale";
import { thb, pct } from "@/lib/format";
import { findAct, Act, PLACEHOLDER_PHOTO } from "@/data/acts";
import { Slide as SlideData } from "@/data/slides";
import { SlideEditorModal } from "@/components/present/SlideEditorModal";

const PROJECT_SLUG = "jw-gala-garden-night";

const EXPORT_WIDTH = 1280;
const EXPORT_HEIGHT = 720;

export default function PresentPage() {
  const [i, setI] = useState(0);
  const [exporting, setExporting] = useState(false);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineup = useDeck((s) => s.lineup);
  const financials = useDeck((s) => s.financials);
  const program = useDeck((s) => s.program);
  const customActs = useDeck((s) => s.customActs);
  const presentation = useDeck((s) => s.presentation);
  const myRole = useDeck((s) => s.myRole);
  const generateSlide = useDeck((s) => s.generateSlide);
  const updateSlide = useDeck((s) => s.updateSlide);
  const removeSlide = useDeck((s) => s.removeSlide);
  const slideGenerating = useDeck((s) => s.slideGenerating);
  const canWrite = myRole === "owner" || myRole === "editor";

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

    // 3+ — One slide per Event Flow beat, AI-drafted (or a live fallback
    // built straight from the beat's own fields until generated).
    ...program.map((beat) => {
      const slide = presentation.find((s) => s.beatId === beat.id);
      return (
        <BeatSlide
          key={beat.id}
          beat={beat}
          slide={slide}
          customActs={customActs}
          canWrite={canWrite}
          generating={slideGenerating === beat.id}
          onGenerate={() => generateSlide(PROJECT_SLUG, beat.id)}
          onSave={(patch) => {
            if (slide) {
              updateSlide(slide.id, patch);
            } else {
              updateSlide(`beat-${beat.id}`, { ...patch, beatId: beat.id });
            }
          }}
          onReset={slide ? () => removeSlide(slide.id) : undefined}
        />
      );
    }),

    // Finale
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

    // Numbers
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

  // Keep the current index in range if the beat count changes underneath us.
  useEffect(() => {
    setI((x) => Math.min(x, n - 1));
  }, [n]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const [{ toJpeg }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [EXPORT_WIDTH, EXPORT_HEIGHT],
      });
      for (let idx = 0; idx < n; idx++) {
        const node = exportRefs.current[idx];
        if (!node) continue;
        const dataUrl = await toJpeg(node, {
          width: EXPORT_WIDTH,
          height: EXPORT_HEIGHT,
          quality: 0.92,
          pixelRatio: 1.5,
        });
        if (idx > 0) pdf.addPage([EXPORT_WIDTH, EXPORT_HEIGHT], "landscape");
        pdf.addImage(dataUrl, "JPEG", 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
      }
      pdf.save("jw-gala-garden-night-presentation.pdf");
    } catch {
      alert("PDF export failed — try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Off-screen full render of every slide, at a fixed export size, used
          only to rasterize each page into the exported PDF. */}
      <div style={{ position: "fixed", top: -99999, left: 0, pointerEvents: "none" }}>
        {slides.map((slideEl, idx) => (
          <div
            key={idx}
            ref={(el) => {
              exportRefs.current[idx] = el;
            }}
            style={{
              width: EXPORT_WIDTH,
              height: EXPORT_HEIGHT,
              overflow: "hidden",
              background: "var(--bg)",
            }}
          >
            {slideEl}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">{slides[i]}</div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t hairline">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="btn py-1.5 px-3 text-[12px]">
            ✕ Exit
          </Link>
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="btn py-1.5 px-3 text-[12px] disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "⬇ Export PDF"}
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap max-w-[50%] justify-center">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className="w-2 h-2 rounded-full transition-all shrink-0"
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

function hasRealPhoto(a: Act): boolean {
  return Boolean(a.photo) && a.photo !== PLACEHOLDER_PHOTO;
}

function BeatSlide({
  beat,
  slide,
  customActs,
  canWrite,
  generating,
  onGenerate,
  onSave,
  onReset,
}: {
  beat: Beat;
  slide?: SlideData;
  customActs: Act[];
  canWrite: boolean;
  generating: boolean;
  onGenerate: () => void;
  onSave: (patch: Partial<SlideData>) => void;
  onReset?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const linkedActs = (beat.linkedActs ?? [])
    .map((id) => findAct(id, customActs))
    .filter((a): a is Act => Boolean(a));

  const title = slide?.title ?? beat.segment;
  const subtitle = slide?.subtitle ?? `${beat.time} · ${beat.location}`;
  const body = slide?.body ?? beat.what;
  const image = slide?.imageUrl ?? beat.media?.photo ?? linkedActs.find(hasRealPhoto)?.photo;

  return (
    <Slide>
      <div className="flex items-start justify-between gap-4 mb-2">
        <SlideTitle kicker={`Run of show · ${beat.time}`} title={title} />
        {canWrite && (
          <div className="flex gap-2 shrink-0 pt-1">
            <button
              onClick={onGenerate}
              disabled={generating}
              className="btn py-1.5 px-3 text-[12px] disabled:opacity-50"
            >
              {generating ? "Generating…" : slide?.aiGenerated ? "↻ Regenerate" : "✦ Generate with AI"}
            </button>
            <button onClick={() => setEditing(true)} className="btn py-1.5 px-3 text-[12px]">
              ✎ Edit
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="btn py-1.5 px-3 text-[12px] hover:text-[var(--danger)]"
              >
                ↺ Reset
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-[13px] emerald-text mb-4">{subtitle}</p>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="w-full rounded-2xl border hairline" />
        )}
        <div className={image ? "" : "md:col-span-2"}>
          {body && (
            <p className="text-[15px] text-[var(--text-dim)] leading-relaxed mb-4">{body}</p>
          )}
          {linkedActs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkedActs.map((a) => (
                <span key={a.id} className="chip">
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <SlideEditorModal
          initial={{ title, subtitle, body, imageUrl: image }}
          onClose={() => setEditing(false)}
          onSave={onSave}
        />
      )}
    </Slide>
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
