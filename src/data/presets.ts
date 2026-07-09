import { acts, Act, ThemeKey, Placement } from "./acts";

// Preset engine: given a theme, a target vibe level and a number of shows,
// generate a suggested lineup that forms a rising energy curve — a welcome act,
// then N escalating shows ending on the highest-energy finale. Deterministic so
// the same inputs always give the same suggestion.

export type VibeLevel = "elegant" | "balanced" | "high";

export interface SuggestedSlot {
  slot: Placement;
  actId: string;
  rationale: string;
}

export interface Suggestion {
  slots: SuggestedSlot[];
  summary: string;
}

export const VIBE_LABELS: Record<VibeLevel, string> = {
  elegant: "Elegant & refined",
  balanced: "Balanced arc",
  high: "High-energy",
};

// Target peak energy by vibe — shapes how hot the finale should run.
const vibePeak: Record<VibeLevel, number> = {
  elegant: 7,
  balanced: 9,
  high: 10,
};

const inTheme = (a: Act, theme: ThemeKey | "mixed") =>
  theme === "mixed" ? true : a.themes.includes(theme);

// Pick the best act for a slot given constraints, avoiding already-used ids.
function pick(
  candidates: Act[],
  opts: {
    slot: Placement;
    minEnergy?: number;
    maxEnergy?: number;
    used: Set<string>;
    preferDark?: boolean;
  }
): Act | undefined {
  const { slot, minEnergy = 0, maxEnergy = 10, used, preferDark } = opts;
  const pool = candidates
    .filter((a) => !used.has(a.id))
    .filter((a): a is Act & { energy: number; placement: Placement[] } =>
      Boolean(a.placement && typeof a.energy === "number")
    )
    .filter((a) => a.placement.includes(slot))
    .filter((a) => a.energy >= minEnergy && a.energy <= maxEnergy);
  if (pool.length === 0) return undefined;
  // Rank: closeness to the middle of the energy window, then dark preference.
  const target = (minEnergy + maxEnergy) / 2;
  return pool.sort((a, b) => {
    const da = Math.abs(a.energy - target);
    const db = Math.abs(b.energy - target);
    if (da !== db) return da - db;
    if (preferDark) return Number(b.requiresDark) - Number(a.requiresDark);
    return b.energy - a.energy;
  })[0];
}

export function buildSuggestion(
  theme: ThemeKey | "mixed",
  vibe: VibeLevel,
  numShows: number
): Suggestion {
  const used = new Set<string>();
  const slots: SuggestedSlot[] = [];
  const themed = acts.filter((a) => inTheme(a, theme));
  // Fallback pool: if a themed slot can't be filled, borrow from all acts.
  const all = acts;

  const peak = vibePeak[vibe];

  // 1) Welcome — always a low-energy, roaming/ambient act.
  const welcome =
    pick(themed, { slot: "welcome", maxEnergy: 5, used }) ??
    pick(all, { slot: "welcome", maxEnergy: 6, used });
  if (welcome) {
    used.add(welcome.id);
    slots.push({
      slot: "welcome",
      actId: welcome.id,
      rationale:
        "Low-key arrival act — sets tone without demanding attention while guests filter in.",
    });
  }

  // 2) Escalating shows: distribute energy from a gentle opener up to the peak.
  // Reserve the last show as the finale.
  const showCount = Math.max(1, Math.min(numShows, 5));
  for (let i = 0; i < showCount; i++) {
    const isFinale = i === showCount - 1;
    const t = showCount === 1 ? 1 : i / (showCount - 1); // 0..1 across the arc
    // Energy window climbs across the arc toward the vibe peak.
    const floor = vibe === "elegant" ? 3 : 4;
    const targetEnergy = floor + t * (peak - floor);
    const minEnergy = Math.max(2, targetEnergy - 2);
    const maxEnergy = Math.min(10, targetEnergy + 1.5);

    const slot: Placement = isFinale ? "finale" : i === 0 ? "opening" : "mid";

    let chosen =
      pick(themed, { slot, minEnergy, maxEnergy, used, preferDark: isFinale }) ??
      pick(all, { slot, minEnergy, maxEnergy, used, preferDark: isFinale });

    // Finale must be the highest-energy act — if theme lacks a strong finale,
    // fall back to the hottest available finale-capable act.
    if (isFinale && (!chosen || (chosen.energy ?? 0) < peak - 2)) {
      const strongFinale =
        pick(all, { slot: "finale", minEnergy: peak - 2, used, preferDark: true }) ??
        chosen;
      if (strongFinale) chosen = strongFinale;
    }

    if (chosen) {
      used.add(chosen.id);
      const label = chosen.energyLabel ?? "";
      slots.push({
        slot,
        actId: chosen.id,
        rationale: isFinale
          ? `Peak of the night (${label}) — biggest, warmest act, hands straight into the party.`
          : i === 0
          ? `Opener at ${label.toLowerCase()} energy — visual and premium while the room is fresh.`
          : `Mid-stage lift (${label}) — re-raises the room and steps the curve upward.`,
      });
    }
  }

  const themeName = theme === "mixed" ? "mixed international" : theme;
  const lastSlot = slots[slots.length - 1];
  const finaleLabel = lastSlot
    ? acts.find((a) => a.id === lastSlot.actId)?.energyLabel?.toLowerCase()
    : undefined;
  const summary = `${showCount}-show ${VIBE_LABELS[vibe].toLowerCase()} arc on a ${themeName} theme — a rising curve from a soft welcome to a ${
    finaleLabel ?? "high"
  }-energy finale.`;

  return { slots, summary };
}

// A couple of signature ready-made presets for instant demos.
export const signaturePresets: {
  id: string;
  name: string;
  theme: ThemeKey | "mixed";
  vibe: VibeLevel;
  numShows: number;
}[] = [
  { id: "jw-garden", name: "JW Garden Night (as booked)", theme: "led", vibe: "balanced", numShows: 3 },
  { id: "thai-elegant", name: "Thai Elegance", theme: "thai", vibe: "elegant", numShows: 3 },
  { id: "auspicious", name: "Chinese Auspicious Gala", theme: "chinese", vibe: "high", numShows: 4 },
  { id: "world-mix", name: "World Mix Spectacular", theme: "mixed", vibe: "high", numShows: 5 },
];
