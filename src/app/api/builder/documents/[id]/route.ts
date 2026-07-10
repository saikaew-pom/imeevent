import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { deleteDocument } from "@/lib/builder/documents";
import { getPhotosBucket } from "@/lib/cf";

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
    return NextResponse.json({ error: "Viewers can't delete documents." }, { status: 403 });
  }

  const fileKey = await deleteDocument(access.project.id, id);
  if (fileKey) {
    const bucket = await getPhotosBucket();
    await bucket.delete(fileKey).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
