"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const STORAGE_KEY = "eventflow-theme";

// One shared `data-theme` attribute on <html> drives both surfaces' CSS var
// overrides (see globals.css) — but each surface has its own native default
// before any explicit preference exists: the gala dashboard is dark, the
// account pages (projects/admin/library/login/landing) are light. A toggle
// rendered on a dashboard page passes isDarkDefault so it shows the right
// icon on first paint; account pages leave it false. Clicking always writes
// an explicit "light" or "dark" value, which is what actually flips both
// surfaces (see globals.css's [data-theme="light"|"dark"] blocks) — the
// no-preference "mixed" default (today's exact look everywhere) is only
// ever the pre-first-click state, never something a click returns to.
export function ThemeToggle({
  isDarkDefault = false,
  className,
  style,
}: {
  isDarkDefault?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [isDark, setIsDark] = useState(isDarkDefault);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setIsDark(current === "dark" || (current !== "light" && isDarkDefault));
  }, [isDarkDefault]);

  const toggle = () => {
    const next: "light" | "dark" = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private browsing, quota) — toggle still works for
      // this page load, it just won't persist to the next visit.
    }
    setIsDark(!isDark);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      style={{ cursor: "pointer", lineHeight: 1, ...style }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
