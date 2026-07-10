import { NextRequest, NextResponse } from "next/server";
import { NewTaskInput } from "@/data/tasks";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { listTasks, createTask } from "@/lib/builder/tasks";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const tasks = await listTasks(access.project.id);
  return NextResponse.json({ role: access.role, tasks, eventDate: access.project.eventDate });
}

export async function POST(req: NextRequest) {
  const { slug, input } = (await req.json()) as { slug: string; input: NewTaskInput };
  if (!slug || !input) {
    return NextResponse.json({ error: "Missing slug or input." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't add tasks." }, { status: 403 });
  }

  const task = await createTask(access.project.id, access.user.id, input);
  return NextResponse.json({ task });
}
