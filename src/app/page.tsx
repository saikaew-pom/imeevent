import Link from "next/link";
import { ink, sub, border, hoverBg, accentBg, bg } from "@/lib/notionTheme";
import { PasscodeEntry } from "@/components/PasscodeEntry";

function Icon({ path, size = 17 }: { path: string; size?: number }) {
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

const features = [
  {
    icon: "M4 17c2-4 4-6 6-6s3 4 4 8 2 4 4 0M4 17h16",
    title: "See the whole flow at a glance",
    body: "No more run-of-show buried in a spreadsheet. Every session, act and moment sits on one live timeline with an energy curve — from a single evening to a five-day programme.",
  },
  {
    icon: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z",
    title: "Design the experience, not a list",
    body: "Build the lineup and décor from a catalogue or your own ideas. Placement, energy and the vibe curve redraw as you go, so you can feel the event before it happens.",
  },
  {
    icon: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    title: "Know the margin before you commit",
    body: "Package tiers and a full cost breakdown feed a live P&L — margin, break-even and side-by-side scenarios — so you quote with confidence, not guesswork.",
  },
  {
    icon: "M8 2v4M16 2v4M3 9h18M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
    title: "Never miss a step",
    body: "A production checklist and Gantt build themselves from your event date, and AI reads your brief to flag the tasks you forgot to add.",
  },
  {
    icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M8 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z",
    title: "Find any asset in seconds",
    body: "Photos, clips, songs and reference links live in one library — with AI search that finds the right one by what it is, not what it's named.",
  },
  {
    icon: "M3 4h18v13H3zM9 21h6M12 17v4",
    title: "Win the client, then hit export",
    body: "Turn the whole plan into a polished, on-brand deck with AI-written copy, and send it as a PDF in a single click.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: bg, color: ink }}
    >
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto max-w-[960px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
              style={{ background: accentBg, color: "#fff" }}
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
            style={{ background: accentBg, color: "#fff" }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[960px] px-6 pt-20 pb-12 w-full text-center">
        <div
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full mb-6"
          style={{ border: `1px solid ${border}`, color: sub }}
        >
          For event planners, producers &amp; agencies
        </div>
        <h1 className="text-[38px] md:text-[52px] font-bold leading-[1.1] mb-5 tracking-tight max-w-3xl mx-auto">
          The run of show, the budget, the pitch — one deck.
        </h1>
        <p
          className="text-[16px] md:text-[17px] max-w-2xl mx-auto leading-relaxed"
          style={{ color: sub }}
        >
          Your event plan is scattered across spreadsheets, docs and slide decks that
          fall out of sync. EventFlow brings it into one live plan — for a wedding, a
          gala, a multi-day conference or a board meeting — that your whole team and your
          clients work from together.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold px-5 py-2.5 rounded-[8px]"
            style={{ background: accentBg, color: "#fff" }}
          >
            Sign in
            <Icon path="M9 6l6 6-6 6" size={15} />
          </Link>
          <PasscodeEntry variant="link" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[960px] px-6 pb-16 w-full">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-10">
          {features.map((f) => (
            <div key={f.title}>
              <div
                className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3"
                style={{ background: hoverBg, color: ink }}
              >
                <Icon path={f.icon} />
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

      {/* Closing CTA */}
      <section className="mx-auto max-w-[960px] px-6 pb-20 w-full">
        <div
          className="rounded-[12px] px-8 py-10 md:px-12 md:py-12 text-center"
          style={{ background: accentBg, color: "#fff" }}
        >
          <h2 className="text-[24px] md:text-[28px] font-bold tracking-tight mb-2">
            Stop rebuilding the plan in five different tools.
          </h2>
          <p className="text-[14.5px] max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Planners, producers and clients work from the same live event plan — no
            emailed spreadsheets, no out-of-date decks, no version confusion.
          </p>
          <div className="mt-7">
            <Link
              href="/login"
              className="inline-block text-[14px] font-semibold px-5 py-2.5 rounded-[8px]"
              style={{ background: "#fff", color: accentBg }}
            >
              Sign in to your workspace
            </Link>
          </div>
          <p className="text-[12.5px] mt-5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Been given a passcode? Enter it from the top of the page for instant,
            view-only access.
          </p>
        </div>
      </section>

      <footer
        className="text-center text-[12px] py-8 mt-auto"
        style={{ color: sub, borderTop: `1px solid ${border}` }}
      >
        EventFlow Production — plan, price and present any event, all in one deck.
      </footer>
    </div>
  );
}
