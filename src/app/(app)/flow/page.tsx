"use client";

import { useState } from "react";
import { eventMeta, whySpacingWorks, Beat } from "@/data/runOfShow";
import { allActsList, findAct, Act } from "@/data/acts";
import { EnergyCurve, CurvePoint } from "@/components/EnergyCurve";
import { MediaGallery } from "@/components/MediaGallery";
import { liveBeatEnergy } from "@/lib/programEnergy";
import { energyColor } from "@/lib/format";
import { useDeck } from "@/store/useDeck";
import { toEmbedUrl } from "@/lib/embed";

const peakLabels: Record<string, string> = {
  peak1: "Peak 1",
  peak2: "Peak 2",
  peak3: "Peak 3",
  summit: "★ Summit",
};

const peakOptions = [
  { value: "", label: "None" },
  { value: "peak1", label: "Peak 1" },
  { value: "peak2", label: "Peak 2" },
  { value: "peak3", label: "Peak 3" },
  { value: "summit", label: "★ Summit" },
];

export default function FlowPage() {
  const [view, setView] = useState<"planner" | "client">("planner");
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const program = useDeck((s) => s.program);
  const customActs = useDeck((s) => s.customActs);
  const addProgramBeat = useDeck((s) => s.addProgramBeat);
  const resetProgram = useDeck((s) => s.resetProgram);
  const myRole = useDeck((s) => s.myRole);
  const canWrite = myRole === "owner" || myRole === "editor";

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const points: CurvePoint[] = program.map((b) => ({
    label: b.time,
    sublabel: b.segment,
    energy: liveBeatEnergy(b, customActs),
    highlight: Boolean(b.peak),
  }));

  const handleAddProgram = () => {
    const id = addProgramBeat();
    setSelected(id);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="chip mb-2">Module 01 · Run of Show</div>
          <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">
            Event Flow
          </h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1">
            {eventMeta.date} · {eventMeta.timing} · one rising curve, four peaks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "planner" && canWrite && (
            <button onClick={resetProgram} className="btn py-1.5 px-3 text-[12px]">
              Reset to default
            </button>
          )}
          <div className="flex items-center gap-1 panel-2 p-1">
            {(["planner", "client"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="nav-link"
                style={
                  view === v
                    ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                    : {}
                }
              >
                {v === "planner" ? "Planner view" : "Client view"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Energy curve */}
      <section className="panel px-4 py-5 md:px-7 md:py-6">
        <div className="flex items-center justify-between mb-1 px-2">
          <span className="text-[12px] uppercase tracking-wide text-[var(--text-faint)]">
            Energy across the night
          </span>
          <div className="flex gap-3 text-[11px] text-[var(--text-faint)]">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--gold-bright)" }}
              />
              Peak
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--emerald-bright)" }}
              />
              Baseline beat
            </span>
          </div>
        </div>
        <EnergyCurve points={points} height={250} compact />
        <p className="text-[11px] text-[var(--text-faint)] px-2 mt-1">
          Energy for any beat with linked shows is calculated live from those
          shows — pick or change acts below and the curve updates instantly.
        </p>
      </section>

      {/* Timeline */}
      <section className="grid gap-2.5 mt-4">
        {program.map((b) => (
          <BeatRow
            key={b.id}
            beat={b}
            view={view}
            customActs={customActs}
            expanded={expanded.has(b.id)}
            onToggle={() => toggle(b.id)}
            onDetails={() => setSelected(b.id)}
          />
        ))}
      </section>

      {view === "planner" && canWrite && (
        <button
          onClick={handleAddProgram}
          className="btn btn-emerald w-full mt-2.5 py-3"
        >
          + Add program
        </button>
      )}

      {/* Why spacing works — planner only */}
      {view === "planner" && (
        <section className="panel px-7 py-6 mt-4">
          <h3 className="text-sm font-semibold emerald-text mb-3">
            Why this spacing works
          </h3>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {whySpacingWorks.map((w) => (
              <div key={w.title} className="flex gap-3">
                <span className="gold-text text-sm shrink-0">◆</span>
                <p className="text-[13px] text-[var(--text-dim)] leading-relaxed">
                  <span className="text-[var(--text)] font-semibold">{w.title}:</span>{" "}
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {selected !== null && (
        <BeatDrawer
          beatId={selected}
          view={view}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function BeatRow({
  beat,
  view,
  customActs,
  expanded,
  onToggle,
  onDetails,
}: {
  beat: Beat;
  view: "planner" | "client";
  customActs: Act[];
  expanded: boolean;
  onToggle: () => void;
  onDetails: () => void;
}) {
  const energy = liveBeatEnergy(beat, customActs);
  const color = energyColor(energy);
  const linkedActs = (beat.linkedActs ?? [])
    .map((id) => findAct(id, customActs))
    .filter((a): a is Act => Boolean(a));
  const hasDropdown = linkedActs.length > 0 || (beat.gallery && beat.gallery.length > 0);

  return (
    <div
      className="panel overflow-hidden transition-colors"
      style={{ borderColor: beat.peak ? "rgba(217,180,90,0.4)" : "var(--border-soft)" }}
    >
      <button
        onClick={hasDropdown ? onToggle : onDetails}
        aria-expanded={hasDropdown ? expanded : undefined}
        className="px-4 py-3.5 md:px-5 text-left flex items-center gap-4 hover:border-[var(--gold)] transition-colors w-full"
      >
        {/* time + energy bar */}
        <div className="w-16 shrink-0">
          <div className="font-display text-lg leading-none">{beat.time}</div>
          <div className="text-[10px] text-[var(--text-faint)] mt-0.5">
            {beat.durationMin}m
          </div>
        </div>
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ background: color, opacity: 0.8 }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] truncate">{beat.segment}</span>
            {beat.peak && (
              <span
                className="chip"
                style={{ color: "var(--gold-bright)", borderColor: "var(--gold)" }}
              >
                {peakLabels[beat.peak]}
              </span>
            )}
            {beat.custom && (
              <span className="chip" style={{ color: "var(--emerald-bright)" }}>
                custom
              </span>
            )}
          </div>
          <div className="text-[12px] text-[var(--text-faint)] mt-0.5">
            {beat.location}
            {view === "planner" && beat.lead && ` · ${beat.lead}`}
          </div>
        </div>
        {/* mini energy meter */}
        <div className="hidden md:flex items-end gap-[3px] h-8 shrink-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 4,
                height: `${20 + i * 8}%`,
                borderRadius: 1,
                background: i < energy ? color : "var(--border)",
                opacity: i < energy ? 0.9 : 0.5,
              }}
            />
          ))}
        </div>
        {beat.gallery && beat.gallery.length > 0 && (
          <span
            className="chip shrink-0 py-0.5"
            style={{ color: "var(--emerald-bright)", borderColor: "var(--border)" }}
            title={`${beat.gallery.length} photos/videos`}
          >
            ▷ {beat.gallery.length}
          </span>
        )}
        {view === "planner" && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetails();
            }}
            className="text-[11px] text-[var(--text-faint)] hover:text-[var(--gold-bright)] shrink-0"
            title="Edit this program"
          >
            ✎
          </span>
        )}
        {hasDropdown ? (
          <span
            className="text-[var(--text-faint)] shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        ) : (
          <span className="text-[var(--text-faint)] shrink-0">→</span>
        )}
      </button>

      {/* Dropdown: shows under this program beat */}
      {hasDropdown && expanded && (
        <div
          className="px-4 md:px-5 pb-4 pt-1 fade-up"
          style={{ borderTop: "1px solid var(--border-soft)" }}
        >
          {linkedActs.length > 0 && (
            <>
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mt-3 mb-2">
                Shows in this segment
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {linkedActs.map((a) => (
                  <div key={a.id} className="panel-2 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.photo}
                      alt={a.name}
                      className="w-full h-20 object-cover"
                    />
                    <div className="px-2 py-1.5">
                      <div className="text-[11.5px] font-semibold truncate">
                        {a.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-faint)] truncate">
                        {a.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            onClick={onDetails}
            className="text-[12px] emerald-text hover:underline"
          >
            {view === "planner" ? "Edit shows & details →" : "View media & full details →"}
          </button>
        </div>
      )}
    </div>
  );
}

function BeatDrawer({
  beatId,
  view,
  onClose,
}: {
  beatId: string;
  view: "planner" | "client";
  onClose: () => void;
}) {
  const beat = useDeck((s) => s.program.find((b) => b.id === beatId));
  const customActs = useDeck((s) => s.customActs);
  const videos = useDeck((s) => s.videos);
  const setVideo = useDeck((s) => s.setVideo);
  const updateProgramBeat = useDeck((s) => s.updateProgramBeat);
  const removeProgramBeat = useDeck((s) => s.removeProgramBeat);
  const setBeatActs = useDeck((s) => s.setBeatActs);
  const myRole = useDeck((s) => s.myRole);
  const canWrite = myRole === "owner" || myRole === "editor";

  const [draft, setDraft] = useState(videos[`beat-${beatId}`] ?? "");
  const [addingActId, setAddingActId] = useState("");

  if (!beat) return null; // deleted mid-edit

  const embed = toEmbedUrl(videos[`beat-${beatId}`] ?? "");
  const linkedActs = (beat.linkedActs ?? [])
    .map((id) => findAct(id, customActs))
    .filter((a): a is Act => Boolean(a));
  const showLibrary = allActsList(customActs).filter(
    (a) => a.kind === "show" && !(beat.linkedActs ?? []).includes(a.id)
  );

  const addShow = (id: string) => {
    if (!id) return;
    setBeatActs(beat.id, [...(beat.linkedActs ?? []), id]);
    setAddingActId("");
  };
  const removeShow = (id: string) => {
    setBeatActs(
      beat.id,
      (beat.linkedActs ?? []).filter((x) => x !== id)
    );
  };

  const planner = view === "planner";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full overflow-y-auto p-6 md:p-8 fade-up"
        style={{ background: "var(--bg-soft)", borderLeft: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {planner ? (
              <input
                type="text"
                value={beat.time}
                onChange={(e) => updateProgramBeat(beat.id, { time: e.target.value })}
                className="font-display text-2xl gold-text w-24 mb-1"
              />
            ) : (
              <div className="font-display text-2xl gold-text">{beat.time}</div>
            )}
            {planner ? (
              <input
                type="text"
                value={beat.segment}
                onChange={(e) => updateProgramBeat(beat.id, { segment: e.target.value })}
                className="text-xl font-semibold w-full"
              />
            ) : (
              <h2 className="text-xl font-semibold mt-1">{beat.segment}</h2>
            )}
            <div className="text-[12px] text-[var(--text-faint)] mt-1">
              {beat.location} · {beat.durationMin} min · {beat.lead}
            </div>
          </div>
          <button onClick={onClose} className="btn px-3 py-1.5 shrink-0">
            ✕
          </button>
        </div>

        {beat.media?.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.media.photo}
            alt={beat.segment}
            className="w-full rounded-xl mb-4 border hairline"
          />
        )}

        {planner ? (
          <fieldset disabled={!canWrite} className="panel-2 px-4 py-4 mb-5 space-y-3 border-0">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
              Edit details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (min)">
                <input
                  type="number"
                  value={beat.durationMin}
                  onChange={(e) =>
                    updateProgramBeat(beat.id, { durationMin: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </Field>
              <Field label="Peak">
                <select
                  value={beat.peak ?? ""}
                  onChange={(e) =>
                    updateProgramBeat(beat.id, {
                      peak: (e.target.value || undefined) as Beat["peak"],
                    })
                  }
                  className="w-full"
                >
                  {peakOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Location">
              <input
                type="text"
                value={beat.location}
                onChange={(e) => updateProgramBeat(beat.id, { location: e.target.value })}
                className="w-full"
              />
            </Field>
            <Field label="Lead / cue">
              <input
                type="text"
                value={beat.lead}
                onChange={(e) => updateProgramBeat(beat.id, { lead: e.target.value })}
                className="w-full"
              />
            </Field>
            <Field label="What happens">
              <textarea
                value={beat.what}
                onChange={(e) => updateProgramBeat(beat.id, { what: e.target.value })}
                rows={3}
                className="w-full text-[13px]"
                style={{
                  background: "var(--bg-soft)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  color: "var(--text)",
                  resize: "vertical",
                }}
              />
            </Field>
            <Field
              label={
                linkedActs.length > 0
                  ? "Baseline energy (overridden by linked shows below)"
                  : "Baseline energy (1–10)"
              }
            >
              <input
                type="range"
                min={1}
                max={10}
                value={beat.energy}
                onChange={(e) =>
                  updateProgramBeat(beat.id, { energy: Number(e.target.value) })
                }
                className="w-full"
                disabled={linkedActs.length > 0}
              />
            </Field>
            <div className="flex justify-between items-center pt-2 border-t hairline">
              <button
                onClick={() => {
                  removeProgramBeat(beat.id);
                  onClose();
                }}
                className="text-[12px] text-[var(--text-faint)] hover:text-[var(--danger)]"
              >
                Delete this program
              </button>
              <button onClick={onClose} className="btn btn-gold py-1.5 px-4 text-[12.5px]">
                Save &amp; close
              </button>
            </div>
          </fieldset>
        ) : (
          <p className="text-[14px] text-[var(--text-dim)] leading-relaxed mb-5">
            {beat.what}
          </p>
        )}

        {beat.gallery && beat.gallery.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
              Real footage &amp; photos · tap to play
            </div>
            <MediaGallery items={beat.gallery} />
          </div>
        )}

        {beat.links && beat.links.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
              Talent references
            </div>
            <div className="flex flex-wrap gap-2">
              {beat.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn py-1.5 px-3 text-[12px]"
                >
                  ↗ {l.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Linked shows — editable picker in planner view */}
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
            {planner ? "Shows — pick from the builder" : "Linked acts"}
          </div>
          {linkedActs.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {linkedActs.map((a) => (
                <div key={a.id} className="panel-2 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.photo}
                    alt={a.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="px-2.5 py-2">
                    <div className="text-[12px] font-semibold truncate">{a.name}</div>
                    <div className="text-[10px] text-[var(--text-faint)]">
                      {a.energyLabel} · {a.type}
                    </div>
                  </div>
                  {planner && canWrite && (
                    <button
                      onClick={() => removeShow(a.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                      style={{ background: "rgba(10,15,13,0.75)", color: "var(--danger)" }}
                      title="Remove from this program"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {planner && canWrite && (
            <div className="flex gap-2">
              <select
                value={addingActId}
                onChange={(e) => setAddingActId(e.target.value)}
                className="flex-1"
              >
                <option value="">
                  {showLibrary.length ? "Add a show…" : "No more shows to add"}
                </option>
                {showLibrary.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.energyLabel})
                  </option>
                ))}
              </select>
              <button
                onClick={() => addShow(addingActId)}
                disabled={!addingActId}
                className="btn btn-emerald py-1.5 px-3 text-[12.5px] disabled:opacity-40"
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {/* Video slot */}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
            Reference video
          </div>
          {embed ? (
            <div className="mb-2">
              <div
                className="relative w-full rounded-xl overflow-hidden border hairline"
                style={{ paddingBottom: "56.25%" }}
              >
                <iframe
                  src={embed}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--text-faint)] mb-2">
              Paste a YouTube or Vimeo link to attach a reference clip to this beat.
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="flex-1"
            />
            <button
              className="btn btn-emerald"
              onClick={() => setVideo(`beat-${beatId}`, draft)}
            >
              Attach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
