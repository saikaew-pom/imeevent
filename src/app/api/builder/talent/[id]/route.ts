import { NextRequest, NextResponse } from "next/server";
import { NewTalentInput } from "@/data/talent";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { updateTalent, deleteTalent } from "@/lib/builder/talent";
import { getPhotosBucket } from "@/lib/cf";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { slug, input } = (await req.json()) as { slug: string; input: NewTalentInput };
  if (!slug || !input) {
    return NextResponse.json({ error: "Missing slug or input." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't edit talent." }, { status: 403 });
  }

  await updateTalent(access.project.id, id, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't delete talent." }, { status: 403 });
  }

  const photoKey = await deleteTalent(access.project.id, id);
  if (photoKey) {
    const bucket = await getPhotosBucket();
    await bucket.delete(photoKey).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
