import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { listTasks } from "@/lib/builder/tasks";
import { chatMultimodal } from "@/lib/ai/minimax";
import { TimelineFinding, FindingSeverity } from "@/data/tasks";

const VALID_SEVERITIES: FindingSeverity[] = ["risk", "gap", "tip"];

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't run an AI review." }, { status: 403 });
  }

  const tasks = await listTasks(access.project.id);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "Add some tasks first." }, { status: 400 });
  }

  const eventDate = access.project.eventDate ?? "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const taskIds = tasks.map((t) => t.id).join(", ");
  const taskLines = tasks
    .map(
      (t) =>
        `- id=${t.id} | ${t.title} | ${t.category} | ${t.status}${
          t.startDate ? ` | starts ${t.startDate}` : ""
        }${t.dueDate ? ` | due ${t.dueDate}` : ""} | assignee: ${
          t.assigneeName ?? "unassigned"
        } | notes: ${t.description || "(empty)"}`
    )
    .join("\n");

  const prompt = `You are an experienced event producer reviewing a prep-task timeline (not the run-of-show on the night itself — this is everything that has to happen BEFORE the event). Read the full list below and flag real problems and opportunities — not generic advice.

Today: ${today}
Event date: ${eventDate}

Look specifically for:
- Overdue tasks (due date before today) that aren't done
- Tasks due after the event date, or with a start date after their own due date
- Tasks with no assignee, especially ones close to their due date
- Obvious gaps: categories with zero tasks that a real event of this kind would need
- Duplicate or near-duplicate tasks

Tasks (ids: ${taskIds}):
${taskLines}

Return ONLY a JSON array (no markdown fences) of up to 8 findings, most important first. Each item exactly:
{"severity": "risk" | "gap" | "tip", "taskId": "<one of the ids above, or null if about the timeline as a whole>", "title": "short (max 8 words)", "detail": "1-2 sentences, specific and actionable"}
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

  const validIds = new Set(tasks.map((t) => t.id));
  const findings = parseFindings(raw, validIds);
  return NextResponse.json({ findings });
}

function parseFindings(raw: string, validIds: Set<string>): TimelineFinding[] {
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
      const taskId = typeof x.taskId === "string" && validIds.has(x.taskId) ? x.taskId : null;
      return {
        severity,
        taskId,
        title: typeof x.title === "string" ? x.title.slice(0, 120) : "",
        detail: typeof x.detail === "string" ? x.detail.slice(0, 500) : "",
      };
    })
    .filter((f) => f.title.trim().length > 0)
    .slice(0, 8);
}
