import { Act, findAct, Placement } from "@/data/acts";
import { LineupItem } from "@/store/useDeck";
import { CurvePoint } from "@/components/EnergyCurve";

export const SLOT_ORDER: Placement[] = ["welcome", "opening", "mid", "finale"];

// Return the lineup items sorted into canonical night order (welcome → finale),
// preserving the user's within-slot ordering. `custom` is the user's custom
// acts list so lineup items pointing at a custom act still resolve.
export function orderedLineup(
  lineup: LineupItem[],
  custom: Act[] = []
): (LineupItem & { act: Act })[] {
  const bySlot = (slot: Placement) => lineup.filter((i) => i.slot === slot);
  return SLOT_ORDER.flatMap(bySlot)
    .map((i) => {
      const act = findAct(i.actId, custom);
      return act ? { ...i, act } : null;
    })
    .filter((x): x is LineupItem & { act: Act } => Boolean(x));
}

const energyOf = (a: Act) => a.energy ?? 0;

export function curvePoints(lineup: LineupItem[], custom: Act[] = []): CurvePoint[] {
  const ordered = orderedLineup(lineup, custom);
  const maxEnergy = Math.max(...ordered.map((o) => energyOf(o.act)), 0);
  return ordered.map((o) => ({
    label: o.act.name.split(" ")[0],
    sublabel: o.act.name,
    energy: energyOf(o.act),
    highlight: o.slot === "finale" && energyOf(o.act) === maxEnergy,
  }));
}

export interface Warning {
  level: "warn" | "info";
  text: string;
}

export function analyzeLineup(lineup: LineupItem[], custom: Act[] = []): Warning[] {
  const ordered = orderedLineup(lineup, custom);
  const warnings: Warning[] = [];
  if (ordered.length === 0) return warnings;

  const finales = ordered.filter((o) => o.slot === "finale");
  const maxEnergy = Math.max(...ordered.map((o) => energyOf(o.act)));

  // Finale should be the peak.
  if (finales.length === 0) {
    warnings.push({
      level: "warn",
      text: "No finale act — the night has no clear peak to build toward.",
    });
  } else {
    const finaleMax = Math.max(...finales.map((o) => energyOf(o.act)));
    if (finaleMax < maxEnergy) {
      const bigger = ordered.find((o) => energyOf(o.act) === maxEnergy);
      warnings.push({
        level: "warn",
        text: `Finale isn't the peak — ${bigger?.act.name} (${bigger?.act.energyLabel}) is hotter than your finale. Move the biggest act last.`,
      });
    }
  }

  // Two adjacent low-energy acts — but a low-energy welcome/arrival act is
  // meant to be gentle, so don't flag the welcome→next transition.
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i - 1].slot === "welcome") continue;
    if (energyOf(ordered[i].act) <= 3 && energyOf(ordered[i - 1].act) <= 3) {
      warnings.push({
        level: "warn",
        text: `Two low-energy acts back to back (${ordered[i - 1].act.name} → ${ordered[i].act.name}) — the room may sag. Space them out.`,
      });
      break;
    }
  }

  // requiresDark act placed in the welcome (daylight arrival) slot.
  const daylightLED = ordered.find(
    (o) => o.slot === "welcome" && o.act.requiresDark
  );
  if (daylightLED) {
    warnings.push({
      level: "warn",
      text: `${daylightLED.act.name} needs low light — it won't read during the welcome/arrival. Move it later in the evening.`,
    });
  }

  // A large energy drop that isn't a deliberate baseline reset.
  for (let i = 1; i < ordered.length; i++) {
    const drop = energyOf(ordered[i - 1].act) - energyOf(ordered[i].act);
    if (drop >= 4 && ordered[i].slot !== "welcome") {
      warnings.push({
        level: "info",
        text: `Sharp drop after ${ordered[i - 1].act.name} — fine if the band/DJ fills the gap, otherwise it may feel like a comedown.`,
      });
      break;
    }
  }

  // Rising-arc check: is the overall trend upward?
  if (ordered.length >= 3) {
    const firstHalf =
      ordered.slice(0, Math.floor(ordered.length / 2)).reduce((s, o) => s + energyOf(o.act), 0) /
      Math.floor(ordered.length / 2);
    const secondHalf =
      ordered.slice(Math.floor(ordered.length / 2)).reduce((s, o) => s + energyOf(o.act), 0) /
      Math.ceil(ordered.length / 2);
    if (secondHalf <= firstHalf) {
      warnings.push({
        level: "info",
        text: "The energy doesn't rise across the night — consider front-loading calmer acts and escalating toward the finale.",
      });
    }
  }

  return warnings;
}

export function lineupTotals(lineup: LineupItem[], custom: Act[] = []) {
  const ordered = orderedLineup(lineup, custom);
  return {
    count: ordered.length,
    totalCost: ordered.reduce((s, o) => s + o.act.costTHB, 0),
    totalDuration: ordered.reduce((s, o) => s + o.act.durationMin, 0),
    avgEnergy:
      ordered.length === 0
        ? 0
        : ordered.reduce((s, o) => s + energyOf(o.act), 0) / ordered.length,
  };
}
