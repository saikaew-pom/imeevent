import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ALLOWED = new Set([
  "application/pdf",
  DOCX_MIME,
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Stores a document file (PDF, Word doc, or image) in R2 under docs/. Returns
// the key, which is served (publicly) via /api/builder/photo/<key>.
export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't upload documents." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, Word (.docx), or image files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 15MB)." }, { status: 400 });
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === DOCX_MIME
      ? "docx"
      : file.type.split("/")[1] ?? "bin";
  const key = `docs/${access.project.id}/${crypto.randomUUID()}.${ext}`;
  const bucket = await getPhotosBucket();
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return NextResponse.json({ key, url: `/api/builder/photo/${key}` });
}
