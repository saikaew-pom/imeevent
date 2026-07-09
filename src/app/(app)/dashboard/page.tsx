import Link from "next/link";
import { eventMeta } from "@/data/runOfShow";
import { acts } from "@/data/acts";

const modules = [
  {
    href: "/flow",
    tag: "01",
    title: "Event Flow",
    body: "The full run of show as a live energy curve — click any beat for cues, linked visuals and video slots. Planner and client views.",
    accent: "var(--emerald-bright)",
  },
  {
    href: "/builder",
    tag: "02",
    title: "Show & Decor Builder",
    body: "Add your own shows or decor, pick acts into Welcome / Opening / Mid / Finale slots, and link them straight into Event Flow. The vibe graph redraws live.",
    accent: "var(--gold-bright)",
  },
  {
    href: "/revenue",
    tag: "03",
    title: "Revenue vs Costing",
    body: "P&L with editable assumptions. Your built lineup's talent cost flows straight into the model — margin, break-even and scenario compare.",
    accent: "var(--emerald-bright)",
  },
  {
    href: "/finale",
    tag: "04",
    title: "Golden Bloom Finale",
    body: "The finale creative brief with four concept boards to compare, plus the production risk board from the technical notes.",
    accent: "var(--gold-bright)",
  },
];

const snapshot = [
  ["Date", eventMeta.date],
  ["Timing", eventMeta.timing],
  ["Guests", eventMeta.guests],
  ["Spaces", eventMeta.spaces],
];

export default function Home() {
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
          <div className="chip mb-5">JW Marriott Phuket Resort &amp; Spa · NYE 2026</div>
          <h1 className="font-display italic text-4xl md:text-6xl leading-[1.05] mb-4">
            <span className="gold-gradient">JW Gala Garden Night</span>
          </h1>
          <p className="text-[15px] md:text-lg text-[var(--text-dim)] max-w-2xl leading-relaxed">
            An interactive command deck for the New Year&apos;s Eve gala — design the
            show, shape the night&apos;s energy, and model the numbers, all from your
            real run of show and a {acts.length}-act entertainment catalogue.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/builder" className="btn btn-gold">
              Open the Show &amp; Decor Builder
            </Link>
            <Link href="/present" className="btn">
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
            <div className="text-[13px] text-[var(--text)] leading-snug">{v}</div>
          </div>
        ))}
      </section>

      {/* Concept line */}
      <section className="panel px-7 py-6 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="emerald-text text-sm font-semibold">The concept</span>
          <span className="text-[var(--text-faint)] text-sm">
            One rising curve, four peaks
          </span>
        </div>
        <p className="text-[14px] text-[var(--text-dim)] leading-relaxed max-w-4xl">
          {eventMeta.concept}
        </p>
      </section>

      {/* Modules */}
      <section className="grid md:grid-cols-2 gap-3 mt-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
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
            <p className="text-[13px] text-[var(--text-dim)] leading-relaxed">
              {m.body}
            </p>
          </Link>
        ))}
      </section>

      <footer className="text-center text-[12px] text-[var(--text-faint)] mt-10 pb-4">
        Built from the JW Gala Garden Night run of show &amp; PHOENIX ORGANIZE show
        catalogue · figures are editable planning estimates
      </footer>
    </div>
  );
}
