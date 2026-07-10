import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";

// Best-effort cleanup when a chunked upload fails partway through, so R2
// doesn't accumulate orphaned incomplete multipart uploads.
export async function POST(req: NextRequest) {
  const { slug, key, uploadId } = (await req.json()) as {
    slug: string;
    key: string;
    uploadId: string;
  };
  if (!slug || !key || !uploadId) {
    return NextResponse.json({ error: "Missing slug, key, or uploadId." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't upload media." }, { status: 403 });
  }
  if (!key.startsWith(`media/${access.project.id}/`)) {
    return NextResponse.json({ error: "Key does not belong to this project." }, { status: 403 });
  }

  const bucket = await getPhotosBucket();
  const upload = bucket.resumeMultipartUpload(key, uploadId);
  await upload.abort().catch(() => {});

  return NextResponse.json({ ok: true });
}
