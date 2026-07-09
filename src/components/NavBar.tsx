"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/flow", label: "Event Flow" },
  { href: "/builder", label: "Show & Decor Builder" },
  { href: "/revenue", label: "Revenue" },
  { href: "/costing", label: "Costing" },
  { href: "/finale", label: "Finale" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header
      className="sticky top-0 z-40 border-b hairline backdrop-blur-md"
      style={{ background: "rgba(10,15,13,0.82)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--gold-bright), var(--emerald))",
            }}
          />
          <span className="font-display italic text-[15px] gold-gradient font-semibold">
            JW Gala Garden Night
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/present"
            className="nav-link ml-1"
            style={{ color: "var(--emerald-bright)" }}
          >
            ▸ Present
          </Link>
          <Link href="/projects" className="nav-link">
            Projects
          </Link>
          <SignOutButton className="nav-link" />
        </nav>
      </div>
    </header>
  );
}
