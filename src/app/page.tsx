import Link from "next/link";
import { ink, sub, border, hoverBg } from "@/lib/notionTheme";
import { ProjectPasscodeCard } from "@/components/ProjectPasscodeCard";

function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  flow: "M4 17c2-4 4-6 6-6s3 4 4 8 2 4 4 0M4 17h16",
  builder: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z",
  revenue: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  lock: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5v-9zM12 15v2",
  arrow: "M9 6l6 6-6 6",
};

const features = [
  {
    icon: ICONS.flow,
    title: "Event Flow",
    body: "A live run-of-show timeline with real media, an editable program, and energy calculated straight from your lineup.",
  },
  {
    icon: ICONS.builder,
    title: "Show & Decor Builder",
    body: "Build your entertainment lineup from a catalogue or your own custom acts — energy, placement, and vibe curve included.",
  },
  {
    icon: ICONS.revenue,
    title: "Revenue Simulator",
    body: "Package tiers, full cost breakdowns, and a live P&L benchmarked against real historical performance.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: "#ffffff", color: ink }}
    >
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto max-w-[880px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
              style={{ background: ink, color: "#fff" }}
            >
              E
            </span>
            <span className="text-[14px] font-semibold" style={{ color: ink }}>
              EventFlow Production
            </span>
          </div>
          <Link
            href="/login"
            className="text-[13px] font-medium px-3.5 py-1.5 rounded-[6px]"
            style={{ background: ink, color: "#fff" }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[880px] px-6 pt-20 pb-14 w-full text-center">
        <div
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full mb-6"
          style={{ border: `1px solid ${border}`, color: sub }}
        >
          Event Command Deck Platform
        </div>
        <h1 className="text-[40px] md:text-[52px] font-bold leading-[1.12] mb-4 tracking-tight">
          Run the night before the night happens.
        </h1>
        <p
          className="text-[16px] max-w-xl mx-auto leading-relaxed"
          style={{ color: sub }}
        >
          EventFlow Production turns a run of show, an entertainment catalogue and a
          cost sheet into one live, interactive deck — for planners, producers, and
          clients to walk through together.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[880px] px-6 pb-16 w-full">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <div
                className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3"
                style={{ background: hoverBg, color: ink }}
              >
                <Icon path={f.icon} size={17} />
              </div>
              <h3 className="text-[14.5px] font-semibold mb-1.5" style={{ color: ink }}>
                {f.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: sub }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[880px] px-6 w-full">
        <div style={{ borderTop: `1px solid ${border}` }} />
      </div>

      {/* Projects — private, no preview, sign-in required */}
      <section className="mx-auto max-w-[880px] px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: sub }}>
            Featured project
          </h2>
        </div>

        <ProjectPasscodeCard
          slug="jw-gala-garden-night"
          name="JW Gala Garden Night"
          subtitle="JW Marriott Phuket · New Year's Eve 2026 — enter passcode for instant access"
          dashboardHref="/dashboard"
        />
      </section>

      <footer
        className="text-center text-[12px] py-8"
        style={{ color: sub, borderTop: `1px solid ${border}` }}
      >
        EventFlow Production — internal event planning &amp; simulation suite.
      </footer>
    </div>
  );
}
