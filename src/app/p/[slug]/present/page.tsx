"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useDeck, LineupItem } from "@/store/useDeck";
import { Beat } from "@/data/runOfShow";
import { EnergyCurve, CurvePoint } from "@/components/EnergyCurve";
import { curvePoints, lineupTotals, orderedLineup } from "@/lib/analysis";
import { liveBeatEnergy } from "@/lib/programEnergy";
import { computePnL, PnL } from "@/lib/pnl";
import { finaleConcepts, goldenBloom } from "@/data/finale";
import { thb, pct } from "@/lib/format";
import { findAct, Act, PLACEHOLDER_PHOTO } from "@/data/acts";
import { Slide as SlideData } from "@/data/slides";
import { SlideEditorModal } from "@/components/present/SlideEditorModal";
import { useProject, useProjectSlug } from "@/components/ProjectProvider";

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
  const generateStaticSlide = useDeck((s) => s.generateStaticSlide);
  const generateAllSlides = useDeck((s) => s.generateAllSlides);
  const updateSlide = useDeck((s) => s.updateSlide);
  const removeSlide = useDeck((s) => s.removeSlide);
  const slideGenerating = useDeck((s) => s.slideGenerating);
  const slideBatchProgress = useDeck((s) => s.slideBatchProgress);
  const hiddenSlides = useDeck((s) => s.hiddenSlides);
  const hideSlide = useDeck((s) => s.hideSlide);
  const restoreSlide = useDeck((s) => s.restoreSlide);
  const restoreAllSlides = useDeck((s) => s.restoreAllSlides);
  const canWrite = myRole === "owner" || myRole === "editor";
  const PROJECT_SLUG = useProjectSlug();
  const [showHidden, setShowHidden] = useState(false);
  const [confirmingRegenerateAll, setConfirmingRegenerateAll] = useState(false);

  const totals = lineupTotals(lineup, customActs);
  const pnl = computePnL(financials, totals.totalCost);
  const ordered = orderedLineup(lineup, customActs);

  const flowPoints: CurvePoint[] = program.map((b) => ({
    label: b.time,
    energy: liveBeatEnergy(b, customActs),
    highlight: Boolean(b.peak),
  }));
  const myPoints = curvePoints(lineup, customActs);

  // Every slide (static or per-beat) carries a stable key + label so it can
  // be individually hidden from the deck (and restored later) without
  // touching its underlying data.
  const rawSlides: { key: string; label: string; node: React.ReactNode }[] = [
    {
      key: "title",
      label: "Title",
      node: (
        <TitleSlide
          slide={presentation.find((s) => s.id === "title")}
          canWrite={canWrite}
          generating={slideGenerating === "title"}
          onGenerate={() => generateStaticSlide(PROJECT_SLUG, "title")}
          onSave={(patch) => updateSlide("title", patch)}
          onReset={
            presentation.find((s) => s.id === "title") ? () => removeSlide("title") : undefined
          }
        />
      ),
    },
    {
      key: "flow",
      label: "Concept",
      node: (
        <ConceptSlide
          slide={presentation.find((s) => s.id === "flow")}
          flowPoints={flowPoints}
          canWrite={canWrite}
          generating={slideGenerating === "flow"}
          onGenerate={() => generateStaticSlide(PROJECT_SLUG, "flow")}
          onSave={(patch) => updateSlide("flow", patch)}
          onReset={
            presentation.find((s) => s.id === "flow") ? () => removeSlide("flow") : undefined
          }
        />
      ),
    },
    {
      key: "lineup",
      label: "Lineup",
      node: (
        <LineupSlide
          slide={presentation.find((s) => s.id === "lineup")}
          ordered={ordered}
          totals={totals}
          myPoints={myPoints}
          canWrite={canWrite}
          generating={slideGenerating === "lineup"}
          onGenerate={() => generateStaticSlide(PROJECT_SLUG, "lineup")}
          onSave={(patch) => updateSlide("lineup", patch)}
          onReset={
            presentation.find((s) => s.id === "lineup") ? () => removeSlide("lineup") : undefined
          }
        />
      ),
    },
    // One slide per Event Flow beat, AI-drafted (or a live fallback built
    // straight from the beat's own fields until generated).
    ...program.map((beat) => {
      const slide = presentation.find((s) => s.beatId === beat.id);
      return {
        key: `beat-${beat.id}`,
        label: beat.segment,
        node: (
          <BeatSlide
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
        ),
      };
    }),
    {
      key: "finale",
      label: "Finale",
      node: (
        <FinaleSlide
          slide={presentation.find((s) => s.id === "finale")}
          canWrite={canWrite}
          generating={slideGenerating === "finale"}
          onGenerate={() => generateStaticSlide(PROJECT_SLUG, "finale")}
          onSave={(patch) => updateSlide("finale", patch)}
          onReset={
            presentation.find((s) => s.id === "finale") ? () => removeSlide("finale") : undefined
          }
        />
      ),
    },
    {
      key: "numbers",
      label: "Numbers",
      node: (
        <NumbersSlide
          slide={presentation.find((s) => s.id === "numbers")}
          pnl={pnl}
          canWrite={canWrite}
          generating={slideGenerating === "numbers"}
          onGenerate={() => generateStaticSlide(PROJECT_SLUG, "numbers")}
          onSave={(patch) => updateSlide("numbers", patch)}
          onReset={
            presentation.find((s) => s.id === "numbers")
              ? () => removeSlide("numbers")
              : undefined
          }
        />
      ),
    },
  ];

  const visibleSlides = rawSlides.filter((s) => !hiddenSlides.includes(s.key));
  const hiddenList = rawSlides.filter((s) => hiddenSlides.includes(s.key));
  const slides = visibleSlides.map((s) => (
    <SlideChrome key={s.key} slideKey={s.key} canWrite={canWrite} onDelete={hideSlide}>
      {s.node}
    </SlideChrome>
  ));

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
      pdf.save(`${PROJECT_SLUG}-presentation.pdf`);
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
          only to rasterize each page into the exported PDF. The pdf-export
          class hides anything marked slide-controls (regenerate/edit/reset/
          delete buttons) via the global CSS rule, so they never get baked
          into the exported images even though this reuses the same slide
          elements as the live viewer below. */}
      <div
        className="pdf-export"
        style={{ position: "fixed", top: -99999, left: 0, pointerEvents: "none" }}
      >
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
        <div className="flex items-center gap-2 relative">
          <Link href={`/p/${PROJECT_SLUG}/dashboard`} className="btn py-1.5 px-3 text-[12px]">
            ✕ Exit
          </Link>
          {canWrite && (
            <div className="relative">
              <button
                onClick={() => setConfirmingRegenerateAll(true)}
                disabled={Boolean(slideBatchProgress) || Boolean(slideGenerating)}
                className="btn py-1.5 px-3 text-[12px] disabled:opacity-50"
              >
                {slideBatchProgress
                  ? `↻ Regenerating ${slideBatchProgress.current}/${slideBatchProgress.total}…`
                  : "↻ Regenerate All"}
              </button>
              {confirmingRegenerateAll && (
                <div
                  className="absolute bottom-full mb-2 left-0 panel px-3 py-3 w-72 z-10"
                  style={{ background: "var(--bg-soft)" }}
                >
                  <p className="text-[12.5px] text-[var(--text-dim)] mb-3">
                    Regenerate all {program.length + 5} slides with AI (every beat plus
                    the title, concept, lineup, finale and numbers slides), based on the
                    current info? This overwrites any manual edits.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmingRegenerateAll(false)}
                      className="btn py-1 px-2.5 text-[11.5px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setConfirmingRegenerateAll(false);
                        await generateAllSlides(PROJECT_SLUG);
                      }}
                      className="btn btn-gold py-1 px-2.5 text-[11.5px]"
                    >
                      Regenerate all
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="btn py-1.5 px-3 text-[12px] disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "⬇ Export PDF"}
          </button>
          {canWrite && hiddenList.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowHidden((x) => !x)}
                className="btn py-1.5 px-3 text-[12px]"
              >
                Hidden ({hiddenList.length})
              </button>
              {showHidden && (
                <div
                  className="absolute bottom-full mb-2 left-0 panel px-3 py-3 w-64 z-10"
                  style={{ background: "var(--bg-soft)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
                      Hidden slides
                    </span>
                    <button
                      onClick={() => {
                        restoreAllSlides();
                        setShowHidden(false);
                      }}
                      className="text-[11px] emerald-text hover:underline"
                    >
                      Restore all
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {hiddenList.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-2">
                        <span className="text-[12px] truncate">{s.label}</span>
                        <button
                          onClick={() => restoreSlide(s.key)}
                          className="text-[11px] emerald-text hover:underline shrink-0"
                        >
                          ↺ Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

// Shared Generate/Edit/Reset button row used by every editable slide (the
// per-beat slides and the 5 static ones). slide-controls keeps it out of the
// PDF export via the global CSS rule scoped to .pdf-export.
function SlideAIControls({
  canWrite,
  generating,
  hasSlide,
  onGenerate,
  onEdit,
  onReset,
}: {
  canWrite: boolean;
  generating: boolean;
  hasSlide: boolean;
  onGenerate: () => void;
  onEdit: () => void;
  onReset?: () => void;
}) {
  if (!canWrite) return null;
  return (
    <div className="slide-controls flex gap-2 shrink-0 pt-1">
      <button
        onClick={onGenerate}
        disabled={generating}
        className="btn py-1.5 px-3 text-[12px] disabled:opacity-50"
      >
        {generating ? "Generating…" : hasSlide ? "↻ Regenerate" : "✦ Generate with AI"}
      </button>
      <button onClick={onEdit} className="btn py-1.5 px-3 text-[12px]">
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
  );
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
        <SlideAIControls
          canWrite={canWrite}
          generating={generating}
          hasSlide={Boolean(slide?.aiGenerated)}
          onGenerate={onGenerate}
          onEdit={() => setEditing(true)}
          onReset={onReset}
        />
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

interface StaticSlideProps {
  slide?: SlideData;
  canWrite: boolean;
  generating: boolean;
  onGenerate: () => void;
  onSave: (patch: Partial<SlideData>) => void;
  onReset?: () => void;
}

function TitleSlide({ slide, canWrite, generating, onGenerate, onSave, onReset }: StaticSlideProps) {
  const [editing, setEditing] = useState(false);
  const { name } = useProject();
  const meta = useDeck((s) => s.meta);
  const title = slide?.title || name;
  const line1 = [meta.date, meta.timing].filter(Boolean).join(" · ");
  const line2 = [meta.guests, meta.theme].filter(Boolean).join(" · ");

  return (
    <Slide center>
      {meta.venue && <div className="chip mb-6">{meta.venue}</div>}
      <h1 className="font-display italic text-5xl md:text-7xl gold-gradient leading-[1.05] mb-5">
        {title}
      </h1>
      {slide?.subtitle && (
        <p className="text-lg gold-text italic mb-1">{slide.subtitle}</p>
      )}
      {line1 && <p className="text-lg text-[var(--text-dim)] max-w-2xl">{line1}</p>}
      {line2 && <p className="text-[14px] text-[var(--text-faint)] mt-2">{line2}</p>}
      {slide?.body && (
        <p className="text-[13px] text-[var(--text-faint)] mt-4 max-w-xl">{slide.body}</p>
      )}
      <div className="mt-6">
        <SlideAIControls
          canWrite={canWrite}
          generating={generating}
          hasSlide={Boolean(slide?.aiGenerated)}
          onGenerate={onGenerate}
          onEdit={() => setEditing(true)}
          onReset={onReset}
        />
      </div>
      {editing && (
        <SlideEditorModal
          initial={{ title, subtitle: slide?.subtitle ?? "", body: slide?.body ?? "" }}
          onClose={() => setEditing(false)}
          onSave={onSave}
          hidePhoto
        />
      )}
    </Slide>
  );
}

function ConceptSlide({
  slide,
  flowPoints,
  canWrite,
  generating,
  onGenerate,
  onSave,
  onReset,
}: StaticSlideProps & { flowPoints: CurvePoint[] }) {
  const [editing, setEditing] = useState(false);
  const meta = useDeck((s) => s.meta);
  const title = slide?.title || "The shape of the night";
  const body = slide?.body || meta.concept;

  return (
    <Slide>
      <div className="flex items-start justify-between gap-4 mb-2">
        <SlideTitle kicker="The concept" title={title} />
        <SlideAIControls
          canWrite={canWrite}
          generating={generating}
          hasSlide={Boolean(slide?.aiGenerated)}
          onGenerate={onGenerate}
          onEdit={() => setEditing(true)}
          onReset={onReset}
        />
      </div>
      {slide?.subtitle && <p className="text-[13px] emerald-text mb-3">{slide.subtitle}</p>}
      <p className="text-[15px] text-[var(--text-dim)] max-w-4xl leading-relaxed mb-6">{body}</p>
      <div className="panel px-6 py-6">
        <EnergyCurve points={flowPoints} height={300} compact />
      </div>
      {editing && (
        <SlideEditorModal
          initial={{ title, subtitle: slide?.subtitle ?? "", body }}
          onClose={() => setEditing(false)}
          onSave={onSave}
          hidePhoto
        />
      )}
    </Slide>
  );
}

function LineupSlide({
  slide,
  ordered,
  totals,
  myPoints,
  canWrite,
  generating,
  onGenerate,
  onSave,
  onReset,
}: StaticSlideProps & {
  ordered: (LineupItem & { act: Act })[];
  totals: ReturnType<typeof lineupTotals>;
  myPoints: CurvePoint[];
}) {
  const [editing, setEditing] = useState(false);
  const defaultTitle =
    ordered.length > 0
      ? `${totals.count}-act lineup · ${totals.totalDuration} min on stage`
      : "Build a lineup to present it here";
  const title = slide?.title || defaultTitle;

  return (
    <Slide>
      <div className="flex items-start justify-between gap-4 mb-2">
        <SlideTitle kicker="The show" title={title} />
        <SlideAIControls
          canWrite={canWrite}
          generating={generating}
          hasSlide={Boolean(slide?.aiGenerated)}
          onGenerate={onGenerate}
          onEdit={() => setEditing(true)}
          onReset={onReset}
        />
      </div>
      {slide?.subtitle && <p className="text-[13px] emerald-text mb-3">{slide.subtitle}</p>}
      {ordered.length > 0 ? (
        <>
          {slide?.body && (
            <p className="text-[14px] text-[var(--text-dim)] leading-relaxed mb-4">{slide.body}</p>
          )}
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
          Head to the Show &amp; Decor Builder and generate a lineup — it appears here live.
        </p>
      )}
      {editing && (
        <SlideEditorModal
          initial={{ title, subtitle: slide?.subtitle ?? "", body: slide?.body ?? "" }}
          onClose={() => setEditing(false)}
          onSave={onSave}
          hidePhoto
        />
      )}
    </Slide>
  );
}

function FinaleSlide({ slide, canWrite, generating, onGenerate, onSave, onReset }: StaticSlideProps) {
  const [editing, setEditing] = useState(false);
  const title = slide?.title || goldenBloom.title;
  const body = slide?.body || goldenBloom.concept;
  const image = slide?.imageUrl || finaleConcepts[1].image;

  return (
    <Slide>
      <div className="flex items-start justify-between gap-4 mb-2">
        <SlideTitle kicker="The finale" title={title} />
        <SlideAIControls
          canWrite={canWrite}
          generating={generating}
          hasSlide={Boolean(slide?.aiGenerated)}
          onGenerate={onGenerate}
          onEdit={() => setEditing(true)}
          onReset={onReset}
        />
      </div>
      {slide?.subtitle && <p className="text-[13px] emerald-text mb-3">{slide.subtitle}</p>}
      <div className="grid md:grid-cols-2 gap-6 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Golden Bloom" className="w-full rounded-2xl border hairline" />
        <div>
          <p className="text-[15px] text-[var(--text-dim)] leading-relaxed mb-4">{body}</p>
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
      {editing && (
        <SlideEditorModal
          initial={{ title, subtitle: slide?.subtitle ?? "", body, imageUrl: image }}
          onClose={() => setEditing(false)}
          onSave={onSave}
        />
      )}
    </Slide>
  );
}

function NumbersSlide({
  slide,
  pnl,
  canWrite,
  generating,
  onGenerate,
  onSave,
  onReset,
}: StaticSlideProps & { pnl: PnL }) {
  const [editing, setEditing] = useState(false);
  const title = slide?.title || "Revenue model at a glance";
  const defaultBody = `${pnl.pax} guests · entertainment ${thb(pnl.entertainment)} (${pct(
    pnl.entertainmentPctRev
  )} of revenue) · break-even at ${Math.ceil(pnl.breakEvenQty)} ${pnl.primaryTierName.toLowerCase()}. Planning estimates — costs are editable placeholders.`;
  const body = slide?.body || defaultBody;

  return (
    <Slide>
      <div className="flex items-start justify-between gap-4 mb-2">
        <SlideTitle kicker="The numbers" title={title} />
        <SlideAIControls
          canWrite={canWrite}
          generating={generating}
          hasSlide={Boolean(slide?.aiGenerated)}
          onGenerate={onGenerate}
          onEdit={() => setEditing(true)}
          onReset={onReset}
        />
      </div>
      {slide?.subtitle && <p className="text-[13px] emerald-text mb-3">{slide.subtitle}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigStat label="Revenue" value={thb(pnl.totalRevenue)} tone="emerald" />
        <BigStat label="Total cost" value={thb(pnl.totalCost)} tone="danger" />
        <BigStat label="Gross profit" value={thb(pnl.grossProfit)} tone="gold" />
        <BigStat label="Margin" value={pct(pnl.marginPct)} tone="gold" />
      </div>
      <p className="text-[13px] text-[var(--text-faint)] mt-6">{body}</p>
      {editing && (
        <SlideEditorModal
          initial={{ title, subtitle: slide?.subtitle ?? "", body }}
          onClose={() => setEditing(false)}
          onSave={onSave}
          hidePhoto
        />
      )}
    </Slide>
  );
}

// Wraps every slide (static or beat-based) with a uniform "remove this
// slide" affordance in design mode — pinned top-right so it never collides
// with a slide's own content or BeatSlide's inline Generate/Edit/Reset row.
// The slide-controls class keeps it (and BeatSlide's own buttons) out of
// the PDF export via the global CSS rule scoped to .pdf-export.
function SlideChrome({
  slideKey,
  canWrite,
  onDelete,
  children,
}: {
  slideKey: string;
  canWrite: boolean;
  onDelete: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full" data-slide-key={slideKey}>
      {canWrite && (
        <button
          onClick={() => onDelete(slideKey)}
          className="slide-controls absolute top-4 right-4 z-10 btn py-1 px-2 text-[11px] hover:text-[var(--danger)]"
          title="Remove this slide from the presentation"
        >
          ✕ Remove slide
        </button>
      )}
      {children}
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
