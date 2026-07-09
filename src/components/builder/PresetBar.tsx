"use client";

import { useDeck } from "@/store/useDeck";
import { THEME_LABELS, ThemeKey } from "@/data/acts";
import {
  buildSuggestion,
  VIBE_LABELS,
  VibeLevel,
  signaturePresets,
} from "@/data/presets";

const themeOptions: (ThemeKey | "mixed")[] = [
  "mixed",
  "thai",
  "garden",
  "chinese",
  "led",
  "indian",
  "cabaret",
  "circus",
];

export function PresetBar() {
  const { theme, vibe, numShows, setTheme, setVibe, setNumShows, applySuggestion } =
    useDeck();

  const generate = (
    t = theme,
    v = vibe,
    n = numShows
  ) => {
    const s = buildSuggestion(t, v, n);
    applySuggestion(s.slots.map(({ slot, actId }) => ({ slot, actId })));
  };

  return (
    <section className="panel px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold gold-text">Preset suggestions</h3>
        <span className="text-[11px] text-[var(--text-faint)]">
          Theme + vibe + shows → a rising-curve lineup
        </span>
      </div>

      <div className="grid md:grid-cols-4 gap-3 items-end">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            Theme
          </span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeKey | "mixed")}
            className="w-full mt-1"
          >
            {themeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "mixed" ? "Mixed International" : THEME_LABELS[t as ThemeKey]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            Vibe level
          </span>
          <select
            value={vibe}
            onChange={(e) => setVibe(e.target.value as VibeLevel)}
            className="w-full mt-1"
          >
            {(Object.keys(VIBE_LABELS) as VibeLevel[]).map((v) => (
              <option key={v} value={v}>
                {VIBE_LABELS[v]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            Number of shows: {numShows}
          </span>
          <input
            type="range"
            min={1}
            max={5}
            value={numShows}
            onChange={(e) => setNumShows(Number(e.target.value))}
            className="w-full mt-3"
          />
        </label>

        <button className="btn btn-gold w-full" onClick={() => generate()}>
          ✦ Generate lineup
        </button>
      </div>

      <div className="mt-4 pt-4 border-t hairline">
        <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
          Or start from a signature preset
        </div>
        <div className="flex flex-wrap gap-2">
          {signaturePresets.map((p) => (
            <button
              key={p.id}
              className="btn py-1.5 px-3 text-[12px]"
              onClick={() => {
                setTheme(p.theme);
                setVibe(p.vibe);
                setNumShows(p.numShows);
                generate(p.theme, p.vibe, p.numShows);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
