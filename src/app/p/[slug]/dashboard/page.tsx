"use client";

import Link from "next/link";
import { useState } from "react";
import { acts } from "@/data/acts";
import { useDeck } from "@/store/useDeck";
import { useProject } from "@/components/ProjectProvider";
import { EventSettingsModal } from "@/components/dashboard/EventSettingsModal";

const modules = [
  {
    seg: "flow",
    tag: "01",
    title: "Event Flow",
    body: "The full run of show as a live energy curve — click any beat for cues, linked visuals and video slots. Planner and client views.",
    accent: "var(--emerald-bright)",
  },
  {
    seg: "builder",
    tag: "02",
    title: "Show & Decor Builder",
    body: "Add your own shows or decor, pick acts into Welcome / Opening / Mid / Finale slots, and link them straight into Event Flow. The vibe graph redraws live.",
    accent: "var(--gold-bright)",
  },
  {
    seg: "revenue",
    tag: "03",
    title: "Revenue vs Costing",
    body: "P&L with editable assumptions. Your built lineup's talent cost flows straight into the model — margin, break-even and scenario compare.",
    accent: "var(--emerald-bright)",
  },
  {
    seg: "media",
    tag: "04",
    title: "Media Library",
    body: "Every photo, video, song and reference link uploaded anywhere in the project, searchable in one place — rename, sort by type, and reuse without re-uploading.",
    accent: "var(--gold-bright)",
  },
];

export default function Home() {
  const { slug, name, role } = useProject();
  const meta = useDeck((s) => s.meta);
  const canWrite = role === "owner" || role === "editor";
  const [editing, setEditing] = useState(false);
  const base = `/p/${slug}`;

  const snapshot: [string, string][] = [
    ["Date", meta.date],
    ["Timing", meta.timing],
    ["Guests", meta.guests],
    ["Spaces", meta.spaces],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      {/* Hero */}
      <section className="panel px-8 py-12 md:px-14 md:py-16 relative overflow-hidden fade-up">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px 300px at 80% 20%, rgba(217,180,90,0.18), transparent 60%)",
          }}
        />
        <div className="relative">
          {meta.venue && <div className="chip mb-5">{meta.venue}</div>}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-display italic text-4xl md:text-6xl leading-[1.05]">
              <span className="gold-gradient">{name}</span>
            </h1>
            {canWrite && (
              <button
                onClick={() => setEditing(true)}
                className="btn py-1.5 px-3 text-[12px] shrink-0"
              >
                ✎ Edit event details
              </button>
            )}
          </div>
          <p className="text-[15px] md:text-lg text-[var(--text-dim)] max-w-2xl leading-relaxed">
            An interactive command deck for your event — design the show, shape the
            night&apos;s energy, and model the numbers, all from your run of show and a{" "}
            {acts.length}-act entertainment catalogue.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href={`${base}/builder`} className="btn btn-gold">
              Open the Show &amp; Decor Builder
            </Link>
            <Link href={`${base}/present`} className="btn">
              ▸ Enter present mode
            </Link>
          </div>
        </div>
      </section>

      {/* Snapshot strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {snapshot.map(([k, v]) => (
          <div key={k} className="panel-2 px-4 py-3.5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-1">
              {k}
            </div>
            <div className="text-[13px] text-[var(--text)] leading-snug">
              {v || <span className="text-[var(--text-faint)]">—</span>}
            </div>
          </div>
        ))}
      </section>

      {/* Concept line */}
      {(meta.concept || canWrite) && (
        <section className="panel px-7 py-6 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="emerald-text text-sm font-semibold">The concept</span>
          </div>
          <p className="text-[14px] text-[var(--text-dim)] leading-relaxed max-w-4xl">
            {meta.concept || (
              <span className="text-[var(--text-faint)]">
                Add your event concept in &ldquo;Edit event details&rdquo;.
              </span>
            )}
          </p>
        </section>
      )}

      {/* Modules */}
      <section className="grid md:grid-cols-2 gap-3 mt-3">
        {modules.map((m) => (
          <Link
            key={m.seg}
            href={`${base}/${m.seg}`}
            className="panel px-7 py-6 group hover:border-[var(--gold)] transition-colors"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className="font-display text-2xl"
                style={{ color: m.accent, opacity: 0.9 }}
              >
                {m.tag}
              </span>
              <span className="text-[var(--text-faint)] group-hover:text-[var(--gold-bright)] transition-colors">
                →
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1.5">{m.title}</h3>
            <p className="text-[13px] text-[var(--text-dim)] leading-relaxed">{m.body}</p>
          </Link>
        ))}
      </section>

      <footer className="text-center text-[12px] text-[var(--text-faint)] mt-10 pb-4">
        Figures are editable planning estimates.
      </footer>

      {editing && <EventSettingsModal onClose={() => setEditing(false)} />}
    </div>
  );
}
