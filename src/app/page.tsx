"use client";

import { useState } from "react";
import { PasscodeModal } from "@/components/PasscodeModal";

const ink = "#37352F";
const sub = "#787774";
const border = "rgba(55,53,47,0.09)";
const hoverBg = "rgba(55,53,47,0.04)";

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
  const [gateOpen, setGateOpen] = useState(false);

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
          <span className="text-[12px]" style={{ color: sub }}>
            Production Suite
          </span>
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

      {/* Projects — private, no preview */}
      <section className="mx-auto max-w-[880px] px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: sub }}>
            Your projects
          </h2>
          <span className="text-[12px]" style={{ color: sub }}>
            1 project
          </span>
        </div>

        <button
          onClick={() => setGateOpen(true)}
          className="w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-[8px] transition-colors group"
          style={{ border: `1px solid ${border}` }}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span
            className="w-9 h-9 rounded-[7px] flex items-center justify-center shrink-0"
            style={{ background: hoverBg, color: sub }}
          >
            <Icon path={ICONS.lock} size={16} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-[14.5px] font-semibold" style={{ color: ink }}>
                JW Gala Garden Night
              </span>
              <span
                className="text-[11px] font-medium px-1.5 py-[1px] rounded-full"
                style={{ border: `1px solid ${border}`, color: sub }}
              >
                Private
              </span>
            </span>
            <span className="block text-[12.5px] mt-0.5" style={{ color: sub }}>
              JW Marriott Phuket · New Year&apos;s Eve 2026 — enter the project
              passcode to view
            </span>
          </span>
          <span
            className="text-[13px] font-medium flex items-center gap-1 shrink-0"
            style={{ color: ink }}
          >
            Enter code
            <Icon path={ICONS.arrow} size={14} />
          </span>
        </button>
      </section>

      <footer
        className="text-center text-[12px] py-8"
        style={{ color: sub, borderTop: `1px solid ${border}` }}
      >
        EventFlow Production — internal event planning &amp; simulation suite.
      </footer>

      {gateOpen && (
        <PasscodeModal
          projectName="JW Gala Garden Night"
          onClose={() => setGateOpen(false)}
        />
      )}
    </div>
  );
}
