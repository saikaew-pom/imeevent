import { NextRequest, NextResponse } from "next/server";
import { NewActInput } from "@/data/acts";
import { getProjectAccess, canWrite, ProjectAccess } from "@/lib/builder/access";
import { updateCustomAct, deleteCustomAct, customActExists } from "@/lib/builder/customActs";

async function checkAccess(
  id: string,
  slug: string
): Promise<{ access: ProjectAccess } | { error: NextResponse }> {
  const access = await getProjectAccess(slug);
  if (!access) return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  if (!canWrite(access.role)) {
    return { error: NextResponse.json({ error: "Viewers can't edit items." }, { status: 403 }) };
  }
  const exists = await customActExists(access.project.id, id);
  if (!exists) {
    return { error: NextResponse.json({ error: "Item not found." }, { status: 404 }) };
  }
  return { access };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { slug, input } = (await req.json()) as { slug: string; input: NewActInput };
  if (!slug || !input) {
    return NextResponse.json({ error: "Missing slug or input." }, { status: 400 });
  }

  const check = await checkAccess(id, slug);
  if ("error" in check) return check.error;

  await updateCustomAct(check.access.project.id, id, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const check = await checkAccess(id, slug);
  if ("error" in check) return check.error;

  await deleteCustomAct(check.access.project.id, id);
  return NextResponse.json({ ok: true });
}
