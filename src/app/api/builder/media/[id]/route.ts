import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { renameMediaAsset, deleteMediaAsset } from "@/lib/builder/media";
import { getPhotosBucket } from "@/lib/cf";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { slug, name } = (await req.json()) as { slug: string; name: string };
  if (!slug || !name) return NextResponse.json({ error: "Missing slug or name." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't rename media." }, { status: 403 });
  }

  await renameMediaAsset(access.project.id, id, name);
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
    return NextResponse.json({ error: "Viewers can't delete media." }, { status: 403 });
  }

  const removed = await deleteMediaAsset(access.project.id, id);
  if (removed) {
    const bucket = await getPhotosBucket();
    if (removed.fileKey) await bucket.delete(removed.fileKey).catch(() => {});
    if (removed.posterKey) await bucket.delete(removed.posterKey).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
