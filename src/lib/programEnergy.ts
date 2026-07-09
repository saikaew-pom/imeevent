import { Act, findAct } from "@/data/acts";
import { Beat } from "@/data/runOfShow";

// Live energy for a program beat: if it has linked SHOW acts, energy is the
// average of those acts' energy scores (recalculated in real time as the
// lineup/links change). Otherwise it falls back to the beat's manual baseline
// energy (editable in the planner for non-show beats like buffet/transitions).
export function liveBeatEnergy(beat: Beat, custom: Act[]): number {
  const linked = (beat.linkedActs ?? [])
    .map((id) => findAct(id, custom))
    .filter(
      (a): a is Act => a != null && a.kind === "show" && typeof a.energy === "number"
    );
  if (linked.length === 0) return beat.energy;
  const avg = linked.reduce((s, a) => s + (a.energy ?? 0), 0) / linked.length;
  return Math.round(avg * 10) / 10;
}
