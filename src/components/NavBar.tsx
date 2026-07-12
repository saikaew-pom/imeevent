"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { useProject } from "@/components/ProjectProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { seg: "dashboard", label: "Overview" },
  { seg: "flow", label: "Event Flow" },
  { seg: "builder", label: "Show & Decor Builder" },
  { seg: "revenue", label: "Revenue" },
  { seg: "costing", label: "Costing" },
  { seg: "timeline", label: "Timeline" },
  { seg: "media", label: "Media" },
];

export function NavBar() {
  const pathname = usePathname();
  const { slug, name } = useProject();
  const base = `/p/${slug}`;
  return (
    <header
      className="sticky top-0 z-40 border-b hairline backdrop-blur-md"
      style={{ background: "rgba(var(--bg-rgb), 0.82)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 h-14 flex items-center justify-between gap-4">
        <Link href={`${base}/dashboard`} className="flex items-center gap-2.5 shrink-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--gold-bright), var(--emerald))",
            }}
          />
          <span className="font-display italic text-[15px] gold-gradient font-semibold">
            {name}
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {links.map((l) => {
            const href = `${base}/${l.seg}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={l.seg}
                href={href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href={`${base}/present`}
            className="nav-link ml-1"
            style={{ color: "var(--emerald-bright)" }}
          >
            ▸ Present
          </Link>
          <Link href="/projects" className="nav-link">
            Projects
          </Link>
          <ThemeToggle isDarkDefault className="nav-link" />
          <SignOutButton className="nav-link" />
        </nav>
      </div>
    </header>
  );
}
