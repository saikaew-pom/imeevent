import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { listPresetTasks } from "@/lib/builder/tasks";
import { chatMultimodal } from "@/lib/ai/minimax";
import { SuggestedTask } from "@/data/documents";
import { CATEGORY_LABELS, TaskCategory } from "@/data/tasks";
import { getEventPreset } from "@/data/eventPresets";

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TASKS = 40;

// Proposes a full replacement task list for one imported preset, given the
// planner's free-text brief. Read-only: it writes nothing — the planner
// reviews the proposal and the /api/builder/tasks/refine route commits it.
// Mirrors the salvage-parse + prompt idiom of /api/builder/documents/suggest.
export async function POST(req: NextRequest) {
  const { slug, presetId, brief } = (await req.json()) as {
    slug: string;
    presetId: string;
    brief: string;
  };
  if (!slug || !presetId) {
    return NextResponse.json({ error: "Missing slug or presetId." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't refine presets." }, { status: 403 });
  }

  const preset = getEventPreset(presetId);
  if (!preset) return NextResponse.json({ error: "Unknown preset." }, { status: 400 });

  const current = await listPresetTasks(access.project.id, presetId);
  if (current.length === 0) {
    return NextResponse.json(
      { error: "That preset has no tasks in this project." },
      { status: 400 }
    );
  }

  const eventDate = access.project.eventDate ?? "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const currentList = current
    .map((t) => `- ${t.title} [${t.category}]${t.dueDate ? ` (due ${t.dueDate})` : ""}`)
    .join("\n");

  const prompt = `You are an event planning assistant refining an existing "${preset.name}" prep-task checklist.

Today: ${today}
Event date: ${eventDate}

The planner's current "${preset.name}" tasks:
${currentList}

The planner's refinement request:
"${(brief ?? "").slice(0, 2000).trim() || "(no specific instructions — tighten and improve the list)"}"

Rewrite the FULL task list for this preset to satisfy the request: keep what still applies, edit or re-date tasks where the request implies it, add anything missing, and drop anything the request removes. Return ONLY a JSON array (no markdown fences) of the complete new list (up to ${MAX_TASKS} tasks), each item exactly:
{"title": "short actionable task", "category": "one of: ${VALID_CATEGORIES.join(", ")}", "description": "1 short sentence", "dueDate": "YYYY-MM-DD or null"}
Keep every dueDate on or before the event date and consistent with the timeline. This list will REPLACE the current one.`;

  let raw: string;
  try {
    raw = await chatMultimodal(prompt, [], 3000);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed." },
      { status: 502 }
    );
  }

  const suggestions = parseSuggestions(raw);
  if (suggestions.length === 0) {
    return NextResponse.json(
      { error: "The AI returned no usable tasks. Try again or adjust your brief." },
      { status: 502 }
    );
  }
  return NextResponse.json({ suggestions });
}

function parseSuggestions(raw: string): SuggestedTask[] {
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
      const category =
        typeof x.category === "string" && VALID_CATEGORIES.includes(x.category as TaskCategory)
          ? (x.category as string)
          : "general";
      const dueDate = typeof x.dueDate === "string" && DATE_RE.test(x.dueDate) ? x.dueDate : null;
      return {
        title: typeof x.title === "string" ? x.title.slice(0, 200) : "",
        description: typeof x.description === "string" ? x.description.slice(0, 500) : "",
        category,
        dueDate,
      };
    })
    .filter((s) => s.title.trim().length > 0)
    .slice(0, MAX_TASKS);
}
