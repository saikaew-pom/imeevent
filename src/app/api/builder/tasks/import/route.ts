import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { createTasksBulk, BulkTaskInput } from "@/lib/builder/tasks";
import { setProjectEventDate } from "@/lib/auth/queries";
import { getEventPreset, offsetToDate } from "@/data/eventPresets";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const { slug, presetId, eventDate } = (await req.json()) as {
    slug: string;
    presetId: string;
    eventDate: string;
  };
  if (!slug || !presetId || !eventDate) {
    return NextResponse.json({ error: "Missing slug, presetId or eventDate." }, { status: 400 });
  }
  if (!DATE_RE.test(eventDate)) {
    return NextResponse.json({ error: "Event date must be YYYY-MM-DD." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't import presets." }, { status: 403 });
  }

  const preset = getEventPreset(presetId);
  if (!preset) return NextResponse.json({ error: "Unknown preset." }, { status: 400 });

  // Expand templates to concrete tasks; order chronologically (earliest due
  // first) so sort_order reads naturally within each category group.
  const sortKey = (t: (typeof preset.tasks)[number]) =>
    t.dueOffsetDays ?? t.startOffsetDays ?? -Infinity;
  const ordered = [...preset.tasks].sort((a, b) => sortKey(b) - sortKey(a));

  const rows: BulkTaskInput[] = ordered.map((tpl, i) => ({
    title: tpl.title,
    description: tpl.description,
    category: tpl.category,
    status: tpl.status ?? "todo",
    startDate: offsetToDate(eventDate, tpl.startOffsetDays),
    dueDate: offsetToDate(eventDate, tpl.dueOffsetDays),
    assigneeId: null,
    sortOrder: i,
  }));

  const tasks = await createTasksBulk(access.project.id, access.user.id, rows);
  await setProjectEventDate(access.project.id, eventDate);

  return NextResponse.json({ tasks, eventDate });
}
