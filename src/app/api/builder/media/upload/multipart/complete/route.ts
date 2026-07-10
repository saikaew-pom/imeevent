import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";
import { createMediaAsset } from "@/lib/builder/media";

// Finalizes a chunked upload and registers the resulting file as a
// MediaAsset in one step — the file already exists in R2 at this point.
export async function POST(req: NextRequest) {
  const { slug, key, uploadId, parts, kind, name, mime } = (await req.json()) as {
    slug: string;
    key: string;
    uploadId: string;
    parts: { partNumber: number; etag: string }[];
    kind: "video" | "audio";
    name: string;
    mime: string;
  };
  if (!slug || !key || !uploadId || !parts?.length || !kind) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
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
  await upload.complete(parts);

  const asset = await createMediaAsset(access.project.id, access.user.id, {
    kind,
    name: name?.trim() || "Untitled",
    fileKey: key,
    posterKey: null,
    mime: mime || null,
  });

  return NextResponse.json({ asset });
}
