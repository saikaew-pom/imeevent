import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import {
  listPresetTasks,
  deleteTasksByIds,
  createTasksBulk,
  BulkTaskInput,
} from "@/lib/builder/tasks";
import { SuggestedTask } from "@/data/documents";
import { CATEGORY_LABELS, TaskCategory } from "@/data/tasks";
import { getEventPreset } from "@/data/eventPresets";

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TASKS = 60;

// Commits a refined preset: replaces every task tagged with this preset by the
// planner-approved set, tagging the new rows with the same preset_id.
//
// Ordering matters — D1 exposes no transaction here, so we capture the old ids,
// INSERT the replacements first, and only then DELETE the old ids. A mid-insert
// failure therefore can't wipe the existing tasks (worst case: some new rows
// plus all old rows survive, which the planner can re-refine). Deleting by
// preset_id instead would also destroy the rows we just inserted.
export async function POST(req: NextRequest) {
  const { slug, presetId, tasks } = (await req.json()) as {
    slug: string;
    presetId: string;
    tasks: SuggestedTask[];
  };
  if (!slug || !presetId) {
    return NextResponse.json({ error: "Missing slug or presetId." }, { status: 400 });
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: "Select at least one task to apply." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't refine presets." }, { status: 403 });
  }
  if (!getEventPreset(presetId)) {
    return NextResponse.json({ error: "Unknown preset." }, { status: 400 });
  }

  const rows: BulkTaskInput[] = tasks
    .slice(0, MAX_TASKS)
    .map((t, i) => ({
      title: typeof t.title === "string" ? t.title.slice(0, 200) : "",
      description: typeof t.description === "string" ? t.description.slice(0, 500) : "",
      category: VALID_CATEGORIES.includes(t.category as TaskCategory)
        ? (t.category as TaskCategory)
        : "general",
      status: "todo" as const,
      startDate: null,
      dueDate: typeof t.dueDate === "string" && DATE_RE.test(t.dueDate) ? t.dueDate : null,
      assigneeId: null,
      sortOrder: i,
    }))
    .filter((r) => r.title.trim().length > 0);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid tasks to apply." }, { status: 400 });
  }

  // Capture the ids being replaced BEFORE inserting the new set.
  const existing = await listPresetTasks(access.project.id, presetId);
  const oldIds = existing.map((t) => t.id);

  const created = await createTasksBulk(access.project.id, access.user.id, rows, presetId);
  await deleteTasksByIds(access.project.id, oldIds);

  return NextResponse.json({ tasks: created, removed: oldIds.length });
}
