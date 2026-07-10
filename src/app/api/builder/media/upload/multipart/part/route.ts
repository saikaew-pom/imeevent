import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";

// Uploads a single chunk (the client caps each one well under Cloudflare's
// request-body/memory limits, so this never risks buffering a huge file).
export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const key = req.nextUrl.searchParams.get("key");
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  const partNumber = Number(req.nextUrl.searchParams.get("partNumber"));
  if (!slug || !key || !uploadId || !partNumber) {
    return NextResponse.json(
      { error: "Missing slug, key, uploadId, or partNumber." },
      { status: 400 }
    );
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't upload media." }, { status: 403 });
  }
  // The key is namespaced by project id, so a writer on one project can't
  // target another project's in-progress upload.
  if (!key.startsWith(`media/${access.project.id}/`)) {
    return NextResponse.json({ error: "Key does not belong to this project." }, { status: 403 });
  }

  const bytes = await req.arrayBuffer();
  const bucket = await getPhotosBucket();
  const upload = bucket.resumeMultipartUpload(key, uploadId);
  const part = await upload.uploadPart(partNumber, bytes);

  return NextResponse.json({ partNumber: part.partNumber, etag: part.etag });
}
