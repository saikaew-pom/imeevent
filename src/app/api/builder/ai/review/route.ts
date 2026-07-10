import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getProjectState } from "@/lib/builder/projectState";
import { listCustomActs } from "@/lib/builder/customActs";
import { listTalent } from "@/lib/builder/talent";
import { findAct } from "@/data/acts";
import { Beat, ReviewFinding, FindingSeverity, runOfShow } from "@/data/runOfShow";
import { liveBeatEnergy } from "@/lib/programEnergy";
import { chatMultimodal } from "@/lib/ai/minimax";

const VALID_SEVERITIES: FindingSeverity[] = ["risk", "gap", "tip"];

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't run an AI review." }, { status: 403 });
  }

  const state = await getProjectState(access.project.id);
  const program = (state.program as Beat[] | null) ?? runOfShow;
  const [customActs, talent] = await Promise.all([
    listCustomActs(access.project.id),
    listTalent(access.project.id),
  ]);

  const beatIds = program.map((b) => b.id).join(", ");
  const beatLines = program
    .map((b) => {
      const acts = (b.linkedActs ?? [])
        .map((id) => findAct(id, customActs)?.name)
        .filter(Boolean)
        .join(", ");
      const people = (b.linkedTalent ?? [])
        .map((id) => talent.find((t) => t.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      return `- id=${b.id} | ${b.time} (${b.durationMin} min) | ${b.segment} | location: ${b.location} | lead: ${b.lead || "unassigned"} | energy: ${liveBeatEnergy(b, customActs)}/10${b.peak ? ` | PEAK: ${b.peak}` : ""} | linked shows/decor: ${acts || "none"} | linked talent: ${people || "none"} | notes: ${b.what || "(empty)"}`;
    })
    .join("\n");

  const prompt = `You are an experienced live-event producer reviewing a run-of-show timeline for a gala event. Read the full timeline below and flag real problems and opportunities — not generic advice.

Look specifically for:
- Energy dips or flat stretches at the wrong moment (e.g. energy dropping right before a peak, or staying low too long)
- Beats with no lead/cue assigned
- Beats that mention a show, performer, or act in their notes but have nothing linked
- Timing issues: gaps, or a beat's duration that seems too short/long for what it describes
- Missing talent for beats that clearly need one (e.g. an MC-led moment with no MC linked)

Timeline (beat ids: ${beatIds}):
${beatLines}

Return ONLY a JSON array (no markdown fences) of up to 8 findings, most important first. Each item exactly:
{"severity": "risk" | "gap" | "tip", "beatId": "<one of the ids above, or null if about the timeline as a whole>", "title": "short (max 8 words)", "detail": "1-2 sentences, specific and actionable"}
Use "risk" for things that could hurt the event, "gap" for missing/incomplete info, "tip" for optional improvements. If the timeline genuinely has no issues, return [].`;

  let raw: string;
  try {
    raw = await chatMultimodal(prompt, [], 1800);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed." },
      { status: 502 }
    );
  }

  const validIds = new Set(program.map((b) => b.id));
  const findings = parseFindings(raw, validIds);
  return NextResponse.json({ findings });
}

function parseFindings(raw: string, validIds: Set<string>): ReviewFinding[] {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let arr: unknown;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try {
      arr = JSON.parse(m[0]);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x) => {
      const severity = VALID_SEVERITIES.includes(x.severity as FindingSeverity)
        ? (x.severity as FindingSeverity)
        : "tip";
      const beatId = typeof x.beatId === "string" && validIds.has(x.beatId) ? x.beatId : null;
      return {
        severity,
        beatId,
        title: typeof x.title === "string" ? x.title.slice(0, 120) : "",
        detail: typeof x.detail === "string" ? x.detail.slice(0, 500) : "",
      };
    })
    .filter((f) => f.title.trim().length > 0)
    .slice(0, 8);
}
